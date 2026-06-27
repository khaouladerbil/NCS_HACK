import { useState } from "react"
import { toast } from "@heroui/react"
import { BookOpen, CheckCircle, ChevronRight, Loader2, RefreshCw, SendHorizontal, Trophy, XCircle } from "lucide-react"
import { TextEffect } from "@/components/core/text-effect"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { generateQuiz } from "@/lib/backend"
import { useLang } from "@/lib/language"

const TOPICS = [
  "Divorce et séparation", "Droit du travail", "Héritage et succession",
  "Bail et location", "Droit pénal", "Droits du consommateur",
  "Droit commercial", "Procédures administratives", "Droit de la famille",
]

type Question = {
  id: number
  question: string
  options: string[]
  correct: number
  explanation: string
}

type Quiz = {
  topic: string
  questions: Question[]
}

type ScoreEntry = {
  topic: string
  score: number
  total: number
  date: string
}

const SCORES_KEY = "quiz_scores"

function loadScores(): ScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveScore(entry: ScoreEntry) {
  const prev = loadScores()
  localStorage.setItem(SCORES_KEY, JSON.stringify([entry, ...prev].slice(0, 20)))
}

function medal(score: number, total: number) {
  const pct = score / total
  if (pct === 1) return "🥇"
  if (pct >= 0.6) return "🥈"
  return "🥉"
}

export function ProfessorMode() {
  const { t } = useLang()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [customTopic, setCustomTopic] = useState("")
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores())

  function score() {
    if (!quiz) return 0
    return quiz.questions.filter((q) => answers[q.id] === q.correct).length
  }

  async function loadQuiz(topic?: string) {
    setLoading(true)
    setAnswers({})
    setRevealed({})
    setFinished(false)
    setQuiz(null)
    try {
      const data = await generateQuiz(topic)
      setQuiz(data)
    } catch {
      toast("Impossible de générer le quiz. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  function answer(questionId: number, optionIndex: number) {
    if (revealed[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
    setRevealed((prev) => ({ ...prev, [questionId]: true }))
  }

  function submitAll() {
    if (!quiz) return
    const allRevealed: Record<number, boolean> = {}
    quiz.questions.forEach((q) => { allRevealed[q.id] = true })
    setRevealed(allRevealed)
    setFinished(true)

    const entry: ScoreEntry = {
      topic: quiz.topic,
      score: score(),
      total: quiz.questions.length,
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    }
    saveScore(entry)
    setScores(loadScores())
  }

  const allAnswered = quiz ? quiz.questions.every((q) => answers[q.id] !== undefined) : false

  function launchCustomTopic() {
    const trimmed = customTopic.trim()
    if (!trimmed) return
    setSelectedTopic(trimmed)
    setCustomTopic("")
    void loadQuiz(trimmed)
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-8 overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[#374151] uppercase">{t("quiz.title")}</p>
          <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.03em] text-[#111827]">
            <TextEffect per="word" preset="fade">
              {t("quiz.subtitle")}
            </TextEffect>
          </h2>
          <p className="mt-2 text-[0.9rem] leading-6 text-[#4b5563]">
            {t("quiz.description")}
          </p>
        </div>

        {/* Topic selector */}
        {!quiz && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => { setSelectedTopic(topic); void loadQuiz(topic) }}
                  className="rounded-xl border border-[#e2d9ce] bg-white px-4 py-3 text-left text-sm font-medium text-[#291c08] hover:border-[#291c08] hover:bg-[#faf7f4] transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSelectedTopic(null); void loadQuiz() }}
              className="w-full rounded-xl border-2 border-dashed border-[#c4b49a] bg-white px-4 py-3 text-sm font-semibold text-[#291c08] hover:bg-[#faf7f4] transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="size-4" /> {t("quiz.random")}
            </button>

            {/* Custom topic */}
            <div className="flex gap-2">
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") launchCustomTopic() }}
                placeholder={t("quiz.custom.placeholder")}
                className="min-w-0 flex-1 rounded-xl border border-[#e2d9ce] bg-white px-4 py-3 text-sm text-[#291c08] outline-none placeholder:text-[#8a7762] transition-colors focus:border-[#291c08]"
              />
              <button
                onClick={launchCustomTopic}
                disabled={!customTopic.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#e2d9ce] bg-white px-4 py-3 text-sm font-semibold text-[#291c08] transition-colors hover:border-[#291c08] hover:bg-[#faf7f4] disabled:opacity-40"
              >
                <SendHorizontal className="size-4" />
                {t("quiz.custom.launch")}
              </button>
            </div>

            {/* Historique des scores */}
            {scores.length > 0 && (
              <div className="rounded-xl border border-[#e2d9ce] bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-[#8a7762]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8a7762]">
                    Historique des scores
                  </p>
                </div>
                <div className="space-y-1.5">
                  {scores.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-[#faf7f4] px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{medal(entry.score, entry.total)}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#291c08] truncate">{entry.topic}</p>
                          <p className="text-[10px] text-[#8a7762]">{entry.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <span className={cn(
                          "text-sm font-bold",
                          entry.score === entry.total ? "text-green-600" :
                          entry.score / entry.total >= 0.6 ? "text-[#291c08]" : "text-red-500"
                        )}>
                          {entry.score}
                        </span>
                        <span className="text-xs text-[#8a7762]">/ {entry.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { localStorage.removeItem(SCORES_KEY); setScores([]) }}
                  className="text-[10px] text-[#c4b49a] hover:text-red-400 transition-colors"
                >
                  Effacer l'historique
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-8 animate-spin text-[#291c08]" />
            <p className="text-sm text-[#6b5c4d]">{t("quiz.loading")}</p>
          </div>
        )}

        {/* Quiz */}
        {quiz && !loading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#291c08]">{quiz.topic}</h3>
              <button
                onClick={() => { setQuiz(null); setSelectedTopic(null) }}
                className="flex items-center gap-1 text-xs text-[#8a7762] hover:text-[#291c08]"
              >
                <RefreshCw className="size-3" /> {t("quiz.new")}
              </button>
            </div>

            {quiz.questions.map((q, qi) => {
              const isRevealed = revealed[q.id]
              const selected = answers[q.id]
              const isCorrect = selected === q.correct

              return (
                <div key={q.id} className="rounded-xl border border-[#e2d9ce] bg-white p-5 space-y-3">
                  <p className="text-sm font-medium text-[#111827]">
                    <span className="text-[#8a7762] mr-2">{qi + 1}.</span>{q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = selected === oi
                      const isRight = oi === q.correct
                      return (
                        <button
                          key={oi}
                          onClick={() => answer(q.id, oi)}
                          disabled={isRevealed}
                          className={cn(
                            "w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors border",
                            !isRevealed && "border-[#e2d9ce] hover:border-[#291c08] hover:bg-[#faf7f4]",
                            isRevealed && isRight && "border-green-500 bg-green-50 text-green-800",
                            isRevealed && isSelected && !isRight && "border-red-400 bg-red-50 text-red-700",
                            isRevealed && !isSelected && !isRight && "border-[#e2d9ce] text-[#9ca3af]",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {isRevealed && isRight && <CheckCircle className="size-4 text-green-600 shrink-0" />}
                            {isRevealed && isSelected && !isRight && <XCircle className="size-4 text-red-500 shrink-0" />}
                            {opt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {isRevealed && (
                    <div className={cn("rounded-lg px-4 py-2.5 text-xs", isCorrect ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                      {isCorrect ? "✓ Correct ! " : "✗ Incorrect. "}{q.explanation}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Score final */}
            {finished ? (
              <div className="rounded-xl bg-[#291c08] px-6 py-5 text-center text-white space-y-2">
                <p className="text-4xl">{medal(score(), quiz.questions.length)}</p>
                <p className="text-2xl font-bold">{score()} / {quiz.questions.length}</p>
                <p className="text-sm opacity-80">
                  {score() === quiz.questions.length ? t("quiz.score.perfect") :
                   score() >= 3 ? t("quiz.score.good") :
                   t("quiz.score.retry")}
                </p>
                <button
                  onClick={() => void loadQuiz(selectedTopic ?? undefined)}
                  className="mt-2 flex items-center gap-1 mx-auto text-xs text-[#c4b49a] hover:text-white"
                >
                  <RefreshCw className="size-3" /> Nouveau quiz sur ce thème
                </button>
              </div>
            ) : allAnswered ? (
              <Button
                onClick={submitAll}
                className="w-full bg-[#291c08] text-white hover:bg-[#1d1406] flex items-center justify-center gap-2"
              >
                Voir le score <ChevronRight className="size-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
