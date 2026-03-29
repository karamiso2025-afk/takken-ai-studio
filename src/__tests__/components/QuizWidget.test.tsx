import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuizWidget } from '@/components/QuizWidget'

const mockQuiz = {
  question: '宅建業法における重要事項説明について、正しいものはどれか。',
  choices: [
    'ア 重要事項説明は契約の後に行えばよい',
    'イ 重要事項説明は宅建士が行わなければならない',
    'ウ 重要事項説明は口頭のみで足りる',
    'エ 重要事項説明は買主のみに行う',
  ],
  correct_index: 1,
  explanation:
    '重要事項説明は、宅建士が記名押印した書面を交付して、宅建士が説明しなければなりません。',
  wrong_explanations: {
    '0': '重要事項説明は契約成立前に行う必要があります。',
    '2': '重要事項説明は書面の交付が必要です。',
    '3': '重要事項説明は売主・買主双方に行います。',
  },
}

describe('QuizWidget', () => {
  it('should render the question', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    expect(
      screen.getByText('宅建業法における重要事項説明について、正しいものはどれか。')
    ).toBeInTheDocument()
  })

  it('should render all 4 choices', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    expect(screen.getByText(/重要事項説明は契約の後に行えばよい/)).toBeInTheDocument()
    expect(screen.getByText(/重要事項説明は宅建士が行わなければならない/)).toBeInTheDocument()
    expect(screen.getByText(/重要事項説明は口頭のみで足りる/)).toBeInTheDocument()
    expect(screen.getByText(/重要事項説明は買主のみに行う/)).toBeInTheDocument()
  })

  it('should have a disabled submit button initially', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    const submitBtn = screen.getByText('解答する')
    expect(submitBtn).toBeDisabled()
  })

  it('should enable submit button after selecting a choice', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    const choice = screen.getByText(/重要事項説明は宅建士が行わなければならない/)
    fireEvent.click(choice)
    const submitBtn = screen.getByText('解答する')
    expect(submitBtn).not.toBeDisabled()
  })

  it('should show 正解 when correct answer is selected', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    const correctChoice = screen.getByText(/重要事項説明は宅建士が行わなければならない/)
    fireEvent.click(correctChoice)
    fireEvent.click(screen.getByText('解答する'))
    expect(screen.getByText('正解!')).toBeInTheDocument()
    expect(screen.getByText(mockQuiz.explanation)).toBeInTheDocument()
  })

  it('should show 不正解 when wrong answer is selected', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    const wrongChoice = screen.getByText(/重要事項説明は契約の後に行えばよい/)
    fireEvent.click(wrongChoice)
    fireEvent.click(screen.getByText('解答する'))
    expect(screen.getByText('不正解')).toBeInTheDocument()
  })

  it('should not allow changing answer after reveal', () => {
    render(<QuizWidget quiz={mockQuiz} />)
    const wrongChoice = screen.getByText(/重要事項説明は契約の後に行えばよい/)
    fireEvent.click(wrongChoice)
    fireEvent.click(screen.getByText('解答する'))

    // All choice buttons should now be disabled
    const allButtons = screen.getAllByRole('button')
    const choiceButtons = allButtons.filter((btn) =>
      btn.textContent?.includes('重要事項説明')
    )
    choiceButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })
})
