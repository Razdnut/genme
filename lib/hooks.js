'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A hook that debounces state updates.
 *
 * @param {*} initialValue The initial value of the state.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {[*, Function]} A tuple containing the debounced state and a function to update it.
 */
export function useDebouncedState(initialValue, delay) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerRef = useRef(null)

  useEffect(() => {
    // Clean up the timer when the component unmounts
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [])

  const updateValue = useCallback((newValue, immediate = false) => {
    setValue(newValue)
    if (immediate) {
      clearTimeout(timerRef.current)
      setDebouncedValue(newValue)
    } else {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setDebouncedValue(newValue)
      }, delay)
    }
  }, [delay])

  return [debouncedValue, updateValue]
}
