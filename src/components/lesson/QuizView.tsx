import { useMemo, useState } from 'react'
import type { LessonQuiz } from '../../lib/lessons'
import { renderInlineMarkdown, renderMarkdown } from '../../lib/markdown'
import { IconCheck } from '../icons'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface QuizViewProps {
  quiz: LessonQuiz
  done: boolean
  onPassed: () => void
}

/** Multiple-choice quiz runner (pass at ~90%, mirroring freeCodeCamp). */
export default function QuizView({ quiz, done, onPassed }: QuizViewProps) {
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const options = useMemo(
    () => quiz.questions.map((question) => shuffle([...question.distractors, question.answer])),
    // Reshuffle on every retake.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz, attempt],
  )

  const total = quiz.questions.length
  const answeredCount = Object.keys(answers).length
  const score = quiz.questions.reduce(
    (sum, question, index) => (submitted && answers[index] === question.answer ? sum + 1 : sum),
    0,
  )
  const passed = submitted && score >= quiz.passScore

  const submit = () => {
    const finalScore = quiz.questions.reduce(
      (sum, question, index) => (answers[index] === question.answer ? sum + 1 : sum),
      0,
    )
    setSubmitted(true)
    if (finalScore >= quiz.passScore) onPassed()
  }

  const retry = () => {
    setAnswers({})
    setSubmitted(false)
    setAttempt((n) => n + 1)
  }

  return (
    <div className="space-y-4">
      {(submitted || done) && (
        <div
          className={
            'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ' +
            (passed || done
              ? 'border-mint-400/30 bg-mint-400/10 text-mint-300'
              : 'border-rose-400/30 bg-rose-400/10 text-rose-200')
          }
        >
          <span>
            {submitted ? (
              <>
                You scored <strong>{score}</strong>/{total} —{' '}
                {passed ? 'passed!' : `you need ${quiz.passScore} correct to pass.`}
              </>
            ) : (
              <>You already passed this quiz.</>
            )}
          </span>
          <button type="button" onClick={retry} className="btn btn-secondary btn-sm ml-auto">
            Retake
          </button>
        </div>
      )}

      {quiz.questions.map((question, qIndex) => (
        <div key={qIndex} className="card p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-slate-300">
              {qIndex + 1}
            </span>
            <div
              className="lesson-content min-w-0 flex-1"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(question.text) }}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {options[qIndex].map((option, oIndex) => {
              const selected = answers[qIndex] === option
              const isAnswer = submitted && option === question.answer
              const wrongPick = submitted && selected && option !== question.answer
              return (
                <button
                  key={oIndex + ':' + option}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((prev) => ({ ...prev, [qIndex]: option }))}
                  className={
                    'rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ' +
                    (isAnswer
                      ? 'border-mint-400/50 bg-mint-400/10 text-mint-200'
                      : wrongPick
                        ? 'border-rose-400/50 bg-rose-400/10 text-rose-200'
                        : selected
                          ? 'border-brand-400/60 bg-brand-400/10 text-slate-100'
                          : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25')
                  }
                >
                  <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(option) }} />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {answeredCount}/{total} answered · {quiz.passScore} correct needed to pass
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={answeredCount < total}
            className="btn btn-primary"
          >
            <IconCheck size={15} />
            Submit answers
          </button>
        </div>
      )}
    </div>
  )
}
