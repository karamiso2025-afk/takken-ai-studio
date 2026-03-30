import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { generateCharacterSheet } from '@/lib/gemini/generate-image'
import { ALL_CHARACTERS } from '@/lib/characters'

export const maxDuration = 60

export async function POST() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = createServiceClient()

  // Check if already generated
  const { data: existing } = await svc
    .from('character_sheets')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ status: 'already_exists' })
  }

  // Ensure storage bucket exists
  const { error: bucketError } = await svc.storage.createBucket('character-sheets', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.error('[character setup] bucket creation failed:', bucketError.message)
  }

  // Generate all character sheets in parallel
  const results = await Promise.allSettled(
    ALL_CHARACTERS.map(async (char) => {
      const imageBuffer = await generateCharacterSheet(char.name, char.promptDescription)

      const filePath = `${user.id}/${char.key}.png`
      const { error: uploadError } = await svc.storage
        .from('character-sheets')
        .upload(filePath, imageBuffer, { contentType: 'image/png', upsert: true })

      if (uploadError) throw new Error(`upload failed for ${char.key}: ${uploadError.message}`)

      const { data: urlData } = svc.storage
        .from('character-sheets')
        .getPublicUrl(filePath)

      await svc.from('character_sheets').upsert({
        user_id: user.id,
        character_key: char.key,
        character_type: char.type,
        storage_path: filePath,
        public_url: urlData.publicUrl,
      })

      return { key: char.key, url: urlData.publicUrl }
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message ?? String(r.reason))

  if (errors.length > 0) {
    console.error('[character setup] failures:', errors)
  }

  return NextResponse.json({ status: 'complete', succeeded, failed, total: ALL_CHARACTERS.length, errors })
}
