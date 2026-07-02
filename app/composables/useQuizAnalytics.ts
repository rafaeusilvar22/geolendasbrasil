import type { AnsweredQuestion, QuizType } from './useQuiz'

const SESSION_STORAGE_KEY = 'quiz-session-id'

export function useQuizAnalytics() {
  const client = useSupabaseClient()

  function getSessionId(): string {
    let id = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  }

  async function logAttempt(type: QuizType, score: number, total: number, answers: AnsweredQuestion[]): Promise<void> {
    try {
      await client.from('quiz_attempts').insert({
        session_id: getSessionId(),
        quiz_type: type,
        score,
        total,
        answers: answers.map((a) => ({
          question_id: a.question.id,
          selected_index: a.selectedIndex,
          correct: a.correct,
        })),
      })
    } catch {
      // analytics must never break the result screen
    }
  }

  return { getSessionId, logAttempt }
}
