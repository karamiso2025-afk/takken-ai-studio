'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Sparkles,
  BookOpen,
  HelpCircle,
  Flame,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Circle,
  Film,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface Stats {
  streak: number
  chapters: {
    id: string
    name: string
    color: string | null
    topics: { id: string; name: string; status: string; complexity: string }[]
  }[]
  quiz: { totalAttempts: number; correctAttempts: number; accuracy: number }
  contentCount: number
}

export function DashboardView({ onTopicSelect }: { onTopicSelect: (topicId: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [setupRunning, setSetupRunning] = useState(false)
  const [setupResult, setSetupResult] = useState<{ ok: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats/progress')
      if (res.ok) setStats(await res.json())
    } catch { /* not logged in */ }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((f) => formData.append('file', f))
      const res = await fetch('/api/textbooks/upload', { method: 'POST', body: formData })
      if (!res.ok) return
      const data = await res.json()
      if (data.textbook_id) {
        setExtracting(true)
        await fetch(`/api/textbooks/${data.textbook_id}/extract`, { method: 'POST' })
        setExtracting(false)
        await loadStats()
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      setExtracting(false)
    }
  }

  const handleCharacterSetup = async () => {
    setSetupRunning(true)
    setSetupResult(null)
    try {
      const res = await fetch('/api/characters/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setSetupResult({ ok: false, message: `エラー: ${data.error || res.status}` })
        return
      }
      if (data.status === 'already_exists') {
        setSetupResult({ ok: true, message: 'キャラクターシートは生成済みです' })
      } else {
        setSetupResult({ ok: true, message: `生成完了！${data.succeeded}人成功 / ${data.total}人中` })
      }
    } catch {
      setSetupResult({ ok: false, message: 'ネットワークエラーが発生しました' })
    } finally {
      setSetupRunning(false)
    }
  }

  const allTopics = stats?.chapters.flatMap((ch) =>
    ch.topics.map((t) => ({ ...t, chapterName: ch.name, color: ch.color }))
  ) || []
  const pendingTopics = allTopics.filter((t) => t.status === 'extracted')
  const completedTopics = allTopics.filter((t) => t.status === 'has_content')
  const hasTopics = allTopics.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ステップガイド（初回orトピックなし） */}
      {!hasTopics && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h2 className="font-black text-gray-900 text-lg mb-1">🎯 宅建合格への3ステップ</h2>
          <p className="text-sm text-gray-500 mb-5">教材をアップロードするだけで、AIが漫画・動画・クイズを自動生成します</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StepCard step={1} icon="📄" title="教材をアップロード" desc="PDF または教科書の写真（JPEG/PNG）" active />
            <StepCard step={2} icon="🎨" title="AIが漫画を生成" desc="トピックごとに6〜10コマの漫画が自動生成" />
            <StepCard step={3} icon="✅" title="クイズで確認" desc="本試験形式のクイズで理解度チェック" />
          </div>
        </div>
      )}

      {/* 統計カード */}
      {hasTopics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat icon={<Flame className="w-4 h-4 text-orange-500" />} label="連続学習" value={`${stats?.streak || 0}日`} bg="bg-orange-50" />
          <MiniStat icon={<BookOpen className="w-4 h-4 text-indigo-500" />} label="トピック数" value={`${allTopics.length}`} bg="bg-indigo-50" />
          <MiniStat icon={<Sparkles className="w-4 h-4 text-emerald-500" />} label="生成済み" value={`${stats?.contentCount || 0}`} bg="bg-emerald-50" />
          <MiniStat icon={<HelpCircle className="w-4 h-4 text-blue-500" />} label="正答率" value={`${stats?.quiz.accuracy || 0}%`} bg="bg-blue-50" />
        </div>
      )}

      {/* アクションエリア */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* アップロード */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || extracting}
          className="group flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors flex-shrink-0">
            {uploading || extracting
              ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              : <Upload className="w-5 h-5 text-indigo-600" />}
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {uploading ? 'アップロード中...' : extracting ? 'トピック抽出中...' : 'テキスト・写真をアップロード'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">PDF / JPEG / PNG / HEIC 対応</p>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic" multiple className="hidden" onChange={handleUpload} />

        {/* キャラクターシート生成 */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleCharacterSetup}
            disabled={setupRunning}
            className="group flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors flex-shrink-0">
              {setupRunning
                ? <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                : <Sparkles className="w-5 h-5 text-purple-600" />}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {setupRunning ? 'キャラクター生成中... (30〜60秒)' : 'キャラクターシート生成'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">田中・佐藤・山田など8人のAIキャラを初回生成</p>
            </div>
          </button>
          {setupResult && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${setupResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {setupResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {setupResult.message}
            </div>
          )}
        </div>
      </div>

      {/* 未生成トピック */}
      {pendingTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-gray-900">
              漫画・動画を生成しよう
            </h2>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full ml-auto">
              {pendingTopics.length}件待機中
            </span>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic.id)}
                className="flex items-center gap-3 p-3 bg-white hover:bg-amber-50 rounded-lg border border-amber-100 hover:border-amber-300 transition-all group text-left"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: topic.color || '#f59e0b' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{topic.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{topic.chapterName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PanelBadge complexity={topic.complexity} />
                  <div className="flex items-center gap-1 text-xs text-amber-600 group-hover:text-amber-700">
                    <Film className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">生成</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 生成済みトピック */}
      {completedTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-gray-900">学習コンテンツ</h2>
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">
              {completedTopics.length}件完成
            </span>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {completedTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic.id)}
                className="flex items-center gap-3 p-3 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-all group text-left"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{topic.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{topic.chapterName}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                  <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold">漫画</span>
                  <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[10px] font-bold">動画</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 空状態 */}
      {!hasTopics && !uploading && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <div className="text-5xl mb-3">📚</div>
          <h3 className="text-base font-bold text-gray-700 mb-1">教材がまだありません</h3>
          <p className="text-sm text-gray-400 mb-4">宅建テキストのPDFや写真をアップロードしてください</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-4 h-4" /> アップロードする
          </button>
        </div>
      )}
    </div>
  )
}

function StepCard({ step, icon, title, desc, active }: { step: number; icon: string; title: string; desc: string; active?: boolean }) {
  return (
    <div className={`flex gap-3 p-4 rounded-xl ${active ? 'bg-white shadow-sm border border-indigo-200 ring-2 ring-indigo-100' : 'bg-white/60 border border-gray-100'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {step}
      </div>
      <div>
        <div className="text-lg leading-none mb-1">{icon}</div>
        <p className="font-bold text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3.5 flex items-center gap-3`}>
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-black text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

function PanelBadge({ complexity }: { complexity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    simple:   { label: '6コマ', cls: 'bg-green-100 text-green-700' },
    standard: { label: '8コマ', cls: 'bg-blue-100 text-blue-700' },
    complex:  { label: '10コマ', cls: 'bg-purple-100 text-purple-700' },
  }
  const style = map[complexity] ?? { label: '8コマ', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${style.cls}`}>{style.label}</span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _unused() {
  return <Circle className="hidden" />
}
