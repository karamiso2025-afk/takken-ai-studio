import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('streak_days, last_study_date')
    .eq('id', user.id)
    .single()

  // Get all chapters with topics for user's textbooks
  const { data: textbooks } = await supabase
    .from('textbooks')
    .select('id')
    .eq('user_id', user.id)

  const textbookIds = textbooks?.map((t) => t.id) || []

  const { data: chapters } = await supabase
    .from('chapters')
    .select(`
      id, name, chapter_number, color,
      topics (id, name, status, complexity)
    `)
    .in('textbook_id', textbookIds.length > 0 ? textbookIds : ['none'])
    .order('chapter_number')

  // Get quiz stats
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, is_correct')
    .eq('user_id', user.id)

  const totalAttempts = attempts?.length || 0
  const correctAttempts = attempts?.filter((a) => a.is_correct).length || 0

  // Find weak topics (topics with < 50% correct rate)
  const quizStats = new Map<string, { correct: number; total: number }>()
  if (attempts) {
    for (const a of attempts) {
      const stat = quizStats.get(a.quiz_id) || { correct: 0, total: 0 }
      stat.total += 1
      if (a.is_correct) stat.correct += 1
      quizStats.set(a.quiz_id, stat)
    }
  }

  // Get generated content count
  const { count: contentCount } = await supabase
    .from('generated_content')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'complete')

  return NextResponse.json({
    streak: profile?.streak_days || 0,
    lastStudyDate: profile?.last_study_date,
    chapters: chapters || [],
    quiz: {
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : 0,
    },
    contentCount: contentCount || 0,
  })
}
