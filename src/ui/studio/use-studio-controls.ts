import { useCallback, useEffect, useRef, useState } from 'react'
import { type StudioMode, useAppStore } from '../store/app-store'

export const INACTIVITY_TIMEOUT_MS = 3000

export interface UseStudioControlsOptions {
  inactivityTimeoutMs?: number
  enableKeyboardShortcuts?: boolean
}

export interface UseStudioControlsReturn {
  studioMode: StudioMode
  isHudVisible: boolean
  isLive: boolean
  toggleStudioMode: () => void
  setStudioMode: (mode: StudioMode) => void
}

/**
 * Hook managing Studio vs. Live Performance Mode state,
 * 3-second mouse inactivity HUD auto-hide, and keyboard shortcuts (F11 / Esc).
 */
export function useStudioControls({
  inactivityTimeoutMs = INACTIVITY_TIMEOUT_MS,
  enableKeyboardShortcuts = true,
}: UseStudioControlsOptions = {}): UseStudioControlsReturn {
  const studioMode = useAppStore((state) => state.studioMode)
  const toggleStudioModeStore = useAppStore((state) => state.toggleStudioMode)
  const setStudioModeStore = useAppStore((state) => state.setStudioMode)

  const isLive = studioMode === 'live'
  const [isIdle, setIsIdle] = useState<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetInactivityTimer = useCallback(() => {
    clearTimer()
    setIsIdle(false)

    if (isLive) {
      timerRef.current = setTimeout(() => {
        setIsIdle(true)
      }, inactivityTimeoutMs)
    }
  }, [clearTimer, isLive, inactivityTimeoutMs])

  // Setup inactivity timer when live mode changes
  useEffect(() => {
    if (isLive) {
      timerRef.current = setTimeout(() => {
        setIsIdle(true)
      }, inactivityTimeoutMs)
    }

    return () => {
      clearTimer()
    }
  }, [isLive, inactivityTimeoutMs, clearTimer])

  // Track user activity (mouse/pointer motion, touch, keypress) in live mode
  useEffect(() => {
    if (!isLive) return

    const handleActivity = () => {
      resetInactivityTimer()
    }

    window.addEventListener('pointermove', handleActivity, { passive: true })
    window.addEventListener('pointerdown', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handleActivity)
      window.removeEventListener('pointerdown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [isLive, resetInactivityTimer])

  // Global keyboard shortcuts (F11 to toggle mode, Esc to exit live mode)
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on F11
      if (e.key === 'F11') {
        e.preventDefault()
        toggleStudioModeStore()
        return
      }

      // Exit live mode on Esc (if no modal is open)
      if (e.key === 'Escape' && isLive) {
        const dialogStack = useAppStore.getState().dialogStack
        if (dialogStack.length === 0) {
          e.preventDefault()
          setStudioModeStore('editor')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enableKeyboardShortcuts, isLive, toggleStudioModeStore, setStudioModeStore])

  const isHudVisible = !isLive || !isIdle

  return {
    studioMode,
    isHudVisible,
    isLive,
    toggleStudioMode: toggleStudioModeStore,
    setStudioMode: setStudioModeStore,
  }
}
