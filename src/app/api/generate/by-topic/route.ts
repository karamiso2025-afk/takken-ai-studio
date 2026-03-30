import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const topicId = req.nextUrl.searchParams.get('topic_id')
  if (!topicId) return NextResponse.json(null, { status: 400 })

  const { data } = await supabase
    .from('generated_content')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json(null)
  return NextResponse.json({ content_id: data.id })
}
