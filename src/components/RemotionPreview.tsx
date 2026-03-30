'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, SkipForward, SkipBack, Maximize2 } from 'lucide-react'
import { getCharacterByKey } from '@/lib/characters'

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

const CHAR_STYLES: Record<string, { bg: string; border: string; label: string; headerBg: string; initial: string }> = {
  tanaka:    { bg: '#FFF3E0', border: '#FF8F00', label: '#E65100', headerBg: '#FF8F00', initial: '田' },
  sato:      { bg: '#E8F5E9', border: '#388E3C', label: '#1B5E20', headerBg: '#388E3C', initial: '佐' },
  yamada:    { bg: '#E3F2FD', border: '#1565C0', label: '#0D47A1', headerBg: '#1565C0', initial: '山' },
  narrator:  { bg: '#F5F5F5', border: '#616161', label: '#424242', headerBg: '#616161', initial: 'N' },
  suzuki:    { bg: '#FFFDE7', border: '#F9A825', label: '#F57F17', headerBg: '#F9A825', initial: '鈴' },
  nakamura:  { bg: '#ECEFF1', border: '#546E7A', label: '#37474F', headerBg: '#546E7A', initial: '中' },
  kuroda:    { bg: '#FFEBEE', border: '#C62828', label: '#B71C1C', headerBg: '#C62828', initial: '黒' },
  kimura:    { bg: '#E0F2F1', border: '#00695C', label: '#004D40', headerBg: '#00695C', initial: '木' },
  takahashi: { bg: '#F3E5F5', border: '#6A1B9A', label: '#4A148C', headerBg: '#6A1B9A', initial: '高' },
}
function getCharStyle(key: string) {
  return CHAR_STYLES[key] ?? { bg: '#FAFAFA', border: '#9E9E9E', label: '#757575', headerBg: '#9E9E9E', initial: '?' }
}

const PANEL_DURATION_MS = 4500

export function RemotionPreview({
  assets,
  topicName,
  panelCount,
}: {
  assets: ContentAsset[]
  topicName?: string
  panelCount?: number
}) {
  const panels = [...assets]
    .filter((a) => a.panel_number !== null)
    .sort((a, b) => (a.panel_number ?? 0) - (b.panel_number ?? 0))

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visibleDialogue, setVisibleDialogue] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const currentPanel = panels[currentIndex]
  const dialogue = currentPanel?.overlay_data?.dialogue ?? []

  const goToPanel = useCallback((index: number) => {
    setIsTransitioning(true)
    setVisibleDialogue(0)
    setProgress(0)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 220)
  }, [])

  // セリフを1行ずつ出現
  useEffect(() => {
    if (!isPlaying || isTransitioning) return
    if (visibleDialogue >= dialogue.length) return
    const delay = visibleDialogue === 0 ? 500 : 900
    const t = setTimeout(() => setVisibleDialogue((v) => v + 1), delay)
    return () => clearTimeout(t)
  }, [isPlaying, visibleDialogue, dialogue.length, isTransitioning])

  // プログレスバー
  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    if (!isPlaying) return
    startTimeRef.current = Date.now()
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      setProgress(Math.min((elapsed / PANEL_DURATION_MS) * 100, 100))
    }, 50)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [isPlaying, currentIndex])

  // 自動進行
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!isPlaying) return
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1
        if (next >= panels.length) {
          setIsPlaying(false)
          return prev
        }
        goToPanel(next)
        return next
      })
    }, PANEL_DURATION_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, panels.length, goToPanel])

  const handlePlay = () => {
    if (currentIndex >= panels.length - 1 && !isPlaying) {
      goToPanel(0)
      setTimeout(() => setIsPlaying(true), 300)
    } else {
      setIsPlaying((p) => !p)
    }
  }

  if (!currentPanel) return null

  const overlay = currentPanel.overlay_data
  const hasImage = (currentPanel.asset_type === 'image' || (!currentPanel.asset_type && currentPanel.public_url)) && currentPanel.public_url
  const displayedDialogue = isPlaying ? dialogue.slice(0, visibleDialogue) : dialogue

  return (
    <div className="bg-gray-950 rounded-xl overflow-hidden shadow-2xl">
      {/* タイトルバー */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-400 text-xs font-medium flex-1 text-center">
          🎬 {topicName ?? '宅建学習動画'} — {panelCount ?? panels.length}コマ
        </span>
        <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
      </div>

      {/* メイン表示エリア */}
      <div className="relative bg-gray-950" style={{ minHeight: 440 }}>
        <div
          className="w-full max-w-2xl mx-auto px-6 py-6 transition-all duration-250"
          style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)' }}
        >
          {/* シーンヘッダー */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
              {currentPanel.panel_number}
            </div>
            <div>
              <div className="text-gray-200 text-sm font-semibold">{overlay?.scene ?? ''}</div>
              <div className="text-gray-500 text-xs">コマ {currentIndex + 1} / {panels.length}</div>
            </div>
          </div>

          {/* 実画像（ある場合） */}
          {hasImage && (
            <div className="mb-5 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentPanel.public_url!} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
            </div>
          )}

          {/* キャラクターシルエット（画像なし時） */}
          {!hasImage && (
            <div className="flex justify-center gap-10 mb-6">
              {getUniqueChars(dialogue).map((k) => (
                <VideoCharacter key={k} charKey={k} />
              ))}
            </div>
          )}

          {/* セリフ */}
          <div className="space-y-3 min-h-[120px]">
            {dialogue.map((d, i) => {
              const style = getCharStyle(d.character)
              const char = getCharacterByKey(d.character)
              const firstName = char?.name.split(' ')[0] ?? d.character
              const isVisible = isPlaying ? i < visibleDialogue : true
              const isRight = i % 2 === 1

              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-400 ${isRight ? 'flex-row-reverse' : ''}`}
                  style={{
                    opacity: isVisible ? 1 : 0.1,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.98)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg"
                    style={{ background: style.headerBg, border: `2.5px solid ${style.border}` }}
                  >
                    {style.initial}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[75%] shadow-md border-2 ${isRight ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={{ background: style.bg, borderColor: style.border }}
                  >
                    <div className="text-[10px] font-black mb-1" style={{ color: style.label }}>{firstName}</div>
                    <div className="font-semibold text-sm leading-relaxed text-gray-900">{d.text}</div>
                  </div>
                </div>
              )
            })}

            {/* アニメーション中の空セリフインジケーター */}
            {isPlaying && visibleDialogue < dialogue.length && (
              <div className="flex items-center gap-1 pl-14 opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* ナレーター */}
          {overlay?.narrator_box && (
            <div className="mt-4 text-center text-sm italic text-gray-300 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
              {overlay.narrator_box}
            </div>
          )}

          {/* 重要ポイント */}
          {overlay?.info_box && (
            <div className="mt-4 flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-xl">
              <span className="text-lg">📌</span>
              <span className="leading-snug">{overlay.info_box}</span>
            </div>
          )}
        </div>

        {/* パネルドット */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {panels.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIsPlaying(false); goToPanel(i) }}
              className="rounded-full transition-all duration-300 hover:scale-125"
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                background: i === currentIndex ? '#6366f1' : i < currentIndex ? '#4ade80' : '#374151',
              }}
            />
          ))}
        </div>
      </div>

      {/* プログレスバー */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-indigo-500 transition-none"
          style={{ width: isPlaying ? `${progress}%` : `${(currentIndex / Math.max(panels.length - 1, 1)) * 100}%` }}
        />
      </div>

      {/* コントロールバー */}
      <div className="flex items-center gap-4 px-6 py-3.5 bg-gray-900 border-t border-gray-800">
        <button
          onClick={() => { setIsPlaying(false); goToPanel(Math.max(0, currentIndex - 1)) }}
          disabled={currentIndex === 0}
          className="text-gray-400 hover:text-white disabled:opacity-25 transition-colors"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={handlePlay}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-xl transition-all hover:scale-105"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={() => { setIsPlaying(false); goToPanel(Math.min(panels.length - 1, currentIndex + 1)) }}
          disabled={currentIndex >= panels.length - 1}
          className="text-gray-400 hover:text-white disabled:opacity-25 transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="ml-2 text-gray-400 text-xs">
          {currentIndex + 1} / {panels.length} コマ
        </div>

        <div className="ml-auto text-gray-600 text-xs hidden sm:block">
          ▶ 再生するとセリフが順に登場
        </div>
      </div>
    </div>
  )
}

function getUniqueChars(dialogue: { character: string; text: string }[]): string[] {
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

function VideoCharacter({ charKey }: { charKey: string }) {
  const style = getCharStyle(charKey)
  const char = getCharacterByKey(charKey)
  const firstName = char?.name.split(' ')[0] ?? charKey

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="64" height="76" viewBox="0 0 64 76" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 体（スーツ） */}
        <path d="M12 76 L15 44 Q32 38 49 44 L52 76 Z" fill={style.headerBg} stroke={style.border} strokeWidth="2" />
        {/* 首 */}
        <rect x="27" y="35" width="10" height="9" fill={style.bg} stroke={style.border} strokeWidth="1.5" />
        {/* 頭 */}
        <ellipse cx="32" cy="20" rx="15" ry="16" fill={style.bg} stroke={style.border} strokeWidth="2.5" />
        {/* 目 */}
        <ellipse cx="26" cy="19" rx="2.5" ry="2.5" fill={style.label} />
        <ellipse cx="38" cy="19" rx="2.5" ry="2.5" fill={style.label} />
        {/* ハイライト */}
        <circle cx="27" cy="18" r="0.8" fill="white" />
        <circle cx="39" cy="18" r="0.8" fill="white" />
        {/* 口 */}
        <path d="M25 27 Q32 32 39 27" stroke={style.label} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 頭文字 */}
        <text x="32" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill={style.label}>
          {style.initial}
        </text>
      </svg>
      <span className="font-bold text-sm" style={{ color: style.headerBg }}>{firstName}</span>
    </div>
  )
}
