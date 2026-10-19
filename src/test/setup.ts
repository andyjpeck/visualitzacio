import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Automatically clean up React DOM after each test
afterEach(() => {
  cleanup()
})

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock AudioContext for jsdom
import { createMockAudioContext } from './fixtures/audio-context-mock'
globalThis.AudioContext = vi.fn().mockImplementation(() => createMockAudioContext().audioContext) as unknown as typeof AudioContext

// Polyfill PointerEvent for jsdom
if (typeof globalThis.PointerEvent === 'undefined') {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
    }
  } as unknown as typeof PointerEvent
}

