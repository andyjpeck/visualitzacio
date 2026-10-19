import { describe, expect, it } from 'vitest'
import { createDefaultFrameContext } from './frame-context'
import { DEFAULT_PRESET_SETTINGS } from './preset-settings'

describe('Shared Contracts & Fixtures', () => {
  it('creates a default FrameContext with standard dimensions and zeroed audio signals', () => {
    const ctx = createDefaultFrameContext()
    expect(ctx.$TIME).toBe(0.0)
    expect(ctx.$FRAME).toBe(0)
    expect(ctx.$FPS).toBe(60.0)
    expect(ctx.$BASS).toBe(0.0)
    expect(ctx.$BEAT).toBe(0.0)
    expect(ctx.$BPM).toBe(120.0)
    expect(ctx.secondsSinceLastBeat).toBe(999.0)
    expect(ctx.framesSinceLastBeat).toBe(9999)
  })

  it('provides default preset settings with target_fps 60 and resolution_scale 1.0', () => {
    expect(DEFAULT_PRESET_SETTINGS.target_fps).toBe(60)
    expect(DEFAULT_PRESET_SETTINGS.resolution_scale).toBe(1.0)
  })
})
