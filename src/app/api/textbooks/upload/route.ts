import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// 対応ファイル形式
const ACCEPTED_TYPES = {
  'application/pdf': { ext: 'pdf', bucket: 'textbook-pdfs' },
  'image/jpeg': { ext: 'jpg', bucket: 'textbook-pdfs' },
  'image/jpg': { ext: 'jpg', bucket: 'textbook-pdfs' },
  'image/png': { ext: 'png', bucket: 'textbook-pdfs' },
  'image/webp': { ext: 'webp', bucket: 'textbook-pdfs' },
  'image/heic': { ext: 'heic', bucket: 'textbook-pdfs' },
} as const

type AcceptedMimeType = keyof typeof ACCEPTED_TYPES

function isAccepted(mime: string): mime is AcceptedMimeType {
  return mime in ACCEPTED_TYPES
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()

    // 複数ファイル対応（写真の場合は複数ページをまとめてアップロード可）
    const files = formData.getAll('file') as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ファイル種別チェック
    for (const file of files) {
      const mime = file.type || 'application/octet-stream'
      if (!isAccepted(mime)) {
        return NextResponse.json(
          { error: `非対応のファイル形式です: ${mime}。PDF / JPEG / PNG / WebP に対応しています。` },
          { status: 400 }
        )
      }
    }

    // 最初のファイルからタイトルを生成
    const firstFile = files[0]
    const baseTitle = firstFile.name.replace(/\.(pdf|jpe?g|png|webp|heic)$/i, '')
    const fileType = firstFile.type.startsWith('image/') ? 'image' : 'pdf'

    // textbook レコードを作成
    const { data: textbook, error: insertError } = await supabase
      .from('textbooks')
      .insert({
        user_id: user.id,
        title: baseTitle,
        file_path: '',          // 後で更新
        total_pages: files.length,
      })
      .select()
      .single()

    if (insertError || !textbook) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create textbook' }, { status: 500 })
    }

    // ファイルをストレージにアップロード
    const uploadedPaths: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const mime = file.type as AcceptedMimeType
      const { ext } = ACCEPTED_TYPES[mime]
      const fileName = `${user.id}/${textbook.id}/page_${String(i + 1).padStart(3, '0')}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('textbook-pdfs')
        .upload(fileName, buffer, { contentType: mime, upsert: true })

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }

      uploadedPaths.push(fileName)
    }

    // file_path に最初のファイルパス（または JSON 配列）を保存
    const filePath = uploadedPaths.length === 1
      ? uploadedPaths[0]
      : JSON.stringify(uploadedPaths)

    await supabase
      .from('textbooks')
      .update({ file_path: filePath })
      .eq('id', textbook.id)

    return NextResponse.json({
      textbook_id: textbook.id,
      file_path: filePath,
      file_type: fileType,
      page_count: files.length,
    })
  } catch (err) {
    console.error('[upload] unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
