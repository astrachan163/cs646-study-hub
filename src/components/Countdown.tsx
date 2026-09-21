import { useNow } from '../app/useNow.ts'
import { countdownParts, formatDateTime } from '../lib/time.ts'

interface CountdownProps {
  label: string
  title: string
  at: string
  timeZone?: string
  href?: string
  facts?: string
}

export function Countdown({ label, title, at, timeZone, href, facts }: CountdownProps) {
  const now = useNow(1000)
  const target = Date.parse(at)
  const parts = countdownParts(target - now)
  const cells: [number, string][] = parts.days > 0
    ? [
        [parts.days, 'days'],
        [parts.hours, 'hours'],
        [parts.minutes, 'min'],
      ]
    : [
        [parts.hours, 'hours'],
        [parts.minutes, 'min'],
        [parts.seconds, 'sec'],
      ]
  return (
    <div className="card countdown">
      <div className="countdown__label">{label}</div>
      <div className="countdown__title">{href ? <a href={href}>{title}</a> : title}</div>
      {parts.past ? (
        <div className="muted">Started {formatDateTime(at, timeZone)}</div>
      ) : (
        <div className="countdown__digits" aria-live="off">
          {cells.map(([value, unit]) => (
            <div className="countdown__cell" key={unit}>
              <div className="countdown__num">{String(value).padStart(2, '0')}</div>
              <div className="countdown__unit">{unit}</div>
            </div>
          ))}
        </div>
      )}
      <div className="small muted">
        {formatDateTime(at, timeZone)}
        {facts ? ` · ${facts}` : ''}
      </div>
    </div>
  )
}
