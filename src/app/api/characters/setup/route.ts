import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { ALL_CHARACTERS, CharacterDef } from '@/lib/characters'

export const maxDuration = 60

// SVGでキャラクターシートを生成（外部API不要）
function generateSvgCharacterSheet(char: CharacterDef): string {
  const colors: Record<string, { body: string; face: string; accent: string; hair: string }> = {
    tanaka:    { body: '#1A237E', face: '#FFCC80', accent: '#FF8F00', hair: '#212121' },
    sato:      { body: '#1B5E20', face: '#FFCC80', accent: '#388E3C', hair: '#4E342E' },
    yamada:    { body: '#78909C', face: '#FFCC80', accent: '#1565C0', hair: '#212121' },
    narrator:  { body: '#424242', face: '#FFCC80', accent: '#757575', hair: '#212121' },
    suzuki:    { body: '#4E342E', face: '#FFCC80', accent: '#F9A825', hair: '#ECEFF1' },
    nakamura:  { body: '#263238', face: '#FFCC80', accent: '#546E7A', hair: '#212121' },
    kuroda:    { body: '#212121', face: '#FFCC80', accent: '#C62828', hair: '#212121' },
    kimura:    { body: '#F5F5F5', face: '#FFCC80', accent: '#00695C', hair: '#4E342E' },
    takahashi: { body: '#F5F0E8', face: '#FFCC80', accent: '#6A1B9A', hair: '#795548' },
  }
  const c = colors[char.key] ?? { body: '#9E9E9E', face: '#FFCC80', accent: '#616161', hair: '#212121' }
  const firstName = char.name.split(' ')[0]
  const role = char.role

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8F9FA"/>
      <stop offset="100%" style="stop-color:#ECEFF1"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="300" height="400" fill="url(#bg)"/>
  <rect x="0" y="0" width="300" height="8" fill="${c.accent}"/>

  <!-- キャラクター名 -->
  <text x="150" y="40" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#212121">${firstName}</text>
  <text x="150" y="60" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="11" text-anchor="middle" fill="#757575">${role}</text>

  <!-- 体 -->
  <rect x="100" y="230" width="100" height="120" rx="8" fill="${c.body}"/>

  <!-- 首 -->
  <rect x="136" y="210" width="28" height="25" fill="${c.face}"/>

  <!-- 頭 -->
  <ellipse cx="150" cy="170" rx="52" ry="55" fill="${c.face}" stroke="${c.hair === '#212121' ? '#BDBDBD' : '#9E9E9E'}" stroke-width="1.5"/>

  <!-- 髪 -->
  <ellipse cx="150" cy="128" rx="52" ry="22" fill="${c.hair}"/>
  <rect x="98" y="128" width="20" height="40" rx="10" fill="${c.hair}"/>
  <rect x="182" y="128" width="20" height="40" rx="10" fill="${c.hair}"/>

  <!-- 目 -->
  <ellipse cx="132" cy="168" rx="8" ry="9" fill="white" stroke="#BDBDBD" stroke-width="1"/>
  <ellipse cx="168" cy="168" rx="8" ry="9" fill="white" stroke="#BDBDBD" stroke-width="1"/>
  <circle cx="134" cy="169" r="5" fill="#3E2723"/>
  <circle cx="170" cy="169" r="5" fill="#3E2723"/>
  <circle cx="136" cy="167" r="1.5" fill="white"/>
  <circle cx="172" cy="167" r="1.5" fill="white"/>

  <!-- 眉毛 -->
  <path d="M122 156 Q132 152 142 156" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M158 156 Q168 152 178 156" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- 鼻 -->
  <path d="M148 178 Q150 185 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>

  <!-- 口 -->
  <path d="M136 192 Q150 200 164 192" stroke="#E57373" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- 眼鏡（山田・中村・木村） -->
  ${['yamada','nakamura','kimura'].includes(char.key) ? `
  <rect x="122" y="162" width="22" height="14" rx="3" fill="none" stroke="${c.accent}" stroke-width="2"/>
  <rect x="156" y="162" width="22" height="14" rx="3" fill="none" stroke="${c.accent}" stroke-width="2"/>
  <line x1="144" y1="168" x2="156" y2="168" stroke="${c.accent}" stroke-width="2"/>
  ` : ''}

  <!-- サングラス（黒田） -->
  ${char.key === 'kuroda' ? `
  <rect x="118" y="160" width="28" height="18" rx="4" fill="#212121" opacity="0.85"/>
  <rect x="154" y="160" width="28" height="18" rx="4" fill="#212121" opacity="0.85"/>
  <line x1="146" y1="168" x2="154" y2="168" stroke="#424242" stroke-width="2"/>
  ` : ''}

  <!-- 役職バッジ -->
  <rect x="20" y="340" width="260" height="44" rx="8" fill="${c.accent}" opacity="0.15" stroke="${c.accent}" stroke-width="1.5"/>
  <text x="150" y="358" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="${c.accent}">${char.age !== '年齢不詳' ? char.age + '歳' : '年齢不詳'} · ${char.role}</text>
  <text x="150" y="375" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="10" text-anchor="middle" fill="#616161">${char.speechStyle.slice(0, 20)}</text>

  <rect x="0" y="392" width="300" height="8" fill="${c.accent}"/>
</svg>`
}

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()

  // 既に生成済みか確認
  const { data: existing } = await svc
    .from('character_sheets')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ status: 'already_exists' })
  }

  // バケットが存在しない場合は作成
  await svc.storage.createBucket('character-sheets', { public: true }).catch(() => {/* already exists */})

  // 全キャラクターのSVGを生成してStorageに保存
  const results = await Promise.allSettled(
    ALL_CHARACTERS.map(async (char) => {
      const svgContent = generateSvgCharacterSheet(char)
      const svgBuffer = Buffer.from(svgContent, 'utf-8')

      const filePath = `${user.id}/${char.key}.svg`
      const { error: uploadError } = await svc.storage
        .from('character-sheets')
        .upload(filePath, svgBuffer, { contentType: 'image/svg+xml', upsert: true })

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

      return { key: char.key, name: char.name, url: urlData.publicUrl }
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message ?? String(r.reason))
  const sheets = results
    .filter((r): r is PromiseFulfilledResult<{ key: string; name: string; url: string }> => r.status === 'fulfilled')
    .map((r) => r.value)

  return NextResponse.json({ status: 'complete', succeeded, failed, total: ALL_CHARACTERS.length, errors, sheets })
}
