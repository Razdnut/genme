'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * A hook that debounces state updates.
 *
 * @param {*} initialValue The initial value of the state.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {[*, Function]} A tuple containing the debounced state and a function to update it.
 */
export function useDebouncedState(initialValue, delay) {
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerRef = useRef(null)

  const cancelPendingUpdate = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => cancelPendingUpdate, [cancelPendingUpdate])

  const updateValue = useCallback((newValue, immediate = false) => {
    cancelPendingUpdate()

    if (immediate) {
      setDebouncedValue(newValue)
      return
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(newValue)
    }, delay)
  }, [cancelPendingUpdate, delay])

  return [debouncedValue, updateValue]
}
