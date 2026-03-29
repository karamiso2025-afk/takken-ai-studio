'use client'

import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { ViewType } from '@/app/page'

interface Chapter {
  id: string
  name: string
  chapter_number: number
  color: string | null
  topics: {
    id: string
    name: string
    status: string
    complexity: string
  }[]
}

const navItems: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'ダッシュボード', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'content', label: 'コンテンツ', icon: <BookOpen className="w-5 h-5" /> },
  { key: 'quiz', label: 'クイズ', icon: <HelpCircle className="w-5 h-5" /> },
  { key: 'settings', label: '設定', icon: <Settings className="w-5 h-5" /> },
]

const complexityBadge: Record<string, { label: string; color: string }> = {
  simple: { label: '6コマ', color: 'bg-green-100 text-green-700' },
  standard: { label: '8コマ', color: 'bg-blue-100 text-blue-700' },
  complex: { label: '10コマ', color: 'bg-purple-100 text-purple-700' },
}

const statusDot: Record<string, string> = {
  pending: 'bg-gray-300',
  extracted: 'bg-yellow-400',
  has_content: 'bg-green-500',
}

export function Sidebar({
  open,
  onToggle,
  currentView,
  onNavigate,
  onTopicSelect,
}: {
  open: boolean
  onToggle: () => void
  currentView: ViewType
  onNavigate: (view: ViewType) => void
  onTopicSelect: (topicId: string) => void
}) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/stats/progress')
      .then((r) => r.json())
      .then((data) => {
        if (data.chapters) setChapters(data.chapters)
      })
      .catch(() => {})
  }, [])

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 bg-white border-r border-gray-200
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}
          flex flex-col
        `}
      >
        {/* Close button (mobile) */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <span className="font-bold text-gray-900">メニュー</span>
          <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  currentView === item.key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Chapter tree */}
        <div className="flex-1 overflow-y-auto border-t border-gray-100 p-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">
            教科書
          </p>

          {chapters.length === 0 && (
            <p className="text-xs text-gray-400 px-2">
              PDF・写真をアップロードするとここに表示されます
            </p>
          )}

          {chapters.map((ch) => (
            <div key={ch.id} className="mb-1">
              <button
                onClick={() => toggleChapter(ch.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-sm"
              >
                {expandedChapters.has(ch.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ch.color || '#6366f1' }}
                />
                <span className="truncate font-medium text-gray-700">
                  {ch.name}
                </span>
              </button>

              {expandedChapters.has(ch.id) && ch.topics && (
                <div className="ml-8 space-y-0.5">
                  {ch.topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => onTopicSelect(topic.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 text-xs text-left"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusDot[topic.status] || 'bg-gray-300'}`}
                      />
                      <span className="truncate flex-1 text-gray-600">
                        {topic.name}
                      </span>
                      {complexityBadge[topic.complexity] && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${complexityBadge[topic.complexity].color}`}
                        >
                          {complexityBadge[topic.complexity].label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
