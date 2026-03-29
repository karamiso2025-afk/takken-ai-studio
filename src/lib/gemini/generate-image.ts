import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export async function generateImage(promptEn: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: promptEn,
    config: {
      responseModalities: ['image', 'text'],
    },
  })

  const part = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!part?.inlineData?.data) {
    throw new Error('No image data in Gemini response')
  }

  return Buffer.from(part.inlineData.data, 'base64')
}

export async function generateCharacterSheet(
  characterName: string,
  promptDescription: string
): Promise<Buffer> {
  const prompt = `Character reference sheet for manga/anime style illustration.
Character: ${characterName}
Description: ${promptDescription}
Style: Japanese manga style, clean anime art, pastel colors, educational manga.
Show the character in a full-body front-facing pose with a clean white background.
Include a smaller head close-up in the corner showing facial details.
Professional character design sheet layout.`

  return generateImage(prompt)
}
