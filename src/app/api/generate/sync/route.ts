/**
 * Direct sync generate endpoint (no Inngest needed)
 * Used for local dev / testing
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { generateScenario } from '@/lib/claude/generate-scenario'
import { generateImage } from '@/lib/gemini/generate-image'
import { getCharacterByKey } from '@/lib/characters'

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

    // Step 3: Generate images in parallel (with SVG fallback per panel)
    await Promise.all(scenario.manga_panels.map(async (panel) => {
      const overlayData = {
        dialogue: panel.dialogue,
        narrator_box: panel.narrator_box,
        info_box: panel.info_box,
        scene: panel.scene,
      } as unknown as Record<string, unknown>

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
          overlay_data: overlayData,
        })
      } catch (imgErr) {
        console.warn(`[generate/sync] Image gen failed panel ${panel.panel_number}:`, imgErr)
        // SVG fallback — store overlay_data so MangaViewer can render it
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
          overlay_data: overlayData,
        })
      }
    }))

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

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generateSvgFallback(panel: {
  panel_number: number
  scene: string
  dialogue: { character: string; text: string }[]
  narrator_box?: string
  info_box?: string
}): string {
  // キャラクターキーを日本語名に変換
  const getCharName = (key: string) => {
    const char = getCharacterByKey(key)
    return char ? char.name.split(' ')[0] : key  // 「田中」のように姓だけ
  }

  // 吹き出しを交互左右に配置（最大4つ）
  const bubbles = panel.dialogue.slice(0, 4).map((d, i) => {
    const isLeft = i % 2 === 0
    const x = isLeft ? 15 : 145
    const y = 50 + i * 38
    const name = escapeXml(getCharName(d.character))
    const text = escapeXml(d.text.slice(0, 22))
    const bubbleColor = isLeft ? '#FFF9C4' : '#E8F5E9'
    const nameColor = isLeft ? '#F57F17' : '#2E7D32'
    return `
  <rect x="${x}" y="${y}" width="120" height="30" fill="${bubbleColor}" stroke="#ccc" stroke-width="1" rx="6"/>
  <text x="${x + 4}" y="${y + 11}" font-size="9" fill="${nameColor}" font-weight="bold">${name}</text>
  <text x="${x + 4}" y="${y + 24}" font-size="11" fill="#333">${text}</text>`
  }).join('')

  const infoBoxSvg = panel.info_box
    ? `<rect x="8" y="170" width="264" height="24" fill="#1565C0" rx="4"/>
  <text x="140" y="186" text-anchor="middle" font-size="11" fill="white" font-weight="bold">📌 ${escapeXml(panel.info_box.slice(0, 24))}</text>`
    : ''

  const sceneText = escapeXml(panel.scene.slice(0, 20))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200" viewBox="0 0 280 200">
  <rect width="280" height="200" fill="#FFFDE7" stroke="#E0D4B0" stroke-width="2" rx="8"/>
  <rect width="280" height="30" fill="#795548" rx="8"/>
  <rect x="0" y="20" width="280" height="10" fill="#795548"/>
  <text x="140" y="20" text-anchor="middle" font-size="13" fill="white" font-weight="bold">コマ ${panel.panel_number}　${sceneText}</text>
  ${bubbles}
  ${infoBoxSvg}
</svg>`
}
