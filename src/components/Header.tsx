'use client'

import { Menu, BookOpen, Flame } from 'lucide-react'
import type { ViewType } from '@/app/page'

const viewTitles: Record<ViewType, string> = {
  dashboard: 'ダッシュボード',
  content: 'コンテンツ',
  quiz: 'クイズ',
  settings: '設定',
}

export function Header({
  onMenuToggle,
  currentView,
}: {
  onMenuToggle: () => void
  currentView: ViewType
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <h1 className="text-lg font-bold text-gray-900">
            TakkenAI Studio
          </h1>
        </div>
        <span className="text-sm text-gray-500 hidden md:inline">
          / {viewTitles[currentView]}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">0日連続</span>
        </div>
      </div>
    </header>
  )
}
