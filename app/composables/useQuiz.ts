export type QuizType = 'adivinhe_lenda' | 'qual_caracteristica' | 'qual_estado'
export type QuizStatus = 'idle' | 'loading' | 'playing' | 'finished'
export type QuizDifficulty = 'facil' | 'medio' | 'dificil'

export interface QuizQuestion {
  id: number
  quiz_type: QuizType
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
  difficulty: QuizDifficulty
  related_article_id: number | null
}

export interface AnsweredQuestion {
  question: QuizQuestion
  selectedIndex: number
  correct: boolean
}

export interface AdminQuizQuestion extends QuizQuestion {
  is_active: boolean
  created_at: string
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function useQuiz() {
  const client = useSupabaseClient()

  const questions = useState<QuizQuestion[]>('quiz-questions', () => [])
  const currentIndex = useState<number>('quiz-current-index', () => 0)
  const answered = useState<AnsweredQuestion[]>('quiz-answered', () => [])
  const status = useState<QuizStatus>('quiz-status', () => 'idle')
  const difficulty = useState<QuizDifficulty | null>('quiz-difficulty', () => null)

  const currentQuestion = computed<QuizQuestion | null>(() => questions.value[currentIndex.value] ?? null)
  const progress = computed(() => ({ current: currentIndex.value + 1, total: questions.value.length }))
  const score = computed(() => answered.value.filter((a) => a.correct).length)
  const isGameOver = computed(() => status.value === 'finished')
  const percentage = computed(() => (questions.value.length ? Math.round((score.value / questions.value.length) * 100) : 0))

  async function startQuiz(type: QuizType, selectedDifficulty: QuizDifficulty | null = null, count = 10): Promise<void> {
    status.value = 'loading'
    difficulty.value = selectedDifficulty

    let query = client
      .from('quiz_questions')
      .select('*')
      .eq('quiz_type', type)
      .eq('is_active', true)

    if (selectedDifficulty) query = query.eq('difficulty', selectedDifficulty)

    const { data } = await query

    questions.value = shuffle((data as QuizQuestion[]) ?? []).slice(0, count)
    currentIndex.value = 0
    answered.value = []
    status.value = questions.value.length ? 'playing' : 'finished'
  }

  function answerQuestion(selectedIndex: number): void {
    const question = currentQuestion.value
    if (!question || status.value !== 'playing') return
    if (answered.value.some((a) => a.question.id === question.id)) return

    answered.value.push({
      question,
      selectedIndex,
      correct: selectedIndex === question.correct_index,
    })
  }

  function nextQuestion(): void {
    if (currentIndex.value + 1 < questions.value.length) {
      currentIndex.value++
    } else {
      status.value = 'finished'
    }
  }

  function resetQuiz(): void {
    questions.value = []
    currentIndex.value = 0
    answered.value = []
    status.value = 'idle'
  }

  return {
    questions,
    currentIndex,
    currentQuestion,
    progress,
    answered,
    score,
    percentage,
    status,
    difficulty,
    isGameOver,
    startQuiz,
    answerQuestion,
    nextQuestion,
    resetQuiz,
  }
}
