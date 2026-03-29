'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, RefreshCw, BookOpen, Film } from 'lucide-react'
import { MangaViewer } from './MangaViewer'
import { QuizWidget } from './QuizWidget'
import { RemotionPreview } from './RemotionPreview'

export interface ContentAsset {
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

interface ContentStatus {
  status: string
  progress_percent: number
  panel_count: number
  completed_panels: number
  assets: ContentAsset[]
  scenario_json: {
    quiz?: {
      question: string
      choices: string[]
      correct_index: number
      explanation: string
      wrong_explanations: Record<string, string>
    }
    keywords?: { term: string; mnemonic: string }[]
    topic?: string
  } | null
  cast_json: { core: string[]; guest: string[] } | null
}

type ViewTab = 'manga' | 'video'

export function ContentView({
  topicId,
  contentId,
  onContentGenerated,
}: {
  topicId: string | null
  contentId: string | null
  onContentGenerated: (id: string) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<ContentStatus | null>(null)
  const [polling, setPolling] = useState(false)
  const [activeContentId, setActiveContentId] = useState<string | null>(contentId)
  const [activeTab, setActiveTab] = useState<ViewTab>('manga')

  const pollStatus = useCallback(async (id: string) => {
    setPolling(true)
    try {
      const res = await fetch(`/api/generate/${id}/status`)
      const data: ContentStatus = await res.json()
      setStatus(data)
      if (data.status === 'complete' || data.status === 'failed') {
        setPolling(false)
        setGenerating(false)
      }
    } catch {
      setPolling(false)
    }
  }, [])

  useEffect(() => {
    if (!activeContentId || !polling) return
    const interval = setInterval(() => { pollStatus(activeContentId) }, 3000)
    return () => clearInterval(interval)
  }, [activeContentId, polling, pollStatus])

  useEffect(() => {
    if (contentId && contentId !== activeContentId) {
      setActiveContentId(contentId)
      setActiveTab('manga')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  useEffect(() => {
    if (activeContentId && !status) { pollStatus(activeContentId) }
  }, [activeContentId, status, pollStatus])

  const handleGenerate = async () => {
    if (!topicId) return
    setGenerating(true)
    setStatus(null)
    setActiveTab('manga')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, content_type: 'manga' }),
      })
      const data = await res.json()
      if (data.content_id) {
        setActiveContentId(data.content_id)
        onContentGenerated(data.content_id)
        setPolling(true)
        pollStatus(data.content_id)
      }
    } catch (err) {
      console.error('Generate failed:', err)
      setGenerating(false)
    }
  }

  if (!topicId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">サイドバーからトピックを選択してください</p>
      </div>
    )
  }

  if (!activeContentId && !generating) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-3">漫画を自動生成</h3>
          <p className="text-sm text-gray-400 mb-2">AIがトピックを分析し、6〜10コマの漫画を自動生成します</p>
          <p className="text-xs text-indigo-500 mb-6 flex items-center justify-center gap-1">
            <Film className="w-3 h-3" />
            生成後に動画プレビュー（Remotion）で閲覧できます
          </p>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            <Sparkles className="w-4 h-4" />ワンクリック生成
          </button>
        </div>
      </div>
    )
  }

  if (generating || (status && status.status !== 'complete' && status.status !== 'failed')) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">生成中...</h3>
            <p className="text-sm text-gray-400 mb-4">
              {status?.status === 'generating_scenario' ? 'シナリオを生成しています...'
                : status?.status === 'generating_images'
                  ? `画像を生成しています... (${status.completed_panels}/${status.panel_count})`
                  : 'キューに追加されました...'}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2.5 max-w-md mx-auto">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${status?.progress_percent || 0}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{status?.progress_percent || 0}%</p>
          </div>
        </div>
      </div>
    )
  }

  if (status?.status === 'failed') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <p className="text-red-500 font-medium mb-4">生成に失敗しました</p>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
            <RefreshCw className="w-4 h-4" />再試行
          </button>
        </div>
      </div>
    )
  }

  const panelAssets = status?.assets.filter(a => a.panel_number !== null && a.public_url) ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {status && panelAssets.length > 0 && (
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab('manga')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'manga' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <BookOpen className="w-4 h-4" />漫画
          </button>
          <button onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Film className="w-4 h-4" />動画プレビュー
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">NEW</span>
          </button>
        </div>
      )}

      {activeTab === 'manga' && status && panelAssets.length > 0 && (
        <MangaViewer assets={status.assets} panelCount={status.panel_count} />
      )}

      {activeTab === 'video' && panelAssets.length > 0 && (
        <RemotionPreview assets={panelAssets} topicName={status?.scenario_json?.topic} panelCount={status?.panel_count} />
      )}

      {status?.scenario_json?.keywords && status.scenario_json.keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">暗記キーワード</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {status.scenario_json.keywords.map((kw, i) => (
              <div key={i} className="bg-yellow-50 rounded-lg p-3">
                <p className="font-medium text-gray-800">{kw.term}</p>
                <p className="text-sm text-gray-500 mt-1">{kw.mnemonic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {status?.scenario_json?.quiz && <QuizWidget quiz={status.scenario_json.quiz} />}
    </div>
  )
}
