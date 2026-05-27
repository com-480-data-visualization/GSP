import { useState, useEffect } from 'react'

interface WindowSize {
  width: number
  height: number
}

/**
 * Returns the current browser window dimensions and re-renders the consumer
 * whenever the window is resized.
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width:  window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}
