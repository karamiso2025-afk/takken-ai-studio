'use client'

import { useState, useEffect, useCallback } from 'react'
import { HelpCircle, Loader2, RotateCcw } from 'lucide-react'
import { QuizWidget } from './QuizWidget'

interface QuizItem {
  question: string
  choices: string[]
  correct_index: number
  explanation: string
  wrong_explanations: Record<string, string>
}

export function QuizView() {
  const [quizzes] = useState<QuizItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const loadQuizzes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats/progress')
      const data = await res.json()

      // Collect quizzes from generated content
      // For now, show placeholder until real quiz data is available
      if (data.quiz?.totalAttempts >= 0) {
        setScore({
          correct: data.quiz.correctAttempts,
          total: data.quiz.totalAttempts,
        })
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuizzes()
  }, [loadQuizzes])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            クイズがありません
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            漫画を生成すると、自動的にクイズが作成されます
          </p>

          {score.total > 0 && (
            <div className="inline-flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {score.correct}/{score.total}
                </p>
                <p className="text-xs text-gray-500">正答</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {score.total > 0
                    ? Math.round((score.correct / score.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-500">正答率</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          クイズ ({currentIndex + 1}/{quizzes.length})
        </h2>
        <button
          onClick={() => {
            setCurrentIndex(0)
            loadQuizzes()
          }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
          リセット
        </button>
      </div>

      <QuizWidget quiz={quizzes[currentIndex]} />

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg disabled:opacity-40"
        >
          前の問題
        </button>
        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(quizzes.length - 1, i + 1))
          }
          disabled={currentIndex === quizzes.length - 1}
          className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg disabled:opacity-40"
        >
          次の問題
        </button>
      </div>
    </div>
  )
}
