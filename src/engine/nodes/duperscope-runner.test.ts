import { describe, expect, it } from 'vitest'
import { createDefaultFrameContext, type FrameContext } from '../../contracts/frame-context'
import { DuperscopeCompiler } from './duperscope-compiler'
import {
  DuperscopeRunner,
  sampleDuperscopeAudio,
} from './duperscope-runner'

describe('DuperscopeRunner (Task 1.2)', () => {
  const compiler = new DuperscopeCompiler()

  function createTestContext(beat = 0.0): FrameContext {
    const ctx = createDefaultFrameContext()
    ctx.$BEAT = beat
    ctx.$TIME = 1.0
    ctx.$BASS = 0.8
    ctx.$MID = 0.5
    ctx.$TREBLE = 0.3

    // Create mock audio buffers
    const timeDomain = new Float32Array(512)
    for (let i = 0; i < 512; i++) {
      timeDomain[i] = Math.sin((i / 512) * Math.PI * 2) * 0.75
    }
    ctx.timeDomainData = timeDomain

    const freqData = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
      freqData[i] = Math.floor((1.0 - i / 256) * 255)
    }
    ctx.frequencyData = freqData

    return ctx
  }

  describe('Audio Sampling (sampleDuperscopeAudio)', () => {
    it('samples time-domain waveform in range [-1.0, 1.0]', () => {
      const ctx = createTestContext()
      const sampleStart = sampleDuperscopeAudio(0.0, 'waveform', 'center', ctx)
      const sampleMid = sampleDuperscopeAudio(0.25, 'waveform', 'center', ctx)

      expect(sampleStart).toBeCloseTo(0.0, 2)
      expect(sampleMid).toBeCloseTo(0.75, 2)
    })

    it('samples frequency spectrum with logarithmic mapping in range [0.0, 1.0]', () => {
      const ctx = createTestContext()
      const lowFreq = sampleDuperscopeAudio(0.0, 'spectrum', 'center', ctx)
      const highFreq = sampleDuperscopeAudio(1.0, 'spectrum', 'center', ctx)

      expect(lowFreq).toBeGreaterThan(highFreq)
      expect(lowFreq).toBeLessThanOrEqual(1.0)
      expect(highFreq).toBeGreaterThanOrEqual(0.0)
    })

    it('falls back to 0.0 if audio buffers are missing', () => {
      const ctx = createDefaultFrameContext()
      ctx.timeDomainData = undefined
      ctx.frequencyData = undefined

      expect(sampleDuperscopeAudio(0.5, 'waveform', 'center', ctx)).toBe(0.0)
      expect(sampleDuperscopeAudio(0.5, 'spectrum', 'center', ctx)).toBe(0.0)
    })
  })

  describe('Lifecycle & Variable Scope Execution', () => {
    it('initializes default variables and runs init code', () => {
      const runner = new DuperscopeRunner()
      const compiledInit = compiler.compilePhase('n = 120; rot = 0.5;', 'init')

      runner.runInit(compiledInit)
      const scope = runner.getScope()

      expect(scope.n).toBe(120)
      expect(scope.rot).toBe(0.5)
      expect(scope.r).toBe(1.0)
      expect(scope.linesize).toBe(1.0)
    })

    it('persists user variables across frame evaluations', () => {
      const runner = new DuperscopeRunner()
      const compiledInit = compiler.compilePhase('rot = 0;', 'init')
      const compiledBeat = compiler.compilePhase('', 'beat')
      const compiledFrame = compiler.compilePhase('rot = rot + 0.1;', 'frame')
      const compiledPoint = compiler.compilePhase('x = rot;', 'point')

      runner.runInit(compiledInit)

      const positions = new Float32Array(4096 * 3)
      const colors = new Float32Array(4096 * 4)
      const sizes = new Float32Array(4096)
      const ctx = createTestContext(0.0)

      // Frame 1
      runner.runFrame(compiledBeat, compiledFrame, compiledPoint, ctx, {
        audioMode: 'waveform',
        channel: 'center',
        positions,
        colors,
        sizes,
      })
      expect(runner.getScope().rot).toBeCloseTo(0.1, 4)

      // Frame 2
      runner.runFrame(compiledBeat, compiledFrame, compiledPoint, ctx, {
        audioMode: 'waveform',
        channel: 'center',
        positions,
        colors,
        sizes,
      })
      expect(runner.getScope().rot).toBeCloseTo(0.2, 4)
    })

    it('executes beat before frame on beat transient ($BEAT === 1.0)', () => {
      const runner = new DuperscopeRunner()
      const compiledInit = compiler.compilePhase('val = 0;', 'init')
      // If beat runs first: val becomes 0 + 10 = 10, then frame multiplies by 2 -> 20.
      // If frame ran first: val becomes 0 * 2 = 0, then beat adds 10 -> 10.
      const compiledBeat = compiler.compilePhase('val = val + 10;', 'beat')
      const compiledFrame = compiler.compilePhase('val = val * 2;', 'frame')
      const compiledPoint = compiler.compilePhase('', 'point')

      runner.runInit(compiledInit)

      const positions = new Float32Array(4096 * 3)
      const colors = new Float32Array(4096 * 4)
      const sizes = new Float32Array(4096)
      const beatCtx = createTestContext(1.0)

      runner.runFrame(compiledBeat, compiledFrame, compiledPoint, beatCtx, {
        audioMode: 'waveform',
        channel: 'center',
        positions,
        colors,
        sizes,
      })

      // Must be 20 because beat runs BEFORE frame!
      expect(runner.getScope().val).toBe(20)
    })

    it('does not execute beat when $BEAT === 0.0', () => {
      const runner = new DuperscopeRunner()
      const compiledInit = compiler.compilePhase('val = 5;', 'init')
      const compiledBeat = compiler.compilePhase('val = val + 10;', 'beat')
      const compiledFrame = compiler.compilePhase('val = val + 1;', 'frame')
      const compiledPoint = compiler.compilePhase('', 'point')

      runner.runInit(compiledInit)

      const positions = new Float32Array(4096 * 3)
      const colors = new Float32Array(4096 * 4)
      const sizes = new Float32Array(4096)
      const noBeatCtx = createTestContext(0.0)

      runner.runFrame(compiledBeat, compiledFrame, compiledPoint, noBeatCtx, {
        audioMode: 'waveform',
        channel: 'center',
        positions,
        colors,
        sizes,
      })

      // Beat was skipped, so 5 + 1 = 6
      expect(runner.getScope().val).toBe(6)
    })
  })

  describe('Point Loop Evaluation & Buffer Population', () => {
    it('populates vertex position, color, and size buffers correctly', () => {
      const runner = new DuperscopeRunner()
      const compiledInit = compiler.compilePhase('n = 4;', 'init')
      const compiledBeat = compiler.compilePhase('', 'beat')
      const compiledFrame = compiler.compilePhase('r = 0.5; linesize = 4.0;', 'frame')
      const compiledPoint = compiler.compilePhase(
        'x = i * 2.0 - 1.0; y = i; b = i; linesize = linesize + i;',
        'point',
      )

      runner.runInit(compiledInit)

      const positions = new Float32Array(4096 * 3)
      const colors = new Float32Array(4096 * 4)
      const sizes = new Float32Array(4096)
      const ctx = createTestContext(0.0)

      const { pointCount } = runner.runFrame(
        compiledBeat,
        compiledFrame,
        compiledPoint,
        ctx,
        {
          audioMode: 'waveform',
          channel: 'center',
          positions,
          colors,
          sizes,
        },
      )

      expect(pointCount).toBe(4)

      // Point 0 (i = 0.0)
      expect(positions[0]).toBeCloseTo(-1.0, 4) // x
      expect(positions[1]).toBeCloseTo(0.0, 4) // y
      expect(colors[0]).toBeCloseTo(0.5, 4) // r
      expect(colors[2]).toBeCloseTo(0.0, 4) // b
      expect(colors[3]).toBeCloseTo(1.0, 4) // a (default 1.0)
      expect(sizes[0]).toBeCloseTo(4.0, 4) // linesize

      // Point 3 (i = 1.0)
      expect(positions[3 * 3]).toBeCloseTo(1.0, 4) // x
      expect(positions[3 * 3 + 1]).toBeCloseTo(1.0, 4) // y
      expect(colors[3 * 4 + 2]).toBeCloseTo(1.0, 4) // b
      expect(sizes[3]).toBeCloseTo(6.0, 4) // linesize accumulated across points (4 + 0 + 1/3 + 2/3 + 1 = 6)
    })

    it('zeros alpha when skip > 0 in point phase', () => {
      const runner = new DuperscopeRunner()
      const compiledInit = compiler.compilePhase('n = 2;', 'init')
      const compiledBeat = compiler.compilePhase('', 'beat')
      const compiledFrame = compiler.compilePhase('', 'frame')
      const compiledPoint = compiler.compilePhase('skip = i;', 'point')

      runner.runInit(compiledInit)

      const positions = new Float32Array(4096 * 3)
      const colors = new Float32Array(4096 * 4)
      const sizes = new Float32Array(4096)
      const ctx = createTestContext(0.0)

      runner.runFrame(compiledBeat, compiledFrame, compiledPoint, ctx, {
        audioMode: 'waveform',
        channel: 'center',
        positions,
        colors,
        sizes,
      })

      // Point 0 (i = 0, skip = 0 -> alpha = 1)
      expect(colors[3]).toBeCloseTo(1.0, 4)
      // Point 1 (i = 1, skip = 1 -> alpha = 0)
      expect(colors[7]).toBeCloseTo(0.0, 4)
    })

    it('clamps point count n between 1 and 4096', () => {
      const runner = new DuperscopeRunner()
      const compiledBeat = compiler.compilePhase('', 'beat')
      const compiledPoint = compiler.compilePhase('', 'point')

      const positions = new Float32Array(4096 * 3)
      const colors = new Float32Array(4096 * 4)
      const sizes = new Float32Array(4096)
      const ctx = createTestContext(0.0)

      // Test lower clamp (n = 0 -> 1)
      const compiledFrameLow = compiler.compilePhase('n = 0;', 'frame')
      const { pointCount: lowCount } = runner.runFrame(
        compiledBeat,
        compiledFrameLow,
        compiledPoint,
        ctx,
        {
          audioMode: 'waveform',
          channel: 'center',
          positions,
          colors,
          sizes,
        },
      )
      expect(lowCount).toBe(1)

      // Test upper clamp (n = 9999 -> 4096)
      const compiledFrameHigh = compiler.compilePhase('n = 9999;', 'frame')
      const { pointCount: highCount } = runner.runFrame(
        compiledBeat,
        compiledFrameHigh,
        compiledPoint,
        ctx,
        {
          audioMode: 'waveform',
          channel: 'center',
          positions,
          colors,
          sizes,
        },
      )
      expect(highCount).toBe(4096)
    })
  })
})
