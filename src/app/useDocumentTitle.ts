import { useEffect } from 'react'

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · CS 646 Study Hub` : 'CS 646 Study Hub'
    return () => {
      document.title = previous
    }
  }, [title])
}
