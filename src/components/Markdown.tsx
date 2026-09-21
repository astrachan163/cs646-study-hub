import { isValidElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { slugify } from '../lib/markdown.ts'
import type { Theme } from '../lib/storage.ts'
import { Mermaid } from './Mermaid.tsx'

interface MarkdownProps {
  source: string
  theme: Theme
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

function makeComponents(theme: Theme): Components {
  return {
    // Fenced ```mermaid blocks arrive as <pre><code class="language-mermaid">.
    pre: ({ children, node: _node, ...rest }) => {
      if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
        const className = children.props.className ?? ''
        if (className.includes('language-mermaid')) {
          return <Mermaid chart={textOf(children.props.children)} theme={theme} />
        }
      }
      return <pre {...rest}>{children}</pre>
    },
    h1: ({ children, node: _node, ...rest }) => (
      <h1 id={slugify(textOf(children))} {...rest}>
        {children}
      </h1>
    ),
    h2: ({ children, node: _node, ...rest }) => (
      <h2 id={slugify(textOf(children))} {...rest}>
        {children}
      </h2>
    ),
    h3: ({ children, node: _node, ...rest }) => (
      <h3 id={slugify(textOf(children))} {...rest}>
        {children}
      </h3>
    ),
    a: ({ children, href, node: _node, ...rest }) => {
      const external = typeof href === 'string' && /^https?:\/\//.test(href)
      return (
        <a href={href} {...rest} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
          {children}
        </a>
      )
    },
  }
}

export function Markdown({ source, theme }: MarkdownProps) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(theme)}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
