'use client'

// RemotionPreview — @remotion/player を使ったブラウザ内紙芝居プレビュー
// Phase 2b: Level 1 動画プレビュー（サーバーレンダリング不要）

import { useState, useEffect, useCallback } from 'react'
import { Film, ChevronDown, ChevronUp } from 'lucide-react'
import type {
  ContentAssetLike,
  RemotionPanel,
  MangaSlideshowProps,
} from '@/remotion/MangaSlideshow'

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────
interface RemotionPreviewProps {
  assets: ContentAssetLike[]
  topicName?: string
  panelCount?: number
}

// ─────────────────────────────────────────
// RemotionPreview コンポーネント
// ─────────────────────────────────────────
export function RemotionPreview({
  assets,
  topicName,
  panelCount,
}: RemotionPreviewProps) {
  const [modules, setModules] = useState<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Player: React.ComponentType<any>
    MangaSlideshow: React.ComponentType<MangaSlideshowProps>
    buildRemotionPanels: (a: ContentAssetLike[], d?: number) => RemotionPanel[]
    calcTotalFrames: (p: RemotionPanel[], fps?: number, titleSec?: number) => number
  } | null>(null)

  const [panels, setPanels] = useState<RemotionPanel[]>([])
  const [totalFrames, setTotalFrames] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [durationPerPanel, setDurationPerPanel] = useState(3)
  const FPS = 30

  // 動的インポート（SSR 回避）
  useEffect(() => {
    Promise.all([
      import('@remotion/player'),
      import('@/remotion/MangaSlideshow'),
    ]).then(([playerMod, slideshowMod]) => {
      setModules({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Player: (playerMod as any).Player,
        MangaSlideshow: slideshowMod.MangaSlideshow,
        buildRemotionPanels: slideshowMod.buildRemotionPanels,
        calcTotalFrames: slideshowMod.calcTotalFrames,
      })
    })
  }, [])

  const rebuildPanels = useCallback(
    (secs: number) => {
      if (!modules) return
      const built = modules.buildRemotionPanels(assets, secs)
      const frames = modules.calcTotalFrames(built, FPS, 2)
      setPanels(built)
      setTotalFrames(frames)
    },
    [modules, assets]
  )

  useEffect(() => {
    rebuildPanels(durationPerPanel)
  }, [modules, assets, durationPerPanel, rebuildPanels])

  // ローディング中
  if (!modules || panels.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
        <Film className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-pulse" />
        <p className="text-gray-400 text-sm">動画プレビューを読み込み中...</p>
      </div>
    )
  }

  const { Player, MangaSlideshow } = modules
  const totalSeconds = Math.round(totalFrames / FPS)

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">動画プレビュー</span>
          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
            Level 1
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {panels.length}コマ · {totalSeconds}秒
          </span>
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="情報を表示"
          >
            {showInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 設定パネル（折り畳み） */}
      {showInfo && (
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/60">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">パネル表示時間:</label>
              <select
                value={durationPerPanel}
                onChange={(e) => setDurationPerPanel(Number(e.target.value))}
                className="text-xs bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
              >
                <option value={2}>2秒</option>
                <option value={3}>3秒</option>
                <option value={4}>4秒</option>
                <option value={5}>5秒</option>
              </select>
            </div>
            <div className="text-xs text-gray-500">
              合計: {totalSeconds}秒 · {panelCount ?? panels.length}コマ · 30fps
            </div>
            <div className="ml-auto">
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                💡 Level 2 で音声ナレーション追加（+¥750/月）
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Remotion Player */}
      <div className="w-full aspect-video bg-black">
        <Player
          component={MangaSlideshow}
          durationInFrames={totalFrames}
          fps={FPS}
          compositionWidth={1280}
          compositionHeight={720}
          inputProps={{ panels, topicName }}
          style={{ width: '100%', height: '100%' }}
          controls
          loop
        />
      </div>

      {/* フッター */}
      <div className="px-4 py-2.5 bg-gray-800/50 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          コントロールバーで再生・一時停止・シークが可能
        </p>
        <p className="text-xs text-gray-600">Powered by Remotion</p>
      </div>
    </div>
  )
}
