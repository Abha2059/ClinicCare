import { useEffect } from 'react'
import { BRAND } from '../utils/constants'

/** Sets the document title, restoring the previous one on unmount. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} | ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`
    return () => {
      document.title = previous
    }
  }, [title])
}
