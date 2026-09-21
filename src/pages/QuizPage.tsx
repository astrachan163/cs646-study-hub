import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { navigate } from '../app/useHashLocation.ts'
import { ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadLikelyQuiz, loadQuestions } from '../content/repository.ts'
import type { Question, UnitIndex } from '../content/types.ts'
import { defaultQuizConfig, parseQuizConfig, serializeQuizConfig, type QuizConfig } from '../lib/quizConfig.ts'
import { randomSeedString, rngFromSeed } from '../lib/random.ts'
import { scoreAttempt, type AnswerRecord, type Response } from '../lib/score.ts'
import { selectQuiz } from '../lib/select.ts'
import { saveAttempt } from '../lib/storage.ts'
import { QuizResults } from './quiz/QuizResults.tsx'
import { QuizRunner } from './quiz/QuizRunner.tsx'
import { QuizSetup } from './quiz/QuizSetup.tsx'

interface QuizPageProps {
  unit: UnitIndex
  path: string
  params: URLSearchParams
}

type Phase =
  | { kind: 'setup' }
  | { kind: 'running'; startedAt: number }
  | { kind: 'finished'; seconds: number; autoSubmitted: boolean; attemptId: string }

export function QuizPage({ unit, path, params }: QuizPageProps) {
  useDocumentTitle('Practice Quiz')
  const unitId = unit.meta.id
  const defaults = useMemo(() => defaultQuizConfig(unit.meta, randomSeedString()), [unit.meta])
  const [config, setConfig] = useState<QuizConfig>(() => parseQuizConfig(params, defaults))
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' })
  const [selected, setSelected] = useState<Question[]>([])
  const [records, setRecords] = useState<Map<string, AnswerRecord>>(() => new Map())
  const lastPushed = useRef<string>(serializeQuizConfig(config, defaults).toString())

  const data = useAsync(
    async () => {
      const [questions, likelyIds] = await Promise.all([
        loadQuestions(unitId),
        unit.hasLikelyQuiz ? loadLikelyQuiz(unitId) : Promise.resolve([] as string[]),
      ])
      return { questions, likelyIds }
    },
    [unitId],
  )

  // Navigation from outside (a share link, "retry missed" from history) resets to setup with the new config.
  // URLs this page pushed itself are recognised by comparing the canonical serialisation.
  useEffect(() => {
    const incoming = parseQuizConfig(params, defaults)
    const incomingKey = serializeQuizConfig(incoming, defaults).toString()
    if (incomingKey === lastPushed.current) return
    lastPushed.current = incomingKey
    setConfig(incoming)
    setPhase({ kind: 'setup' })
    setRecords(new Map())
  }, [params, defaults])

  const pushUrl = useCallback(
    (next: QuizConfig) => {
      const serialized = serializeQuizConfig(next, defaults)
      lastPushed.current = serialized.toString()
      navigate(routes.quiz(unitId, serialized), true)
    },
    [defaults, unitId],
  )

  const start = useCallback(
    (next: QuizConfig) => {
      if (!data.data) return
      const selection = selectQuiz(
        data.data.questions,
        {
          n: next.ids.length > 0 ? Math.min(next.n, next.ids.length) : next.n,
          filters: { chapters: next.chapters, coverage: next.coverage, difficulty: next.difficulty, likelihood: next.likelihood, ids: next.ids },
          orderedIds: next.set === 'likely' ? data.data.likelyIds : undefined,
        },
        rngFromSeed(next.seed),
      )
      setConfig(next)
      setSelected(selection.questions)
      setRecords(new Map())
      setPhase({ kind: 'running', startedAt: Date.now() })
      pushUrl(next)
      window.scrollTo({ top: 0 })
    },
    [data.data, pushUrl],
  )

  const respond = useCallback((questionId: string, response: Response) => {
    setRecords((prev) => {
      const next = new Map(prev)
      const existing = prev.get(questionId)
      next.set(questionId, { questionId, response, selfCorrect: existing?.selfCorrect ?? null })
      return next
    })
  }, [])

  const selfGrade = useCallback((questionId: string, correct: boolean) => {
    setRecords((prev) => {
      const next = new Map(prev)
      const existing = prev.get(questionId)
      next.set(questionId, { questionId, response: existing?.response ?? '', selfCorrect: correct })
      return next
    })
  }, [])

  const pointsTotal = unit.meta.assessment.points
  const score = useMemo(() => scoreAttempt(selected, records, pointsTotal), [selected, records, pointsTotal])

  const finish = useCallback(
    (auto: boolean) => {
      setPhase((current) => {
        if (current.kind !== 'running') return current
        const seconds = Math.max(0, Math.round((Date.now() - current.startedAt) / 1000))
        const attemptId = `${Date.now().toString(36)}-${config.seed}`
        return { kind: 'finished', seconds, autoSubmitted: auto, attemptId }
      })
    },
    [config.seed],
  )

  // Persist the attempt once finished, and again whenever a self-grade changes the score.
  const savedFor = useRef<string>('')
  useEffect(() => {
    if (phase.kind !== 'finished') return
    const key = `${phase.attemptId}:${score.correct}:${score.pending}`
    if (savedFor.current === key) return
    savedFor.current = key
    saveAttempt({
      id: phase.attemptId,
      unitId,
      finishedAt: new Date().toISOString(),
      correct: score.correct,
      total: score.total,
      percent: score.percent,
      points: score.points,
      pointsTotal: score.pointsTotal,
      seconds: phase.seconds,
      config: serializeQuizConfig(config, defaults).toString(),
      missedIds: score.missedIds,
      mode: config.feedback,
    })
  }, [phase, score, config, defaults, unitId])

  const shareUrl = `${window.location.origin}${window.location.pathname}${routes.quiz(unitId, serializeQuizConfig(config, defaults))}`

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span> <span>Practice Quiz</span>
      </div>
      <h1 className="page-title">Practice Quiz</h1>
      {phase.kind === 'setup' && (
        <p className="page-lead">
          Built like the real one: {unit.meta.assessment.questions} questions, {unit.meta.assessment.minutes} minutes, one question per screen. Questions the instructor is likely to ask are picked more often.
        </p>
      )}
      {phase.kind === 'setup' && <UnitNav unit={unit} currentPath={path} />}

      {data.status === 'loading' && <Loading what="questions" />}
      {data.status === 'error' && <ErrorBox error={data.error} />}
      {data.status === 'ready' && phase.kind === 'setup' && (
        <QuizSetup unit={unit} questions={data.data.questions} likelyIds={data.data.likelyIds} config={config} defaults={defaults} onChange={setConfig} onStart={() => start(config)} />
      )}
      {data.status === 'ready' && phase.kind === 'running' && (
        <QuizRunner
          questions={selected}
          config={config}
          records={records}
          startedAt={phase.startedAt}
          onRespond={respond}
          onSelfGrade={selfGrade}
          onFinish={finish}
          onAbandon={() => {
            if (window.confirm('Quit this quiz? Your answers so far will be discarded.')) setPhase({ kind: 'setup' })
          }}
        />
      )}
      {data.status === 'ready' && phase.kind === 'finished' && (
        <QuizResults
          questions={selected}
          config={config}
          records={records}
          score={score}
          seconds={phase.seconds}
          autoSubmitted={phase.autoSubmitted}
          shareUrl={shareUrl}
          onSelfGrade={selfGrade}
          onRetryMissed={() =>
            start({ ...config, set: 'random', ids: score.missedIds, n: score.missedIds.length, seed: randomSeedString() })
          }
          onRetake={() => start(config)}
          onNewQuiz={() => {
            setConfig({ ...config, ids: [], n: config.ids.length > 0 ? defaults.n : config.n, seed: randomSeedString() })
            setPhase({ kind: 'setup' })
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </>
  )
}
