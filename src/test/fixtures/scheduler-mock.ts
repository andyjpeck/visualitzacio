import { vi } from 'vitest'
import type { Scheduler } from '../../contracts/renderer-like'

export interface MockScheduler extends Scheduler {
  triggerFrame(timestamp: number): void
  pendingFramesCount(): number
}

export function createMockScheduler(initialTime = 0): MockScheduler {
  let currentTime = initialTime
  let handleSeq = 0
  const callbacks = new Map<number, (timestamp: number) => void>()

  return {
    now: vi.fn(() => currentTime),
    requestFrame: vi.fn((cb: (t: number) => void) => {
      const handle = ++handleSeq
      callbacks.set(handle, cb)
      return handle
    }),
    cancelFrame: vi.fn((handle: number) => {
      callbacks.delete(handle)
    }),
    triggerFrame: (timestamp: number) => {
      currentTime = timestamp
      const pending = Array.from(callbacks.entries())
      callbacks.clear()
      for (const [, cb] of pending) {
        cb(timestamp)
      }
    },
    pendingFramesCount: () => callbacks.size,
  }
}
