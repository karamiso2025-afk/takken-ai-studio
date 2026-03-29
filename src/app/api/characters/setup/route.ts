import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

export async function POST() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already generated
  const { data: existing } = await supabase
    .from('character_sheets')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ status: 'already_exists' })
  }

  // Trigger async job
  await inngest.send({
    name: 'takken/setup.characters',
    data: { userId: user.id },
  })

  return NextResponse.json({ status: 'queued' })
}
