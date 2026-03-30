'use client'

import Image from 'next/image'
import { getCharacterByKey } from '@/lib/characters'

interface ContentAsset {
  id: string
  asset_type: string
  panel_number: number | null
  public_url: string | null
  overlay_data: {
    dialogue?: { character: string; text: string }[]
    narrator_box?: string
    info_box?: string
    scene?: string
  } | null
}

// キャラクターごとの色設定
const CHAR_STYLES: Record<string, { bg: string; border: string; label: string; avatar: string }> = {
  tanaka:   { bg: 'bg-orange-50',  border: 'border-orange-300', label: 'text-orange-600', avatar: '🕴️' },
  sato:     { bg: 'bg-green-50',   border: 'border-green-300',  label: 'text-green-700',  avatar: '🙋' },
  yamada:   { bg: 'bg-blue-50',    border: 'border-blue-300',   label: 'text-blue-700',   avatar: '👩‍💼' },
  narrator: { bg: 'bg-gray-100',   border: 'border-gray-300',   label: 'text-gray-600',   avatar: '📢' },
  suzuki:   { bg: 'bg-yellow-50',  border: 'border-yellow-400', label: 'text-yellow-700', avatar: '🏠' },
  nakamura: { bg: 'bg-slate-50',   border: 'border-slate-400',  label: 'text-slate-700',  avatar: '🏦' },
  kuroda:   { bg: 'bg-red-50',     border: 'border-red-400',    label: 'text-red-700',    avatar: '😈' },
  kimura:   { bg: 'bg-teal-50',    border: 'border-teal-400',   label: 'text-teal-700',   avatar: '🏛️' },
  takahashi:{ bg: 'bg-purple-50',  border: 'border-purple-400', label: 'text-purple-700', avatar: '🧮' },
}

function getCharStyle(key: string) {
  return CHAR_STYLES[key] ?? { bg: 'bg-gray-50', border: 'border-gray-300', label: 'text-gray-600', avatar: '👤' }
}

export function MangaViewer({
  assets,
  panelCount,
}: {
  assets: ContentAsset[]
  panelCount: number
}) {
  const sortedPanels = [...assets]
    .filter((a) => a.panel_number !== null)
    .sort((a, b) => (a.panel_number || 0) - (b.panel_number || 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        📖 漫画ビューア
        <span className="text-sm font-normal text-gray-400">
          ({panelCount}コマ)
        </span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {sortedPanels.map((panel) => (
          <PanelCell key={panel.id} panel={panel} />
        ))}
      </div>
    </div>
  )
}

function PanelCell({ panel }: { panel: ContentAsset }) {
  const overlay = panel.overlay_data
  const isSvg = panel.asset_type === 'svg_fallback'
  const hasRealImage = panel.public_url && !isSvg

  // 実画像がある場合はそちらを表示＋オーバーレイ
  if (hasRealImage) {
    return (
      <div className="relative rounded-lg overflow-hidden border-2 border-gray-800 bg-gray-50 aspect-[4/3]">
        <Image
          src={panel.public_url!}
          alt={`Panel ${panel.panel_number}`}
          fill
          className="object-cover"
          unoptimized
        />
        {overlay?.dialogue?.map((d, i) => {
          const char = getCharacterByKey(d.character)
          const style = getCharStyle(d.character)
          return (
            <div
              key={i}
              className={`absolute ${style.bg} ${style.border} border rounded-2xl px-2 py-1 shadow max-w-[55%]`}
              style={{ top: `${10 + i * 24}%`, left: i % 2 === 0 ? '3%' : '42%' }}
            >
              <span className={`text-[8px] font-bold ${style.label} block`}>
                {style.avatar} {char?.name.split(' ')[0]}
              </span>
              <p className="text-[11px] font-medium text-gray-800 leading-tight">{d.text}</p>
            </div>
          )
        })}
        {overlay?.info_box && (
          <div className="absolute bottom-1 left-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded text-center">
            📌 {overlay.info_box}
          </div>
        )}
        <div className="absolute top-0 left-0 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-br">
          {panel.panel_number}
        </div>
      </div>
    )
  }

  // SVGフォールバック: overlay_dataからリッチなパネルをHTML/CSSで描画
  const dialogue = overlay?.dialogue ?? []
  const infoBox = overlay?.info_box
  const scene = overlay?.scene
  const narratorBox = overlay?.narrator_box

  return (
    <div className="rounded-lg overflow-hidden border-2 border-gray-800 flex flex-col bg-amber-50 min-h-[200px]">
      {/* パネルヘッダー */}
      <div className="bg-gray-800 text-white px-3 py-1.5 flex items-center gap-2">
        <span className="text-xs font-bold bg-white text-gray-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {panel.panel_number}
        </span>
        <span className="text-xs font-medium truncate">{scene ?? ''}</span>
      </div>

      {/* セリフエリア */}
      <div className="flex-1 p-3 flex flex-col gap-2.5">
        {dialogue.map((d, i) => {
          const char = getCharacterByKey(d.character)
          const style = getCharStyle(d.character)
          const isRight = i % 2 === 1
          return (
            <div key={i} className={`flex items-start gap-2 ${isRight ? 'flex-row-reverse' : ''}`}>
              {/* アバター */}
              <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 ${style.border} ${style.bg} flex items-center justify-center text-lg`}>
                {style.avatar}
              </div>
              {/* 吹き出し */}
              <div className={`relative ${style.bg} border ${style.border} rounded-2xl px-3 py-2 max-w-[75%] shadow-sm
                ${isRight ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                <p className={`text-[9px] font-bold ${style.label} mb-0.5`}>
                  {char?.name.split(' ')[0] ?? d.character}
                </p>
                <p className="text-[13px] text-gray-800 leading-snug font-medium">{d.text}</p>
              </div>
            </div>
          )
        })}

        {/* ナレーターボックス */}
        {narratorBox && (
          <div className="bg-gray-700 text-white text-xs px-3 py-1.5 rounded text-center italic">
            {narratorBox}
          </div>
        )}
      </div>

      {/* infobox */}
      {infoBox && (
        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-2 text-center">
          📌 {infoBox}
        </div>
      )}
    </div>
  )
}
