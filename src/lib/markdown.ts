/**
 * Removes a leading YAML front-matter block (`---` ... `---`). Authoring tools
 * often add one for metadata; it should never appear on the page.
 */
export function stripFrontmatter(source: string): string {
  const match = /^\uFEFF?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(source)
  return match ? source.slice(match[0].length).replace(/^\s*\n/, '') : source
}

/** Turn a heading's text into a stable id so the table of contents can link to it. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export interface Heading {
  level: number
  text: string
  id: string
}

/** Extracts ## and ### headings for a table of contents (ignores headings inside code fences). */
export function extractHeadings(source: string): Heading[] {
  const headings: Heading[] = []
  let inFence = false
  for (const line of source.split('\n')) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (match?.[1] && match[2]) {
      const text = match[2].replace(/[*_`]/g, '')
      headings.push({ level: match[1].length, text, id: slugify(text) })
    }
  }
  return headings
}

/** The first `# Title` line of a Markdown document, or a fallback. */
export function titleFromMarkdown(source: string, fallback: string): string {
  const match = /^#\s+(.+)$/m.exec(source)
  return match?.[1]?.trim() ?? fallback
}
