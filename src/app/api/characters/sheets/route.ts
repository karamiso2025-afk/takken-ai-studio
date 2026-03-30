import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCharacterByKey } from '@/lib/characters'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data } = await supabase
    .from('character_sheets')
    .select('character_key, public_url')
    .eq('user_id', user.id)
    .order('character_key')

  if (!data) return NextResponse.json([])

  const sheets = data.map((row) => {
    const char = getCharacterByKey(row.character_key)
    return {
      key: row.character_key,
      name: char?.name.split(' ')[0] ?? row.character_key,
      url: row.public_url,
    }
  })

  return NextResponse.json(sheets)
}
