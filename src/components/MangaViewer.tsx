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

  const rows = Math.ceil(panelCount / 2)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        漫画ビューア
        <span className="text-sm font-normal text-gray-400">
          ({panelCount}コマ)
        </span>
      </h3>

      {/* Grid: 2 columns, dynamic rows */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {sortedPanels.map((panel) => (
          <PanelCell key={panel.id} panel={panel} />
        ))}
      </div>

      {/* Mobile: 1 column */}
      <style jsx>{`
        @media (max-width: 640px) {
          div[style] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
        }
      `}</style>
    </div>
  )
}

function PanelCell({ panel }: { panel: ContentAsset }) {
  const overlay = panel.overlay_data
  const isSvg = panel.asset_type === 'svg_fallback'

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[280/200]">
      {/* Panel image */}
      {panel.public_url && (
        isSvg ? (
          <object
            data={panel.public_url}
            type="image/svg+xml"
            className="w-full h-full"
          />
        ) : (
          <Image
            src={panel.public_url}
            alt={`Panel ${panel.panel_number}`}
            fill
            className="object-cover"
            unoptimized
          />
        )
      )}

      {/* Text overlays (CSS absolute on top of image) */}
      {overlay && !isSvg && (
        <>
          {/* Dialogue bubbles */}
          {overlay.dialogue?.map((d, i) => {
            const char = getCharacterByKey(d.character)
            return (
              <div
                key={i}
                className="absolute bg-white/95 rounded-2xl px-3 py-1.5 shadow-sm border border-gray-200 max-w-[60%]"
                style={{
                  top: `${15 + i * 22}%`,
                  left: i % 2 === 0 ? '5%' : '35%',
                }}
              >
                {char && (
                  <span className="text-[9px] text-gray-400 block">
                    {char.name}
                  </span>
                )}
                <p className="text-xs font-medium text-gray-800 leading-tight">
                  {d.text}
                </p>
                {/* Speech bubble pointer */}
                <div
                  className="absolute w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-white/95"
                  style={{ bottom: '-6px', left: '20px' }}
                />
              </div>
            )
          })}

          {/* Narrator box */}
          {overlay.narrator_box && (
            <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
              {overlay.narrator_box}
            </div>
          )}

          {/* Info box */}
          {overlay.info_box && (
            <div className="absolute top-1 right-1 bg-blue-500/90 text-white text-[10px] px-2 py-1 rounded max-w-[55%]">
              {overlay.info_box}
            </div>
          )}
        </>
      )}

      {/* Panel number badge */}
      <div className="absolute top-0 left-0 bg-gray-800/70 text-white text-[10px] px-1.5 py-0.5 rounded-br">
        {panel.panel_number}
      </div>
    </div>
  )
}
