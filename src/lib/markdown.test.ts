import { describe, expect, it } from 'vitest'
import { extractHeadings, slugify, stripFrontmatter, titleFromMarkdown } from './markdown.ts'

describe('markdown helpers', () => {
  it('strips a leading YAML front-matter block and nothing else', () => {
    const source = '---\ncursor:\n  subagentId: "abc"\n---\n\n# Chapter 1\n\nText with --- inside.\n'
    expect(stripFrontmatter(source)).toBe('# Chapter 1\n\nText with --- inside.\n')
    expect(stripFrontmatter('# No front matter\n---\n')).toBe('# No front matter\n---\n')
    expect(stripFrontmatter('')).toBe('')
  })
  it('slugifies heading text', () => {
    expect(slugify('Keys & Addresses: the one-way chain')).toBe('keys-addresses-the-one-way-chain')
  })
  it('extracts h2/h3 headings but ignores headings inside code fences', () => {
    const source = '# Title\n\n## First\n\n```mermaid\n## not a heading\n```\n\n### Sub *emph*\n'
    expect(extractHeadings(source)).toEqual([
      { level: 2, text: 'First', id: 'first' },
      { level: 3, text: 'Sub emph', id: 'sub-emph' },
    ])
  })
  it('reads the document title with a fallback', () => {
    expect(titleFromMarkdown('intro\n# Chapter 2 — How Bitcoin Works\n', 'x')).toBe('Chapter 2 — How Bitcoin Works')
    expect(titleFromMarkdown('no title here', 'Chapter 9')).toBe('Chapter 9')
  })
})
