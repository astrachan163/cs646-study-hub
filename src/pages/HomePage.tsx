import { routes } from '../app/routes.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { useNow } from '../app/useNow.ts'
import { Countdown } from '../components/Countdown.tsx'
import { listCourses, listUnits } from '../content/repository.ts'
import type { Course, UnitIndex } from '../content/types.ts'
import { bestAttempt, loadAttempts } from '../lib/storage.ts'
import { formatDateTime } from '../lib/time.ts'

interface Upcoming {
  title: string
  at: string
  href?: string
  facts?: string
}

function nextAssessment(courses: Course[], units: UnitIndex[], now: number): Upcoming | null {
  const candidates: Upcoming[] = []
  for (const unit of units) {
    const a = unit.meta.assessment
    candidates.push({
      title: unit.meta.title,
      at: a.opens,
      href: routes.unit(unit.meta.id),
      facts: `${a.questions} questions · ${a.points} points · ${a.minutes} min`,
    })
  }
  for (const course of courses) {
    for (const item of course.schedule) {
      if (item.at === null) continue
      if (item.unit && units.some((u) => u.meta.id === item.unit)) continue
      candidates.push({
        title: item.title,
        at: item.at,
        facts: item.points !== null ? `${item.points} points` : undefined,
      })
    }
  }
  const future = candidates.filter((c) => Date.parse(c.at) > now).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  return future[0] ?? null
}

function UnitCard({ unit, timeZone }: { unit: UnitIndex; timeZone?: string }) {
  const a = unit.meta.assessment
  const attempts = loadAttempts(unit.meta.id)
  const best = bestAttempt(attempts)
  return (
    <article className="card unit-card">
      <div>
        <h2 style={{ marginBottom: '0.2rem' }}>
          <a href={routes.unit(unit.meta.id)}>{unit.meta.title}</a>
        </h2>
        <div className="unit-card__facts">
          <span>{a.type}</span>
          <span>{a.questions} questions</span>
          <span>{a.points} points</span>
          <span>{a.minutes} minutes</span>
          <span>{formatDateTime(a.opens, timeZone)}</span>
        </div>
      </div>
      <div className="progress-line">
        <span>{unit.chapters.length} chapters</span>
        {attempts.length > 0 && best ? (
          <span>
            best practice score <strong>{best.percent}%</strong> · {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
          </span>
        ) : (
          <span>no practice attempts yet</span>
        )}
      </div>
      <div className="row">
        <a className="btn btn--primary" href={routes.quiz(unit.meta.id)}>
          Practice quiz
        </a>
        <a className="btn" href={routes.study(unit.meta.id)}>
          Study guide
        </a>
        <a className="btn" href={routes.flashcards(unit.meta.id)}>
          Flashcards
        </a>
        <a className="btn" href={routes.likely(unit.meta.id)}>
          Likely quiz
        </a>
      </div>
    </article>
  )
}

export function HomePage() {
  useDocumentTitle('')
  const now = useNow(30_000)
  const courses = listCourses()
  const units = listUnits()
  const course = courses[0]
  const upcoming = nextAssessment(courses, units, now)

  return (
    <>
      <section className="hero">
        <div>
          <h1 className="hero__title">{course ? `${course.code} · ${course.name}` : 'CS 646 Study Hub'}</h1>
          <p className="page-lead" style={{ marginBottom: 0 }}>
            Study guides, a searchable lexicon, flashcards and realistic practice quizzes for every quiz and test in the
            course. Everything runs in your browser; your progress stays on this device.
          </p>
          {course && (
            <div className="hero__facts">
              <span>{course.institution}</span>
              <span>{course.term}</span>
              <span>{course.instructor}</span>
              <span>{course.meeting}</span>
            </div>
          )}
        </div>
        {upcoming ? (
          <Countdown label="Next up" title={upcoming.title} at={upcoming.at} timeZone={course?.timezone} href={upcoming.href} facts={upcoming.facts} />
        ) : (
          <div className="card countdown">
            <div className="countdown__label">Schedule</div>
            <div className="countdown__title">No upcoming assessments on the calendar</div>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Study units</h2>
          <span className="muted small">{units.length} available</span>
        </div>
        <div className="stack">
          {units.map((unit) => (
            <UnitCard key={unit.meta.id} unit={unit} timeZone={course?.timezone} />
          ))}
          {units.length === 0 && <div className="card empty">No units yet. Add a folder under content/units/ (see CONTENT-GUIDE.md).</div>}
        </div>
      </section>

      {course && course.schedule.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Course calendar</h2>
            <span className="muted small">all times {course.timezone.replace('_', ' ')}</span>
          </div>
          <div className="card card--tight">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Assessment</th>
                  <th>Type</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {[...course.schedule]
                  // Dated items in order; undated ("to be announced") items last.
                  .sort((a, b) => (a.at === null ? Infinity : Date.parse(a.at)) - (b.at === null ? Infinity : Date.parse(b.at)))
                  .map((item) => {
                    const past = item.at !== null && Date.parse(item.at) < now
                    return (
                      <tr key={`${item.title}-${item.at ?? 'tba'}`} style={past ? { opacity: 0.55 } : undefined}>
                        <td>{item.at === null ? <span className="muted">date to be announced</span> : formatDateTime(item.at, course.timezone)}</td>
                        <td>{item.unit ? <a href={routes.unit(item.unit)}>{item.title}</a> : item.title}</td>
                        <td>{item.type}</td>
                        <td>{item.points ?? '—'}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
            {course.notes && course.notes.length > 0 && (
              <ul className="small muted" style={{ marginTop: '0.8rem' }}>
                {course.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {course && course.textbooks.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Textbooks</h2>
          </div>
          <ul>
            {course.textbooks.map((book) => (
              <li key={book.title}>
                {book.url ? (
                  <a href={book.url} target="_blank" rel="noreferrer">
                    {book.title}
                  </a>
                ) : (
                  book.title
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
