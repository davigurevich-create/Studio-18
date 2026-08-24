import { useRef } from 'react'
import type { TouchEvent } from 'react'

const SWIPE_THRESHOLD_PX = 40

/** Horizontal swipe-to-navigate: swiping left calls onNext, right calls onPrev. */
export function useSwipeNav(onNext: () => void, onPrev: () => void) {
  const startX = useRef<number | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (startX.current === null) return
    const delta = e.changedTouches[0].clientX - startX.current
    startX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
    if (delta < 0) onNext()
    else onPrev()
  }

  return { onTouchStart, onTouchEnd }
}
