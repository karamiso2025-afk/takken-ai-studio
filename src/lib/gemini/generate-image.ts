/**
 * AI image generation using Pollinations.ai (free, no API key required)
 * Generates manga/anime style illustrations for manga panels
 */

export async function generateImage(promptEn: string): Promise<Buffer> {
  // Manga-style prompt enhancement
  const mangaPrompt = `${promptEn}, Japanese manga style, anime art, clean line art, pastel colors, simple background, educational manga panel, 2 characters talking`

  const encodedPrompt = encodeURIComponent(mangaPrompt)
  const seed = Math.floor(Math.random() * 99999)
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=384&seed=${seed}&nologo=true&model=flux`

  const response = await fetch(url, {
    headers: { 'User-Agent': 'TakkenAI-Studio/1.0' },
    // Pollinations can take up to 30 seconds
    signal: AbortSignal.timeout(45000),
  })

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength < 1000) {
    throw new Error('Image data too small, likely an error response')
  }

  return Buffer.from(arrayBuffer)
}

export async function generateCharacterSheet(
  characterName: string,
  promptDescription: string
): Promise<Buffer> {
  const prompt = `Character design sheet, ${characterName}, ${promptDescription}, Japanese manga style, anime art, full body pose, white background, clean lines, pastel colors, professional character design`
  return generateImage(prompt)
}
