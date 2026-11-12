import { useEffect, useState } from 'react'

/** Local editable copy of a part's data; filled once when the record arrives, never overwritten while editing. */
export function usePartDraft<T>(source: T | undefined) {
  const [draft, setDraft] = useState<T | undefined>(source)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!touched && source !== undefined) setDraft(source)
  }, [source, touched])
  const update = (patch: Partial<T> | ((d: T) => Partial<T>)) => {
    setTouched(true)
    setDraft((d) => (d === undefined ? d : { ...d, ...(typeof patch === 'function' ? patch(d) : patch) }))
  }
  return [draft, update] as const
}
