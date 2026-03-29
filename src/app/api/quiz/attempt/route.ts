import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { quiz_id, selected_index } = (await req.json()) as {
    quiz_id: string
    selected_index: number
  }

  if (!quiz_id || selected_index === undefined) {
    return NextResponse.json(
      { error: 'quiz_id and selected_index are required' },
      { status: 400 }
    )
  }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quiz_id)
    .single()

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const isCorrect = selected_index === quiz.correct_index

  await supabase.from('quiz_attempts').insert({
    user_id: user.id,
    quiz_id,
    selected_index,
    is_correct: isCorrect,
  })

  // Update streak
  const today = new Date().toISOString().split('T')[0]
  const { data: userProfile } = await supabase
    .from('users')
    .select('last_study_date, streak_days')
    .eq('id', user.id)
    .single()

  if (userProfile) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    let newStreak = userProfile.streak_days

    if (userProfile.last_study_date === yesterday) {
      newStreak += 1
    } else if (userProfile.last_study_date !== today) {
      newStreak = 1
    }

    await supabase
      .from('users')
      .update({ last_study_date: today, streak_days: newStreak })
      .eq('id', user.id)
  }

  return NextResponse.json({
    is_correct: isCorrect,
    explanation: quiz.explanation,
    correct_index: quiz.correct_index,
    wrong_explanations: quiz.wrong_explanations,
  })
}
