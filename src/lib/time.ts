/** Seconds → "m:ss" (or "h:mm:ss" past an hour). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  past: boolean
}

export function countdownParts(msRemaining: number): Countdown {
  const past = msRemaining <= 0
  const total = Math.floor(Math.abs(msRemaining) / 1000)
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    past,
  }
}

export function formatCountdown(msRemaining: number): string {
  const c = countdownParts(msRemaining)
  if (c.past) return 'started'
  if (c.days > 0) return `${c.days}d ${c.hours}h ${c.minutes}m`
  if (c.hours > 0) return `${c.hours}h ${c.minutes}m ${c.seconds}s`
  return `${c.minutes}m ${c.seconds}s`
}

export function formatDateTime(iso: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}

export function formatDate(iso: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}
