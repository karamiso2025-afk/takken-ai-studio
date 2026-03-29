import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { topic_id, content_type, panel_count_override } = body as {
    topic_id: string
    content_type: 'manga' | 'anime' | 'drama'
    panel_count_override?: number
  }

  if (!topic_id || !content_type) {
    return NextResponse.json(
      { error: 'topic_id and content_type are required' },
      { status: 400 }
    )
  }

  // Phase 2a: only manga is supported
  if (content_type !== 'manga') {
    return NextResponse.json(
      { error: 'Only manga is supported in Phase 2a' },
      { status: 400 }
    )
  }

  // Create generated_content record
  const { data: content, error } = await supabase
    .from('generated_content')
    .insert({
      topic_id,
      user_id: user.id,
      content_type,
      status: 'queued',
    })
    .select()
    .single()

  if (error || !content) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create content' },
      { status: 500 }
    )
  }

  // Trigger async job
  await inngest.send({
    name: 'takken/generate.manga',
    data: {
      contentId: content.id,
      topicId: topic_id,
      userId: user.id,
      panelCountOverride: panel_count_override,
    },
  })

  return NextResponse.json({ content_id: content.id, status: 'queued' })
}
