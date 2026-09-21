/**
 * Minimal hash router helpers. Hash URLs (`/#/unit/x/quiz?n=5`) work on GitHub
 * Pages because the server only ever sees `/` and never has to know the route.
 */

export interface HashLocation {
  path: string
  params: URLSearchParams
}

export function parseHash(hash: string): HashLocation {
  let raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw.startsWith('/')) raw = `/${raw}`
  const queryIndex = raw.indexOf('?')
  const path = queryIndex === -1 ? raw : raw.slice(0, queryIndex)
  const query = queryIndex === -1 ? '' : raw.slice(queryIndex + 1)
  const normalised = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
  return { path: normalised, params: new URLSearchParams(query) }
}

/** Match `/unit/:unitId/study/:chapter` against a path; returns decoded params or null. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter((p) => p.length > 0)
  const pathParts = path.split('/').filter((p) => p.length > 0)
  if (patternParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i] as string
    const v = pathParts[i] as string
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(v)
    } else if (p !== v) {
      return null
    }
  }
  return params
}

export function buildHash(path: string, params?: URLSearchParams | Record<string, string>): string {
  const search =
    params instanceof URLSearchParams ? params.toString() : params ? new URLSearchParams(params).toString() : ''
  return `#${path}${search ? `?${search}` : ''}`
}
