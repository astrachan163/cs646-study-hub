import { useEffect, useRef, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: Error }

const LOADING: AsyncState<never> = { status: 'loading', data: null, error: null }

interface Settled<T> {
  key: string
  state: AsyncState<T>
}

/**
 * Runs an async loader whenever `deps` (primitives) change and tracks
 * loading / ready / error. Results for an outdated key are ignored, so
 * navigating quickly between chapters never shows stale content.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: readonly (string | number | boolean | null | undefined)[]): AsyncState<T> {
  const key = JSON.stringify(deps)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let cancelled = false
    loaderRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ key, state: { status: 'ready', data, error: null } })
      },
      (error: unknown) => {
        if (!cancelled) {
          setSettled({
            key,
            state: { status: 'error', data: null, error: error instanceof Error ? error : new Error(String(error)) },
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [key])

  return settled && settled.key === key ? settled.state : LOADING
}
