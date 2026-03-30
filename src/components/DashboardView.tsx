'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Sparkles,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Flame,
  Loader2,
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

export function DashboardView({
  onTopicSelect,
}: {
  onTopicSelect: (topicId: string) => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [setupRunning, setSetupRunning] = useState(false)
  const [setupResult, setSetupResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [characterSheets, setCharacterSheets] = useState<{ key: string; name: string; url: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats/progress')
      if (!res.ok) return
      const data = await res.json()
      setStats(data)
    } catch {
      // Not logged in or error
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      // 複数ファイル（写真の場合は複数ページ可）
      Array.from(files).forEach((f) => formData.append('file', f))

      const res = await fetch('/api/textbooks/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('Upload error:', res.status, text)
        return
      }

      const data = await res.json()

      if (data.textbook_id) {
        // Extract topics
        setExtracting(true)
        const extractRes = await fetch(`/api/textbooks/${data.textbook_id}/extract`, {
          method: 'POST',
        })
        if (!extractRes.ok) {
          const text = await extractRes.text()
          console.error('Extract error:', extractRes.status, text)
        }
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
        setSetupResult({ ok: true, message: 'キャラクターシートは既に生成済みです' })
      } else {
        setSetupResult({ ok: true, message: `生成完了！${data.succeeded}人成功 / ${data.total}人中${data.failed > 0 ? `（${data.failed}人失敗）` : ''}` })
      }
      // 生成済みシートを取得して表示
      const sheetsRes = await fetch('/api/characters/sheets')
      if (sheetsRes.ok) {
        const sheets = await sheetsRes.json()
        setCharacterSheets(sheets)
      }
    } catch (err) {
      console.error('Character setup failed:', err)
      setSetupResult({ ok: false, message: 'ネットワークエラーが発生しました' })
    } finally {
      setSetupRunning(false)
    }
  }

  const allTopics =
    stats?.chapters.flatMap((ch) =>
      ch.topics.map((t) => ({ ...t, chapterName: ch.name, color: ch.color }))
    ) || []

  const pendingTopics = allTopics.filter((t) => t.status === 'extracted')
  const completedTopics = allTopics.filter((t) => t.status === 'has_content')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="連続学習"
          value={`${stats?.streak || 0}日`}
          color="bg-orange-50"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-indigo-500" />}
          label="トピック数"
          value={`${allTopics.length}`}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5 text-emerald-500" />}
          label="生成済み"
          value={`${stats?.contentCount || 0}`}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<HelpCircle className="w-5 h-5 text-blue-500" />}
          label="正答率"
          value={`${stats?.quiz.accuracy || 0}%`}
          color="bg-blue-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PDF Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || extracting}
          className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
        >
          {uploading || extracting ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-indigo-500" />
          )}
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {uploading
                ? 'アップロード中...'
                : extracting
                  ? 'トピック抽出中...'
                  : 'テキスト・写真をアップロード'}
            </p>
            <p className="text-sm text-gray-500">
              PDF または教科書の写真（JPEG/PNG）をアップロード
            </p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
          multiple
          className="hidden"
          onChange={handleUpload}
        />

        {/* Character Setup */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCharacterSetup}
            disabled={setupRunning}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50/30 transition-all"
          >
            {setupRunning ? (
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            ) : (
              <Sparkles className="w-8 h-8 text-purple-500" />
            )}
            <div className="text-left">
              <p className="font-medium text-gray-900">
                {setupRunning
                  ? 'キャラクター生成中... (30〜60秒)'
                  : 'キャラクターシート生成'}
              </p>
              <p className="text-sm text-gray-500">
                8人のキャラクターをAIで生成・保存
              </p>
            </div>
          </button>
          {setupResult && (
            <p className={`text-sm px-3 py-2 rounded-lg ${setupResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {setupResult.ok ? '✅' : '❌'} {setupResult.message}
            </p>
          )}
        </div>
      </div>

      {/* Character Sheets Preview */}
      {characterSheets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-900 mb-3">生成済みキャラクター</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {characterSheets.map((sheet) => (
              <div key={sheet.key} className="text-center">
                <img
                  src={sheet.url}
                  alt={sheet.name}
                  className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                />
                <p className="text-xs text-gray-600 mt-1">{sheet.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Lists */}
      {pendingTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              漫画未生成のトピック
              <span className="text-sm font-normal text-gray-400">
                ({pendingTopics.length})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: topic.color || '#6366f1' }}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {topic.name}
                    </p>
                    <p className="text-xs text-gray-400">{topic.chapterName}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    topic.complexity === 'simple'
                      ? 'bg-green-100 text-green-700'
                      : topic.complexity === 'complex'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {topic.complexity === 'simple'
                    ? '6コマ'
                    : topic.complexity === 'complex'
                      ? '10コマ'
                      : '8コマ'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {completedTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              生成済みトピック
              <span className="text-sm font-normal text-gray-400">
                ({completedTopics.length})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {completedTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {topic.name}
                    </p>
                    <p className="text-xs text-gray-400">{topic.chapterName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allTopics.length === 0 && !uploading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            まだトピックがありません
          </h3>
          <p className="text-sm text-gray-400">
            PDF または教科書の写真（JPEG/PNG）をアップロードして学習を始めましょう
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className={`${color} rounded-xl p-4 flex items-center gap-3`}>
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
