import { useEffect, useMemo, useState } from 'react'
import { parseHash, type HashLocation } from '../lib/router.ts'

export interface AppLocation extends HashLocation {
  /** The raw hash, e.g. "#/unit/x/quiz?n=5" — useful as a React key to remount on navigation. */
  hash: string
}

function currentHash(): string {
  return window.location.hash || '#/'
}

export function useHashLocation(): AppLocation {
  const [hash, setHash] = useState<string>(currentHash)
  useEffect(() => {
    const onChange = () => setHash(currentHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return useMemo(() => ({ ...parseHash(hash), hash }), [hash])
}

/** Navigate to a hash. `replace` avoids adding a history entry (used when the quiz fills in its seed). */
export function navigate(hash: string, replace = false): void {
  if (replace) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}
