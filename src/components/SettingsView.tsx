'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Settings, RefreshCw, Loader2, CheckCircle, Film, Volume2, Clapperboard, Check } from 'lucide-react'

interface CharacterSheet {
  id: string
  character_key: string
  character_type: string
  public_url: string | null
}

type VideoLevel = 1 | 2 | 3

const VIDEO_LEVELS: {
  level: VideoLevel
  icon: React.ComponentType<{ className?: string }>
  label: string
  cost: string
  description: string
  status: 'active' | 'phase2c' | 'phase3'
}[] = [
  { level: 1, icon: Film, label: 'Level 1 — Remotion 紙芝居', cost: '¥0/月（追加費用なし）',
    description: '漫画パネルをアニメーションでつなぐ紙芝居動画をブラウザ上でプレビュー', status: 'active' },
  { level: 2, icon: Volume2, label: 'Level 2 — 音声ナレーション付き', cost: '+¥750/月（ElevenLabs）',
    description: '山田先生の音声解説が付いた動画 — Phase 2c で実装予定', status: 'phase2c' },
  { level: 3, icon: Clapperboard, label: 'Level 3 — Veo 3.1 CGドラマ', cost: '+¥1,800/月（Veo 3.1）',
    description: 'AI生成フルCGドラマ映像（主要トピックのみ）— Phase 3 で実装予定', status: 'phase3' },
]

export function SettingsView() {
  const [characterSheets] = useState<CharacterSheet[]>([])
  const [regenerating, setRegenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedVideoLevel, setSelectedVideoLevel] = useState<VideoLevel>(1)

  const loadSheets = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: Add dedicated API route for character sheets
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSheets() }, [loadSheets])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await fetch('/api/characters/setup', { method: 'POST' })
      await loadSheets()
    } catch (err) { console.error('Regenerate failed:', err) }
    finally { setRegenerating(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Settings className="w-6 h-6" />設定
      </h2>

      {/* キャラクターシート */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">キャラクターシート</h3>
          <button onClick={handleRegenerate} disabled={regenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50">
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            再生成
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
        ) : characterSheets.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {characterSheets.map((sheet) => (
              <div key={sheet.id} className="aspect-square rounded-lg border border-gray-200 overflow-hidden relative">
                {sheet.public_url && <Image src={sheet.public_url} alt={sheet.character_key} fill className="object-cover" unoptimized />}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">{sheet.character_key}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">キャラクターシートが未生成です</p>
            <p className="text-xs text-gray-300 mt-1">ダッシュボードから「キャラクターシート生成」を実行してください</p>
          </div>
        )}
      </div>

      {/* 動画レベル設定 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Film className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-gray-900">動画生成レベル</h3>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">v0.3 新機能</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">コストに応じて動画品質を選択できます。Level 1 は追加費用ゼロで今すぐ使えます。</p>
        <div className="space-y-3">
          {VIDEO_LEVELS.map(({ level, icon: Icon, label, cost, description, status }) => {
            const isActive = status === 'active'
            const isSelected = selectedVideoLevel === level
            return (
              <button key={level} onClick={() => isActive && setSelectedVideoLevel(level)} disabled={!isActive}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected && isActive ? 'border-indigo-500 bg-indigo-50'
                    : isActive ? 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected && isActive ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                    {isSelected && isActive && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm">{label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isActive ? 'bg-green-100 text-green-700' : status === 'phase2c' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                        {isActive ? '利用可能' : status === 'phase2c' ? 'Phase 2c' : 'Phase 3'}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 font-medium mt-1">{cost}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>現在の設定: Level {selectedVideoLevel}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            月額コスト目安: {selectedVideoLevel === 1 ? '¥2,500' : selectedVideoLevel === 2 ? '¥3,250' : '¥5,050'}
          </span>
        </div>
      </div>

      {/* API接続状態 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">API接続状態</h3>
        <div className="space-y-3">
          <ApiStatusRow name="Supabase" status="configured" />
          <ApiStatusRow name="Claude API (Anthropic)" status="configured" />
          <ApiStatusRow name="Gemini API (Google)" status="configured" />
          <ApiStatusRow name="Inngest" status="configured" />
          <ApiStatusRow name="Remotion (紙芝居動画)" status="active" />
          <ApiStatusRow name="ElevenLabs (音声ナレーション)" status="phase2c" />
          <ApiStatusRow name="Veo 3.1 (CGドラマ)" status="phase3" />
        </div>
      </div>
    </div>
  )
}

function ApiStatusRow({ name, status }: {
  name: string
  status: 'configured' | 'missing' | 'active' | 'phase2b' | 'phase2c' | 'phase3'
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-700">{name}</span>
      {status === 'configured' ? (
        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5" />設定済み</span>
      ) : status === 'active' ? (
        <span className="flex items-center gap-1 text-xs text-indigo-600"><CheckCircle className="w-3.5 h-3.5" />有効（Phase 2b）</span>
      ) : status === 'missing' ? (
        <span className="text-xs text-red-500">未設定</span>
      ) : (
        <span className="text-xs text-gray-400">
          {status === 'phase2b' ? 'Phase 2b' : status === 'phase2c' ? 'Phase 2c' : 'Phase 3'}
        </span>
      )}
    </div>
  )
}
