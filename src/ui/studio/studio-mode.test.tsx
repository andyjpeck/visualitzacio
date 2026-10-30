import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStudioControls } from './use-studio-controls'
import { useAppStore } from '../store/app-store'

describe('useStudioControls (Studio vs. Live Performance Mode)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAppStore.setState({
      studioMode: 'editor',
      dialogStack: [],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with editor mode and visible HUD', () => {
    const { result } = renderHook(() => useStudioControls())

    expect(result.current.studioMode).toBe('editor')
    expect(result.current.isLive).toBe(false)
    expect(result.current.isHudVisible).toBe(true)
  })

  it('keeps HUD visible indefinitely in editor mode', () => {
    const { result } = renderHook(() => useStudioControls())

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.isHudVisible).toBe(true)
  })

  it('auto-hides HUD after 3 seconds of inactivity in live mode', () => {
    useAppStore.setState({ studioMode: 'live' })
    const { result } = renderHook(() => useStudioControls())

    expect(result.current.isLive).toBe(true)
    expect(result.current.isHudVisible).toBe(true)

    // Advance 2.9 seconds - should still be visible
    act(() => {
      vi.advanceTimersByTime(2900)
    })
    expect(result.current.isHudVisible).toBe(true)

    // Advance past 3.0 seconds - should auto-hide
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.isHudVisible).toBe(false)
  })

  it('resets inactivity timer and restores HUD on user pointer motion', () => {
    useAppStore.setState({ studioMode: 'live' })
    const { result } = renderHook(() => useStudioControls())

    // Advance past 3 seconds to hide HUD
    act(() => {
      vi.advanceTimersByTime(3100)
    })
    expect(result.current.isHudVisible).toBe(false)

    // User moves pointer
    act(() => {
      window.dispatchEvent(new Event('pointermove'))
    })

    // HUD instantly reappears
    expect(result.current.isHudVisible).toBe(true)

    // Wait another 2 seconds - still visible
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.isHudVisible).toBe(true)

    // Past 3 seconds again - hides
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(result.current.isHudVisible).toBe(false)
  })

  it('restores HUD immediately and clears timer when switching back to editor mode', () => {
    useAppStore.setState({ studioMode: 'live' })
    const { result } = renderHook(() => useStudioControls())

    act(() => {
      vi.advanceTimersByTime(3100)
    })
    expect(result.current.isHudVisible).toBe(false)

    // Switch back to editor mode
    act(() => {
      result.current.setStudioMode('editor')
    })

    expect(result.current.isLive).toBe(false)
    expect(result.current.isHudVisible).toBe(true)

    // Advance time - remains visible
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.isHudVisible).toBe(true)
  })

  it('toggles mode when F11 key is pressed', () => {
    renderHook(() => useStudioControls())

    expect(useAppStore.getState().studioMode).toBe('editor')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }))
    })

    expect(useAppStore.getState().studioMode).toBe('live')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }))
    })

    expect(useAppStore.getState().studioMode).toBe('editor')
  })

  it('exits live mode when Escape is pressed and dialog stack is empty', () => {
    useAppStore.setState({ studioMode: 'live', dialogStack: [] })
    renderHook(() => useStudioControls())

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(useAppStore.getState().studioMode).toBe('editor')
  })

  it('does NOT exit live mode when Escape is pressed if a dialog is open', () => {
    useAppStore.setState({ studioMode: 'live', dialogStack: ['preset-settings'] })
    renderHook(() => useStudioControls())

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(useAppStore.getState().studioMode).toBe('live')
  })
})
