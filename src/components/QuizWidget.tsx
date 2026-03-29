'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'

interface QuizData {
  question: string
  choices: string[]
  correct_index: number
  explanation: string
  wrong_explanations: Record<string, string>
}

export function QuizWidget({ quiz }: { quiz: QuizData }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (index: number) => {
    if (revealed) return
    setSelected(index)
  }

  const handleReveal = () => {
    if (selected === null) return
    setRevealed(true)
  }

  const isCorrect = selected === quiz.correct_index

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-500" />
        確認クイズ
      </h3>

      <p className="text-sm text-gray-800 mb-4 leading-relaxed">
        {quiz.question}
      </p>

      <div className="space-y-2 mb-4">
        {quiz.choices.map((choice, i) => {
          let borderColor = 'border-gray-200 hover:border-indigo-300'
          let bgColor = 'bg-white'

          if (revealed) {
            if (i === quiz.correct_index) {
              borderColor = 'border-green-400'
              bgColor = 'bg-green-50'
            } else if (i === selected && !isCorrect) {
              borderColor = 'border-red-400'
              bgColor = 'bg-red-50'
            }
          } else if (i === selected) {
            borderColor = 'border-indigo-400'
            bgColor = 'bg-indigo-50'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full text-left p-3 rounded-lg border-2 ${borderColor} ${bgColor} transition-all text-sm`}
            >
              <span className="font-medium text-gray-500 mr-2">
                {String.fromCharCode(0x30A2 + i * 2)}.
              </span>
              {choice}
              {revealed && i === quiz.correct_index && (
                <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
              )}
              {revealed && i === selected && !isCorrect && (
                <XCircle className="w-4 h-4 text-red-500 inline ml-2" />
              )}
            </button>
          )
        })}
      </div>

      {!revealed && (
        <button
          onClick={handleReveal}
          disabled={selected === null}
          className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
            selected !== null
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          解答する
        </button>
      )}

      {revealed && (
        <div
          className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          <p
            className={`font-medium mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
          >
            {isCorrect ? '正解!' : '不正解'}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {quiz.explanation}
          </p>
          {!isCorrect &&
            selected !== null &&
            quiz.wrong_explanations[String(selected)] && (
              <p className="text-sm text-red-600 mt-2">
                {quiz.wrong_explanations[String(selected)]}
              </p>
            )}
        </div>
      )}
    </div>
  )
}
