import type { ReactNode } from 'react'

export function Loading({ what = 'content' }: { what?: string }) {
  return (
    <div className="empty" role="status">
      Loading {what}…
    </div>
  )
}

export function ErrorBox({ error, children }: { error: Error; children?: ReactNode }) {
  return (
    <div className="alert alert--danger" role="alert">
      <strong>Something went wrong.</strong> {error.message}
      {children}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
