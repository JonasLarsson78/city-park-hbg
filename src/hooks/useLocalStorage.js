import { useState } from 'react'

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = (next) => {
    const resolved = typeof next === 'function' ? next(value) : next
    setValue(resolved)
    try {
      localStorage.setItem(key, JSON.stringify(resolved))
    } catch {}
  }

  return [value, set]
}
