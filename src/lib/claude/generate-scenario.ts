import Anthropic from '@anthropic-ai/sdk'
import { TAKKEN_SYSTEM_PROMPT } from './system-prompt'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: TAKKEN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text =
    response.content[0].type === 'text' ? response.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse scenario JSON from Claude response')
  }

  return JSON.parse(jsonMatch[0]) as ScenarioResult
}
