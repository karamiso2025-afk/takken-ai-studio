/**
 * Direct sync generate endpoint (no Inngest needed)
 * Used for local dev / testing
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { generateScenario } from '@/lib/claude/generate-scenario'
import { generateImage } from '@/lib/gemini/generate-image'

export const maxDuration = 300 // 5 min timeout

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { topic_id, panel_count_override } = body as {
    topic_id: string
    panel_count_override?: number
  }

  if (!topic_id) {
    return NextResponse.json({ error: 'topic_id is required' }, { status: 400 })
  }

  const svc = createServiceClient()

  // Create generated_content record
  const { data: content, error: insertErr } = await svc
    .from('generated_content')
    .insert({ topic_id, user_id: user.id, content_type: 'manga', status: 'generating_scenario' })
    .select()
    .single()

  if (insertErr || !content) {
    return NextResponse.json({ error: insertErr?.message || 'Failed to create content' }, { status: 500 })
  }

  try {
    // Step 1: Get topic
    const { data: topic } = await svc
      .from('topics')
      .select('name, extracted_content')
      .eq('id', topic_id)
      .single()

    if (!topic) throw new Error('Topic not found')

    // Step 2: Generate scenario with Claude
    const scenario = await generateScenario(
      topic.name,
      topic.extracted_content || topic.name,
      panel_count_override
    )

    await svc.from('generated_content').update({
      panel_count: scenario.panel_count,
      cast_json: scenario.cast as unknown as Record<string, unknown>,
      scenario_json: scenario as unknown as Record<string, unknown>,
      status: 'generating_images',
    }).eq('id', content.id)

    // Step 3: Generate images (with SVG fallback)
    for (const panel of scenario.manga_panels) {
      try {
        const imageBuffer = await generateImage(panel.prompt_en)
        const filePath = `${user.id}/${content.id}/panel_${panel.panel_number}.png`

        await svc.storage.from('manga-panels').upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        })

        const { data: urlData } = svc.storage.from('manga-panels').getPublicUrl(filePath)

        await svc.from('content_assets').insert({
          content_id: content.id,
          asset_type: 'image',
          panel_number: panel.panel_number,
          storage_path: filePath,
          public_url: urlData.publicUrl,
          overlay_data: {
            dialogue: panel.dialogue,
            narrator_box: panel.narrator_box,
            info_box: panel.info_box,
            scene: panel.scene,
          } as unknown as Record<string, unknown>,
        })
      } catch {
        // SVG fallback
        const svg = generateSvgFallback(panel)
        const svgBuffer = Buffer.from(svg, 'utf-8')
        const filePath = `${user.id}/${content.id}/panel_${panel.panel_number}_fallback.svg`

        await svc.storage.from('manga-panels').upload(filePath, svgBuffer, {
          contentType: 'image/svg+xml',
          upsert: true,
        })

        const { data: urlData } = svc.storage.from('manga-panels').getPublicUrl(filePath)

        await svc.from('content_assets').insert({
          content_id: content.id,
          asset_type: 'svg_fallback',
          panel_number: panel.panel_number,
          storage_path: filePath,
          public_url: urlData.publicUrl,
          overlay_data: {
            dialogue: panel.dialogue,
            narrator_box: panel.narrator_box,
            info_box: panel.info_box,
            scene: panel.scene,
          } as unknown as Record<string, unknown>,
        })
      }
    }

    // Step 4: Save quiz
    if (scenario.quiz) {
      await svc.from('quizzes').insert({
        topic_id,
        content_id: content.id,
        question: scenario.quiz.question,
        choices: scenario.quiz.choices,
        correct_index: scenario.quiz.correct_index,
        explanation: scenario.quiz.explanation,
        wrong_explanations: scenario.quiz.wrong_explanations as unknown as Record<string, string>,
      })
    }

    // Step 5: Mark complete
    await svc.from('generated_content').update({ status: 'complete' }).eq('id', content.id)
    await svc.from('topics').update({ status: 'has_content' }).eq('id', topic_id)

    return NextResponse.json({ content_id: content.id, status: 'complete', panel_count: scenario.panel_count })

  } catch (err) {
    console.error('[generate/sync]', err)
    await svc.from('generated_content').update({ status: 'failed' }).eq('id', content.id)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

function generateSvgFallback(panel: {
  panel_number: number
  scene: string
  dialogue: { character: string; text: string }[]
  narrator_box?: string
  info_box?: string
}): string {
  const dialogueTexts = panel.dialogue
    .map((d, i) => `<text x="20" y="${80 + i * 30}" font-size="14" fill="#333">${d.character}: ${d.text}</text>`)
    .join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200" viewBox="0 0 280 200">
  <rect width="280" height="200" fill="#FFF8E1" stroke="#E0D4B0" stroke-width="2" rx="8"/>
  <text x="140" y="25" text-anchor="middle" font-size="12" fill="#666">Panel ${panel.panel_number}</text>
  <line x1="10" y1="35" x2="270" y2="35" stroke="#E0D4B0"/>
  <text x="140" y="55" text-anchor="middle" font-size="11" fill="#888">${panel.scene.slice(0, 30)}</text>
  ${dialogueTexts}
  ${panel.info_box ? `<rect x="10" y="160" width="260" height="30" fill="#E3F2FD" rx="4"/>
  <text x="140" y="180" text-anchor="middle" font-size="10" fill="#1565C0">${panel.info_box.slice(0, 40)}</text>` : ''}
</svg>`
}
