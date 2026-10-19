import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultFrameContext, type FrameContext } from '../../contracts/frame-context'
import { ExpressionEngine } from './expression-engine'

describe('System Functions Library (#FUNCTION) (TDD)', () => {
  let engine: ExpressionEngine
  let context: FrameContext

  beforeEach(() => {
    engine = new ExpressionEngine()
    context = createDefaultFrameContext()
  })

  describe('#BEAT & #BEAT_SECONDS', () => {
    it('evaluates #BEAT to 1.0 immediately on a beat frame', () => {
      context.$BEAT = 1.0
      context.secondsSinceLastBeat = 0.0
      expect(engine.evaluate('#BEAT()', context)).toBe(1.0)
      expect(engine.evaluate('#BEAT(0.2)', context)).toBe(1.0)
      expect(engine.evaluate('#BEAT_SECONDS(0.5)', context)).toBe(1.0)
    })

    it('decays smoothly over elapsed seconds', () => {
      context.$BEAT = 0.0
      context.secondsSinceLastBeat = 0.1
      const decayVal = engine.evaluate('#BEAT(0.2)', context)
      // e^(-3 * 0.1 / 0.2) = e^(-1.5) ~= 0.2231
      expect(decayVal).toBeGreaterThan(0.15)
      expect(decayVal).toBeLessThan(0.3)
    })

    it('returns 0.0 when elapsed seconds exceeds decay duration', () => {
      context.$BEAT = 0.0
      context.secondsSinceLastBeat = 0.25
      expect(engine.evaluate('#BEAT(0.2)', context)).toBe(0.0)
    })

    it('allows multiple #BEAT calls with different decay durations in the same expression', () => {
      context.secondsSinceLastBeat = 0.05
      const expr = '#BEAT(0.1) + #BEAT(0.5)'
      const res = engine.evaluate(expr, context)
      expect(res).toBeGreaterThan(0)
    })
  })

  describe('#BEAT_FRAMES', () => {
    it('evaluates to 1.0 on frame 0', () => {
      context.framesSinceLastBeat = 0
      expect(engine.evaluate('#BEAT_FRAMES(12)', context)).toBe(1.0)
      expect(engine.evaluate('#BEAT_FRAMES(12, "linear")', context)).toBe(1.0)
    })

    it('evaluates linear decay accurately', () => {
      context.framesSinceLastBeat = 6
      // (1 - 6/12) = 0.5
      expect(engine.evaluate('#BEAT_FRAMES(12, "linear")', context)).toBeCloseTo(0.5, 4)
    })

    it('evaluates exponential decay curve by default', () => {
      context.framesSinceLastBeat = 6
      const val = engine.evaluate('#BEAT_FRAMES(12)', context)
      expect(val).toBeGreaterThan(0.1)
      expect(val).toBeLessThan(0.5)
    })

    it('returns 0.0 when framesSinceLastBeat >= decay_frames', () => {
      context.framesSinceLastBeat = 12
      expect(engine.evaluate('#BEAT_FRAMES(12)', context)).toBe(0.0)
      context.framesSinceLastBeat = 20
      expect(engine.evaluate('#BEAT_FRAMES(12)', context)).toBe(0.0)
    })
  })

  describe('#FFT Spectrum Sampling', () => {
    it('returns 0.0 if frequencyData buffer is not present', () => {
      expect(engine.evaluate('#FFT(0.1)', context)).toBe(0.0)
    })

    it('samples frequency energy from active frequencyData buffer', () => {
      const buffer = new Uint8Array(1024)
      // Fill bass bins with high energy (255)
      for (let i = 0; i < 50; i++) {
        buffer[i] = 255
      }
      context.frequencyData = buffer

      const bassSlice = engine.evaluate('#FFT(0.01, 0.05)', context)
      expect(bassSlice).toBeGreaterThan(0.5)

      // High treble bins are 0
      const trebleSlice = engine.evaluate('#FFT(0.8, 0.05)', context)
      expect(trebleSlice).toBe(0.0)
    })
  })

  describe('#WAVEFORM Time-Domain Sampling', () => {
    it('returns 0.0 if timeDomainData buffer is not present', () => {
      expect(engine.evaluate('#WAVEFORM(0.5)', context)).toBe(0.0)
    })

    it('samples instantaneous amplitude from active timeDomainData buffer', () => {
      const timeBuffer = new Float32Array(1024)
      timeBuffer[512] = 0.75
      context.timeDomainData = timeBuffer

      expect(engine.evaluate('#WAVEFORM(0.5)', context)).toBeCloseTo(0.75, 2)
    })
  })

  describe('Mathematical Waves (#TRI, #SAW, #SQR)', () => {
    it('evaluates #TRI (triangle wave) with period 1.0', () => {
      expect(engine.evaluate('#TRI(0.0)', context)).toBe(-1.0)
      expect(engine.evaluate('#TRI(0.25)', context)).toBeCloseTo(0.0, 4)
      expect(engine.evaluate('#TRI(0.5)', context)).toBe(1.0)
      expect(engine.evaluate('#TRI(0.75)', context)).toBeCloseTo(0.0, 4)
      expect(engine.evaluate('#TRI(1.0)', context)).toBe(-1.0)
    })

    it('evaluates #SAW (sawtooth wave) with period 1.0', () => {
      expect(engine.evaluate('#SAW(0.0)', context)).toBe(-1.0)
      expect(engine.evaluate('#SAW(0.5)', context)).toBeCloseTo(0.0, 4)
      expect(engine.evaluate('#SAW(0.99)', context)).toBeCloseTo(0.98, 2)
    })

    it('evaluates #SQR (square wave) with period 1.0', () => {
      expect(engine.evaluate('#SQR(0.2)', context)).toBe(1.0)
      expect(engine.evaluate('#SQR(0.7)', context)).toBe(-1.0)
    })
  })
})
