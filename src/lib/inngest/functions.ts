import { inngest } from './client'
import { createServiceClient } from '@/lib/supabase/server'
import { generateScenario } from '@/lib/claude/generate-scenario'
import { generateImage, generateCharacterSheet } from '@/lib/gemini/generate-image'
import { CORE_CHARACTERS, GUEST_CHARACTERS } from '@/lib/characters'

// ─────────────────────────────────────────
// Job: setup_characters
// 初回のみ: 9人分のキャラクターシートを生成
// ─────────────────────────────────────────
export const setupCharacters = inngest.createFunction(
  {
    id: 'setup-characters',
    retries: 2,
    triggers: [{ event: 'takken/setup.characters' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { userId: string } }; step: any }) => {
    const userId = event.data.userId as string
    const supabase = createServiceClient()

    // Check if already generated (idempotent)
    const { data: existing } = await supabase
      .from('character_sheets')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      return { status: 'already_exists', count: existing.length }
    }

    // Generate core character sheets
    const coreResults = await step.run('generate-core-sheets', async () => {
      const results: { key: string; type: 'core' | 'guest' }[] = []

      for (const char of CORE_CHARACTERS) {
        const imageBuffer = await generateCharacterSheet(
          char.name,
          char.promptDescription
        )

        const filePath = `${userId}/${char.key}.png`
        const { error: uploadError } = await supabase.storage
          .from('character-sheets')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('character-sheets')
          .getPublicUrl(filePath)

        await supabase.from('character_sheets').upsert({
          user_id: userId,
          character_key: char.key,
          character_type: 'core',
          storage_path: filePath,
          public_url: urlData.publicUrl,
        })

        results.push({ key: char.key, type: 'core' })
      }

      return results
    })

    // Generate guest character sheets
    const guestResults = await step.run('generate-guest-sheets', async () => {
      const results: { key: string; type: 'core' | 'guest' }[] = []

      for (const char of GUEST_CHARACTERS) {
        const imageBuffer = await generateCharacterSheet(
          char.name,
          char.promptDescription
        )

        const filePath = `${userId}/${char.key}.png`
        const { error: uploadError } = await supabase.storage
          .from('character-sheets')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('character-sheets')
          .getPublicUrl(filePath)

        await supabase.from('character_sheets').upsert({
          user_id: userId,
          character_key: char.key,
          character_type: 'guest',
          storage_path: filePath,
          public_url: urlData.publicUrl,
        })

        results.push({ key: char.key, type: 'guest' })
      }

      return results
    })

    return {
      status: 'complete',
      core: coreResults,
      guest: guestResults,
    }
  }
)

// ─────────────────────────────────────────
// Job: generate_manga
// 漫画の全自動生成パイプライン
// ─────────────────────────────────────────
export const generateManga = inngest.createFunction(
  {
    id: 'generate-manga',
    retries: 2,
    triggers: [{ event: 'takken/generate.manga' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { contentId: string; topicId: string; userId: string; panelCountOverride?: number } }; step: any }) => {
    const {
      contentId,
      topicId,
      userId,
      panelCountOverride,
    } = event.data as {
      contentId: string
      topicId: string
      userId: string
      panelCountOverride?: number
    }

    const supabase = createServiceClient()

    // Step 1: Generate scenario with Claude
    const scenario = await step.run('generate-scenario', async () => {
      await supabase
        .from('generated_content')
        .update({ status: 'generating_scenario' })
        .eq('id', contentId)

      const { data: topic } = await supabase
        .from('topics')
        .select('name, extracted_content')
        .eq('id', topicId)
        .single()

      if (!topic) throw new Error('Topic not found')

      const result = await generateScenario(
        topic.name,
        topic.extracted_content || topic.name,
        panelCountOverride
      )

      await supabase
        .from('generated_content')
        .update({
          panel_count: result.panel_count,
          cast_json: result.cast as unknown as Record<string, unknown>,
          scenario_json: result as unknown as Record<string, unknown>,
          status: 'generating_images',
        })
        .eq('id', contentId)

      return result
    })

    // Step 2: Generate panel images
    await step.run('generate-panel-images', async () => {
      for (const panel of scenario.manga_panels) {
        try {
          const imageBuffer = await generateImage(panel.prompt_en)

          const filePath = `${userId}/${contentId}/panel_${panel.panel_number}.png`
          const { error: uploadError } = await supabase.storage
            .from('manga-panels')
            .upload(filePath, imageBuffer, {
              contentType: 'image/png',
              upsert: true,
            })

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from('manga-panels')
            .getPublicUrl(filePath)

          await supabase.from('content_assets').insert({
            content_id: contentId,
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
        } catch (err) {
          // Fallback: save SVG placeholder
          console.error(
            `Panel ${panel.panel_number} image generation failed, using SVG fallback`,
            err
          )

          const svgContent = generateSvgFallback(panel)
          const svgBuffer = Buffer.from(svgContent, 'utf-8')

          const filePath = `${userId}/${contentId}/panel_${panel.panel_number}_fallback.svg`
          await supabase.storage
            .from('manga-panels')
            .upload(filePath, svgBuffer, {
              contentType: 'image/svg+xml',
              upsert: true,
            })

          const { data: urlData } = supabase.storage
            .from('manga-panels')
            .getPublicUrl(filePath)

          await supabase.from('content_assets').insert({
            content_id: contentId,
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

      await supabase
        .from('generated_content')
        .update({ status: 'complete' })
        .eq('id', contentId)
    })

    // Step 3: Save quiz
    await step.run('generate-quiz', async () => {
      if (scenario.quiz) {
        await supabase.from('quizzes').insert({
          topic_id: topicId,
          content_id: contentId,
          question: scenario.quiz.question,
          choices: scenario.quiz.choices,
          correct_index: scenario.quiz.correct_index,
          explanation: scenario.quiz.explanation,
          wrong_explanations: scenario.quiz.wrong_explanations as unknown as Record<string, string>,
        })
      }
    })

    // Update topic status
    await supabase
      .from('topics')
      .update({ status: 'has_content' })
      .eq('id', topicId)

    return { status: 'complete', contentId, panelCount: scenario.panel_count }
  }
)

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
