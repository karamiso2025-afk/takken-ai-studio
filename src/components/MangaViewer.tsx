'use client'

import { getCharacterByKey } from '@/lib/characters'
import { useEffect, useState } from 'react'

interface ContentAsset {
  id?: string
  asset_type?: string
  panel_number: number | null
  public_url: string | null
  overlay_data: {
    dialogue?: { character: string; text: string }[]
    narrator_box?: string
    info_box?: string
    scene?: string
  } | null
}

interface CharacterSheet {
  key: string
  name: string
  url: string | null
}

// キャラクター別スタイル定義
const CHAR_STYLES: Record<string, {
  bg: string; border: string; label: string; headerBg: string; textColor: string; initial: string
}> = {
  tanaka:    { bg: '#FFF3E0', border: '#FF8F00', label: '#E65100', headerBg: '#FF8F00', textColor: '#BF360C', initial: '田' },
  sato:      { bg: '#E8F5E9', border: '#388E3C', label: '#1B5E20', headerBg: '#388E3C', textColor: '#1B5E20', initial: '佐' },
  yamada:    { bg: '#E3F2FD', border: '#1565C0', label: '#0D47A1', headerBg: '#1565C0', textColor: '#0D47A1', initial: '山' },
  narrator:  { bg: '#F5F5F5', border: '#616161', label: '#424242', headerBg: '#616161', textColor: '#212121', initial: 'N' },
  suzuki:    { bg: '#FFFDE7', border: '#F9A825', label: '#F57F17', headerBg: '#F9A825', textColor: '#E65100', initial: '鈴' },
  nakamura:  { bg: '#ECEFF1', border: '#546E7A', label: '#37474F', headerBg: '#546E7A', textColor: '#263238', initial: '中' },
  kuroda:    { bg: '#FFEBEE', border: '#C62828', label: '#B71C1C', headerBg: '#C62828', textColor: '#B71C1C', initial: '黒' },
  kimura:    { bg: '#E0F2F1', border: '#00695C', label: '#004D40', headerBg: '#00695C', textColor: '#004D40', initial: '木' },
  takahashi: { bg: '#F3E5F5', border: '#6A1B9A', label: '#4A148C', headerBg: '#6A1B9A', textColor: '#4A148C', initial: '高' },
}

function getCharStyle(key: string) {
  return CHAR_STYLES[key] ?? { bg: '#FAFAFA', border: '#9E9E9E', label: '#757575', headerBg: '#9E9E9E', textColor: '#616161', initial: '?' }
}

export function MangaViewer({ assets, panelCount }: { assets: ContentAsset[]; panelCount: number }) {
  const [sheets, setSheets] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/characters/sheets')
      .then(r => r.ok ? r.json() : [])
      .then((data: CharacterSheet[]) => {
        const map: Record<string, string> = {}
        data.forEach(s => { if (s.url) map[s.key] = s.url })
        setSheets(map)
      })
      .catch(() => {})
  }, [])

  const panels = [...assets]
    .filter((a) => a.panel_number !== null)
    .sort((a, b) => (a.panel_number ?? 0) - (b.panel_number ?? 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-900 text-white px-5 py-3 flex items-center gap-3">
        <span className="text-xl">📖</span>
        <span className="font-bold text-lg tracking-wide">マンガで学ぶ宅建</span>
        <span className="ml-auto text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
          {panelCount}コマ
        </span>
      </div>

      {/* パネルグリッド */}
      <div className="grid gap-0.5 bg-gray-300 p-0.5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {panels.map((panel) => (
          <MangaPanel key={panel.id ?? panel.panel_number} panel={panel} sheets={sheets} />
        ))}
      </div>
    </div>
  )
}

function MangaPanel({ panel, sheets }: { panel: ContentAsset; sheets: Record<string, string> }) {
  const overlay = panel.overlay_data
  const dialogue = overlay?.dialogue ?? []
  const infoBox = overlay?.info_box
  const narratorBox = overlay?.narrator_box
  const scene = overlay?.scene ?? ''

  const hasImage = !!panel.public_url

  return (
    <div className="bg-white flex flex-col" style={{ fontFamily: '"Hiragino Kaku Gothic Pro", "Meiryo", sans-serif' }}>
      {/* パネル番号 + シーン */}
      <div className="flex items-center gap-2 bg-gray-900 px-2 py-1.5">
        <span className="w-5 h-5 rounded-full bg-white text-gray-900 flex items-center justify-center flex-shrink-0 font-black" style={{ fontSize: 11 }}>
          {panel.panel_number}
        </span>
        <span className="text-gray-300 text-xs truncate flex-1">{scene}</span>
      </div>

      {/* 画像エリア */}
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={panel.public_url!}
          alt={`コマ${panel.panel_number}`}
          className="w-full object-cover"
          style={{ display: 'block' }}
        />
      )}

      {/* キャラクターエリア（画像なし時のみ） */}
      {!hasImage && dialogue.length > 0 && (
        <div className="flex justify-around items-end px-3 pt-3 pb-1">
          {getUniqueCharacters(dialogue).map((charKey) => (
            <CharacterAvatar key={charKey} charKey={charKey} sheetUrl={sheets[charKey]} />
          ))}
        </div>
      )}

      {/* セリフエリア */}
      {dialogue.length > 0 && (
        <div className="px-2 pt-2 pb-1 flex flex-col gap-1.5">
          {dialogue.map((d, i) => (
            <SpeechBubble key={i} charKey={d.character} text={d.text} isRight={i % 2 === 1} sheetUrl={sheets[d.character]} />
          ))}
        </div>
      )}

      {/* ナレーター */}
      {narratorBox && (
        <div className="mx-2 mb-1.5 text-xs text-center py-1.5 px-2 rounded italic font-medium"
          style={{ background: '#37474F', color: '#ECEFF1', fontSize: 11 }}>
          ▼ {narratorBox}
        </div>
      )}

      {/* 重要情報ボックス */}
      {infoBox && (
        <div className="flex items-center gap-1.5 px-3 py-2 text-white font-bold mt-auto"
          style={{ background: '#1565C0', fontSize: 11 }}>
          <span>📌</span>
          <span className="leading-tight">{infoBox}</span>
        </div>
      )}
    </div>
  )
}

function getUniqueCharacters(dialogue: { character: string; text: string }[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const d of dialogue) {
    if (!seen.has(d.character) && d.character !== 'narrator') {
      seen.add(d.character)
      result.push(d.character)
    }
  }
  return result.slice(0, 3)
}

function CharacterAvatar({ charKey, sheetUrl }: { charKey: string; sheetUrl?: string }) {
  const style = getCharStyle(charKey)
  const char = getCharacterByKey(charKey)
  const firstName = char?.name.split(' ')[0] ?? charKey

  return (
    <div className="flex flex-col items-center gap-0.5">
      {sheetUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sheetUrl} alt={firstName} className="rounded-lg object-cover"
          style={{ width: 48, height: 64, border: `2px solid ${style.border}` }} />
      ) : (
        <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="22" cy="13" rx="10" ry="11" fill={style.bg} stroke={style.border} strokeWidth="2" />
          <circle cx="18" cy="12" r="1.5" fill={style.label} />
          <circle cx="26" cy="12" r="1.5" fill={style.label} />
          <path d="M18 17 Q22 20 26 17" stroke={style.label} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="19" y="23" width="6" height="5" fill={style.bg} stroke={style.border} strokeWidth="1" />
          <path d="M8 52 L10 28 Q22 25 34 28 L36 52 Z" fill={style.headerBg} stroke={style.border} strokeWidth="1.5" />
          <text x="22" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill={style.label}>{style.initial}</text>
        </svg>
      )}
      <span className="text-xs font-bold" style={{ color: style.label, fontSize: 10 }}>{firstName}</span>
    </div>
  )
}

function SpeechBubble({ charKey, text, isRight, sheetUrl }: {
  charKey: string; text: string; isRight: boolean; sheetUrl?: string
}) {
  const style = getCharStyle(charKey)
  const char = getCharacterByKey(charKey)
  const firstName = char?.name.split(' ')[0] ?? charKey

  return (
    <div className={`flex items-start gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}>
      {/* アバター */}
      {sheetUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sheetUrl} alt={firstName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow"
          style={{ border: `2px solid ${style.border}`, objectPosition: 'top' }} />
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black flex-shrink-0 text-xs shadow"
          style={{ background: style.headerBg, border: `2px solid ${style.border}` }}>
          {style.initial}
        </div>
      )}
      {/* 吹き出し */}
      <div className={`relative rounded-2xl px-2.5 py-1.5 shadow-sm max-w-[80%] border-2 ${isRight ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={{ background: style.bg, borderColor: style.border }}>
        <div className="font-black text-[9px] mb-0.5" style={{ color: style.label }}>{firstName}</div>
        <div className="font-medium leading-tight" style={{ color: '#1a1a1a', fontSize: 12 }}>{text}</div>
      </div>
    </div>
  )
}
