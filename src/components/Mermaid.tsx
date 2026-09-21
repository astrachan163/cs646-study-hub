import { useEffect, useId, useRef, useState } from 'react'
import type { Theme } from '../lib/storage.ts'

interface MermaidProps {
  chart: string
  theme: Theme
}

type RenderState = { status: 'loading' } | { status: 'ok'; svg: string } | { status: 'error'; message: string }

/**
 * Renders a Mermaid diagram from a ```mermaid fenced block. The mermaid library
 * (large) is imported lazily so pages without diagrams never download it. A
 * syntax error shows the source with a note instead of a blank space.
 */
export function Mermaid({ chart, theme }: MermaidProps) {
  const [state, setState] = useState<RenderState>({ status: 'loading' })
  const reactId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const renderId = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(Math.random() * 1e6)}`
    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'neutral',
          securityLevel: 'strict',
          fontFamily: 'inherit',
        })
        const { svg } = await mermaid.render(renderId, chart.trim())
        if (!cancelled) setState({ status: 'ok', svg })
      } catch (error) {
        // Mermaid may leave a dangling element behind after a failed render.
        document.getElementById(`d${renderId}`)?.remove()
        if (!cancelled) {
          setState({ status: 'error', message: error instanceof Error ? error.message : String(error) })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chart, theme, reactId])

  if (state.status === 'error') {
    return (
      <figure className="mermaid-figure mermaid-error">
        <div className="mermaid-error__note">This diagram could not be drawn (Mermaid error: {state.message.split('\n')[0]}). Showing its source instead.</div>
        <pre>
          <code>{chart}</code>
        </pre>
      </figure>
    )
  }

  return (
    <figure className="mermaid-figure" ref={containerRef} aria-busy={state.status === 'loading'}>
      {state.status === 'loading' ? (
        <div className="muted small">Drawing diagram…</div>
      ) : (
        // The SVG comes from the mermaid renderer with securityLevel "strict",
        // and the diagram source is part of this repository, not user input.
        <div dangerouslySetInnerHTML={{ __html: state.svg }} />
      )}
    </figure>
  )
}
