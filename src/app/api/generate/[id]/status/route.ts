import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: content } = await supabase
    .from('generated_content')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const { data: assets } = await supabase
    .from('content_assets')
    .select('*')
    .eq('content_id', id)
    .order('panel_number', { ascending: true })

  const panelCount = content.panel_count || 0
  const completedPanels = assets?.length || 0

  let progressPercent = 0
  switch (content.status) {
    case 'queued':
      progressPercent = 0
      break
    case 'generating_scenario':
      progressPercent = 20
      break
    case 'generating_images':
      progressPercent = panelCount > 0
        ? 20 + Math.round((completedPanels / panelCount) * 70)
        : 30
      break
    case 'complete':
      progressPercent = 100
      break
    case 'failed':
      progressPercent = -1
      break
  }

  return NextResponse.json({
    status: content.status,
    progress_percent: progressPercent,
    panel_count: panelCount,
    completed_panels: completedPanels,
    assets: assets || [],
    scenario_json: content.scenario_json,
    cast_json: content.cast_json,
  })
}
