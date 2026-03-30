import { GoogleGenAI } from '@google/genai'
import { TAKKEN_SYSTEM_PROMPT } from './system-prompt'

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

export interface MangaPanel {
  panel_number: number
  scene: string
  characters_in_scene: string[]
  dialogue: { character: string; text: string }[]
  narrator_box?: string
  info_box?: string
  prompt_en: string
}

export interface ScenarioResult {
  topic: string
  article: string
  panel_count: 6 | 8 | 10
  complexity_reason: string
  cast: { core: string[]; guest: string[] }
  manga_panels: MangaPanel[]
  quiz: {
    question: string
    choices: string[]
    correct_index: number
    explanation: string
    wrong_explanations: Record<string, string>
  }
  keywords: { term: string; mnemonic: string }[]
}

export async function generateScenario(
  topicName: string,
  extractedContent: string,
  panelCountOverride?: number
): Promise<ScenarioResult> {
  const userMessage = panelCountOverride
    ? `トピック: ${topicName}\n\nコマ数指定: ${panelCountOverride}コマ\n\n内容:\n${extractedContent}`
    : `トピック: ${topicName}\n\n内容:\n${extractedContent}`

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: TAKKEN_SYSTEM_PROMPT + '\n\n---\n\n' + userMessage }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text ?? ''

  // JSON抽出（application/jsonモードでは直接パース可能だがフォールバックあり）
  let parsed: ScenarioResult
  try {
    parsed = JSON.parse(text) as ScenarioResult
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse scenario JSON from Gemini response')
    }
    parsed = JSON.parse(jsonMatch[0]) as ScenarioResult
  }

  return parsed
}
