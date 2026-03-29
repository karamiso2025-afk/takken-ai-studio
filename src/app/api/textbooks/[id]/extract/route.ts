import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ファイル拡張子 → Claude media_type マッピング
const EXT_TO_MEDIA_TYPE: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/jpeg', // HEIC は JPEG として処理
}

const EXTRACTION_PROMPT = `この宅建テキスト（PDF または 写真）から章とトピックを抽出してください。

写真の場合は、写っているテキストを丁寧に読み取り、宅建試験に関連する章・条文・概念を抽出してください。

以下のJSON形式で出力してください:
{
  "chapters": [
    {
      "name": "章の名前",
      "chapter_number": 1,
      "color": "#hex色コード",
      "topics": [
        {
          "name": "トピック名",
          "article": "関連条文（例: 民法95条）",
          "page_range": "p.10-15",
          "extracted_content": "トピックの要約テキスト（200文字程度）",
          "complexity": "simple | standard | complex"
        }
      ]
    }
  ]
}

complexity の判定基準:
- simple: 単一概念（6コマ向き）
- standard: 原則＋例外がある概念（8コマ向き）
- complex: 複数制度の比較・複合問題（10コマ向き）`

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: textbook } = await supabase
    .from('textbooks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!textbook) {
    return NextResponse.json({ error: 'Textbook not found' }, { status: 404 })
  }

  // file_path が JSON 配列（複数画像）か単一パスかを判定
  let filePaths: string[]
  try {
    filePaths = JSON.parse(textbook.file_path as string)
  } catch {
    filePaths = [textbook.file_path as string]
  }

  // 最初のファイルの拡張子でタイプを判定
  const firstPath = filePaths[0]
  const ext = firstPath.split('.').pop()?.toLowerCase() ?? 'pdf'
  const isPdf = ext === 'pdf'

  // Claude へのメッセージ content を構築
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentBlocks: any[] = []

  if (isPdf) {
    // PDF モード: 最初のファイルのみ（Claude は PDF を 1 ファイルずつ処理）
    const { data: fileData } = await supabase.storage
      .from('textbook-pdfs')
      .download(firstPath)

    if (!fileData) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    contentBlocks.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: buffer.toString('base64'),
      },
    })
  } else {
    // 画像モード: 複数ページ（写真）を全て添付
    for (const filePath of filePaths) {
      const fileExt = filePath.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mediaType = EXT_TO_MEDIA_TYPE[fileExt] ?? 'image/jpeg'

      const { data: fileData } = await supabase.storage
        .from('textbook-pdfs')
        .download(filePath)

      if (!fileData) continue

      const buffer = Buffer.from(await fileData.arrayBuffer())
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buffer.toString('base64'),
        },
      })
    }

    if (contentBlocks.length === 0) {
      return NextResponse.json({ error: 'Images not found in storage' }, { status: 404 })
    }
  }

  // テキストプロンプトを追加
  contentBlocks.push({ type: 'text', text: EXTRACTION_PROMPT })

  // Claude Vision で章・トピック抽出
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return NextResponse.json(
      { error: 'Failed to extract topics from file' },
      { status: 500 }
    )
  }

  const extracted = JSON.parse(jsonMatch[0]) as {
    chapters: {
      name: string
      chapter_number: number
      color: string
      topics: {
        name: string
        article: string
        page_range: string
        extracted_content: string
        complexity: string
      }[]
    }[]
  }

  // DB に章・トピックを保存
  const savedChapters = []

  for (const ch of extracted.chapters) {
    const { data: chapter } = await supabase
      .from('chapters')
      .insert({
        textbook_id: id,
        name: ch.name,
        chapter_number: ch.chapter_number,
        color: ch.color,
      })
      .select()
      .single()

    if (!chapter) continue

    const topicsToInsert = ch.topics.map((t) => ({
      chapter_id: chapter.id,
      name: t.name,
      article: t.article,
      page_range: t.page_range,
      extracted_content: t.extracted_content,
      complexity: t.complexity as 'simple' | 'standard' | 'complex',
      status: 'extracted' as const,
    }))

    const { data: topics } = await supabase
      .from('topics')
      .insert(topicsToInsert)
      .select()

    savedChapters.push({ ...chapter, topics: topics || [] })
  }

  return NextResponse.json({
    chapters: savedChapters,
    source_type: isPdf ? 'pdf' : 'image',
    pages_processed: filePaths.length,
  })
}
