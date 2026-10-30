import type { FrameContext } from '../../contracts/frame-context'
import { logScaleToFrequency } from '../../audio/audio-analyzer'
import { updateScopeFromContext } from '../expressions/expression-tokens'
import type { DuperscopeCompilationResult } from './duperscope-compiler'

export type DuperscopeAudioMode = 'waveform' | 'spectrum'
export type DuperscopeChannel = 'center' | 'left' | 'right'

export interface DuperscopeRunFrameOptions {
  audioMode: DuperscopeAudioMode
  channel: DuperscopeChannel
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

export interface DuperscopeRunFrameResult {
  pointCount: number
}

function clamp01(val: number): number {
  if (!Number.isFinite(val)) return 0.0
  if (val < 0.0) return 0.0
  if (val > 1.0) return 1.0
  return val
}

function clampSize(val: number, min = 1.0, max = 128.0): number {
  if (!Number.isFinite(val)) return min
  if (val < min) return min
  if (val > max) return max
  return val
}

/**
 * Samples audio telemetry for a Duperscope point based on its normalized position `i`.
 *
 * @param i - Normalized point index from 0.0 to 1.0.
 * @param audioMode - 'waveform' (oscilloscope) or 'spectrum' (logarithmic FFT).
 * @param channel - Audio channel ('center' | 'left' | 'right').
 * @param context - Current FrameContext telemetry.
 * @returns Sampled audio amplitude in [-1.0, 1.0] for waveform, or [0.0, 1.0] for spectrum.
 */
export function sampleDuperscopeAudio(
  i: number,
  audioMode: DuperscopeAudioMode,
  _channel: DuperscopeChannel,
  context: FrameContext,
): number {
  const normI = clamp01(i)

  if (audioMode === 'waveform') {
    if (!context.timeDomainData || context.timeDomainData.length === 0) {
      return 0.0
    }
    const data = context.timeDomainData
    const index = Math.min(data.length - 1, Math.floor(normI * data.length))
    return data[index]
  }

  // Spectrum mode: Logarithmic frequency distribution matching #FFT(i)
  if (!context.frequencyData || context.frequencyData.length === 0) {
    return 0.0
  }

  const freqData = context.frequencyData
  const binCount = freqData.length
  const nyquist = context.sampleRate ? context.sampleRate / 2 : 22050
  const freq = logScaleToFrequency(normI)
  const bin = Math.max(0, Math.min(binCount - 1, Math.floor((freq / nyquist) * binCount)))

  return freqData[bin] / 255.0
}

/**
 * High-performance, zero-allocation runtime execution runner for Duperscope.
 * Evaluates the 4-phase lifecycle (`init`, `beat`, `frame`, `point`) against
 * a persistent numeric scope dictionary, populating pre-allocated vertex buffers.
 */
export class DuperscopeRunner {
  private scope: Record<string, number> = {}

  constructor() {
    this.resetScope()
  }

  /**
   * Returns a copy or direct reference of the internal execution scope for inspection and testing.
   */
  getScope(): Readonly<Record<string, number>> {
    return this.scope
  }

  /**
   * Resets the execution scope to default initial state, clearing all user variables.
   */
  resetScope(): void {
    this.scope = {
      n: 200,
      r: 1.0,
      g: 1.0,
      b: 1.0,
      a: 1.0,
      linesize: 1.0,
      x: 0.0,
      y: 0.0,
      i: 0.0,
      v: 0.0,
      skip: 0.0,
    }
  }

  /**
   * Runs the `init` lifecycle phase script once on preset load or script modification.
   *
   * @param compiledInit - Compiled init phase statements.
   * @param context - Optional FrameContext to initialize system variables.
   */
  runInit(compiledInit: DuperscopeCompilationResult, context?: FrameContext): void {
    this.resetScope()

    if (context) {
      updateScopeFromContext(this.scope, context)
    }

    if (!compiledInit.isValid) return

    for (let j = 0; j < compiledInit.statements.length; j++) {
      const stmt = compiledInit.statements[j]
      const val = stmt.ast.evaluate(this.scope)
      if (typeof val === 'number' && Number.isFinite(val)) {
        this.scope[stmt.target] = val
      }
    }
  }

  /**
   * Evaluates `beat` (if beat frame), `frame`, and the $N$-point `point` loop,
   * populating the pre-allocated WebGL vertex, color, and size buffers.
   *
   * @param compiledBeat - Compiled beat phase statements.
   * @param compiledFrame - Compiled frame phase statements.
   * @param compiledPoint - Compiled point phase statements.
   * @param context - Current FrameContext telemetry.
   * @param options - Audio mode, channel, and target Float32Array buffers.
   * @returns Active point count evaluated.
   */
  runFrame(
    compiledBeat: DuperscopeCompilationResult,
    compiledFrame: DuperscopeCompilationResult,
    compiledPoint: DuperscopeCompilationResult,
    context: FrameContext,
    options: DuperscopeRunFrameOptions,
  ): DuperscopeRunFrameResult {
    // 1. Update system variables ($TIME, $BASS, etc.) in scope
    updateScopeFromContext(this.scope, context)

    // 2. If beat detected ($BEAT === 1.0), evaluate beat BEFORE frame
    if (context.$BEAT === 1.0 && compiledBeat.isValid) {
      for (let j = 0; j < compiledBeat.statements.length; j++) {
        const stmt = compiledBeat.statements[j]
        const val = stmt.ast.evaluate(this.scope)
        if (typeof val === 'number' && Number.isFinite(val)) {
          this.scope[stmt.target] = val
        }
      }
    }

    // 3. Evaluate frame
    if (compiledFrame.isValid) {
      for (let j = 0; j < compiledFrame.statements.length; j++) {
        const stmt = compiledFrame.statements[j]
        const val = stmt.ast.evaluate(this.scope)
        if (typeof val === 'number' && Number.isFinite(val)) {
          this.scope[stmt.target] = val
        }
      }
    }

    // 4. Calculate clamped point count n in [1, 4096]
    const rawN = this.scope.n
    const pointCount = Number.isFinite(rawN) ? Math.max(1, Math.min(4096, Math.floor(rawN))) : 200

    // 5. Evaluate point loop
    const pointStmts = compiledPoint.isValid ? compiledPoint.statements : []
    const stmtsLen = pointStmts.length

    for (let k = 0; k < pointCount; k++) {
      const i = pointCount > 1 ? k / (pointCount - 1) : 0.0
      const v = sampleDuperscopeAudio(i, options.audioMode, options.channel, context)

      this.scope.i = i
      this.scope.v = v
      this.scope.x = i * 2.0 - 1.0
      this.scope.y = 0.0
      this.scope.skip = 0.0

      for (let s = 0; s < stmtsLen; s++) {
        const stmt = pointStmts[s]
        const val = stmt.ast.evaluate(this.scope)
        if (typeof val === 'number' && Number.isFinite(val)) {
          this.scope[stmt.target] = val
        }
      }

      // Read back values
      const posX = Number.isFinite(this.scope.x) ? this.scope.x : 0.0
      const posY = Number.isFinite(this.scope.y) ? this.scope.y : 0.0
      const colR = clamp01(this.scope.r)
      const colG = clamp01(this.scope.g)
      const colB = clamp01(this.scope.b)
      const colA = this.scope.skip > 0.0 ? 0.0 : clamp01(this.scope.a)
      const size = clampSize(this.scope.linesize, 1.0, 128.0)

      // Write directly to pre-allocated buffers
      const posIdx = k * 3
      options.positions[posIdx] = posX
      options.positions[posIdx + 1] = posY
      options.positions[posIdx + 2] = 0.0

      const colIdx = k * 4
      options.colors[colIdx] = colR
      options.colors[colIdx + 1] = colG
      options.colors[colIdx + 2] = colB
      options.colors[colIdx + 3] = colA

      options.sizes[k] = size
    }

    return { pointCount }
  }
}
