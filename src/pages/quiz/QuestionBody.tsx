import type { Question } from '../../content/types.ts'
import { CHOICE_KEYS } from '../../lib/answers.ts'
import type { AnswerRecord, Response } from '../../lib/score.ts'

interface QuestionBodyProps {
  question: Question
  record: AnswerRecord | undefined
  /** When true the correct answer is highlighted and inputs are locked. */
  revealed: boolean
  onRespond: (response: Response) => void
  onSelfGrade?: (correct: boolean) => void
}

export function QuestionBody({ question, record, revealed, onRespond, onSelfGrade }: QuestionBodyProps) {
  switch (question.type) {
    case 'mcq':
      return (
        <div className="choices" role="group" aria-label="Answer choices">
          {question.choices.map((choice, i) => {
            const selected = record?.response === i
            const isAnswer = question.answer === i
            const className = [
              'choice',
              selected && !revealed ? 'is-selected' : '',
              revealed && isAnswer ? 'is-correct' : '',
              revealed && selected && !isAnswer ? 'is-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button type="button" key={i} className={className} disabled={revealed} onClick={() => onRespond(i)} aria-pressed={selected}>
                <span className="choice__key" aria-hidden="true">
                  {CHOICE_KEYS[i] ?? i + 1}
                </span>
                <span>{choice}</span>
              </button>
            )
          })}
        </div>
      )
    case 'tf':
      return (
        <div className="tf-row" role="group" aria-label="True or false">
          {[true, false].map((value) => {
            const selected = record?.response === value
            const isAnswer = question.answer === value
            const className = [
              'choice',
              selected && !revealed ? 'is-selected' : '',
              revealed && isAnswer ? 'is-correct' : '',
              revealed && selected && !isAnswer ? 'is-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button type="button" key={String(value)} className={className} disabled={revealed} onClick={() => onRespond(value)} aria-pressed={selected}>
                <span className="choice__key" aria-hidden="true">
                  {value ? 'T' : 'F'}
                </span>
                <span>{value ? 'True' : 'False'}</span>
              </button>
            )
          })}
        </div>
      )
    case 'short': {
      const typed = typeof record?.response === 'string' ? record.response : ''
      return (
        <div className="stack">
          <textarea
            className="textarea"
            placeholder="Type your answer in your own words…"
            value={typed}
            disabled={revealed}
            onChange={(e) => onRespond(e.target.value)}
            aria-label="Your answer"
          />
          {revealed && (
            <div className="feedback">
              <div className="feedback__title">Model answer</div>
              <div>{question.answer}</div>
              {onSelfGrade && record?.selfCorrect === null && (
                <div className="self-grade">
                  <span className="small muted" style={{ alignSelf: 'center' }}>
                    Did you get it?
                  </span>
                  <button type="button" className="btn btn--sm btn--primary" onClick={() => onSelfGrade(true)}>
                    ✓ Yes, mark correct
                  </button>
                  <button type="button" className="btn btn--sm btn--danger" onClick={() => onSelfGrade(false)}>
                    ✗ No, mark missed
                  </button>
                </div>
              )}
              {record && record.selfCorrect !== null && (
                <div className="small muted" style={{ marginTop: '0.5rem' }}>
                  You marked this {record.selfCorrect ? 'correct' : 'missed'}.
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
    default: {
      const exhaustive: never = question
      return exhaustive
    }
  }
}
