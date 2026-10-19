import { Parser, type Expression } from 'expr-eval'
import type { FrameContext } from '../../contracts/frame-context'

/**
 * Compiled expression node with cached AST and variable dependencies.
 */
export interface CompiledExpression {
  /** Original expression string before transformation. */
  raw: string
  /** Pre-processed expression string passed to the parser. */
  transformed: string
  /** Compiled expr-eval AST Expression. */
  ast: Expression
  /** List of extracted variable identifiers. */
  variables: string[]
}

/**
 * Validation result for user-entered expressions.
 */
export interface ExpressionValidationResult {
  /** True if the expression was parsed successfully. */
  isValid: boolean
  /** Error message details if validation failed. */
  error?: string
}

/**
 * Set of supported system variable tokens.
 */
export const SUPPORTED_SYSTEM_VARIABLES: ReadonlySet<string> = new Set([
  '__SYS_TIME',
  '__SYS_DT',
  '__SYS_FRAME',
  '__SYS_FPS',
  '__SYS_WIDTH',
  '__SYS_HEIGHT',
  '__SYS_ASPECT',
  '__SYS_PIXEL_RATIO',
  '__SYS_BASS',
  '__SYS_MID',
  '__SYS_TREBLE',
  '__SYS_RMS',
  '__SYS_BEAT',
  '__SYS_BPM',
])

/**
 * Set of supported system function tokens.
 */
export const SUPPORTED_SYSTEM_FUNCTIONS: ReadonlySet<string> = new Set([
  '__FN_BEAT',
  '__FN_BEAT_SECONDS',
  '__FN_BEAT_FRAMES',
  '__FN_FFT',
  '__FN_WAVEFORM',
  '__FN_TRI',
  '__FN_SAW',
  '__FN_SQR',
])

/**
 * High-performance, sandboxed mathematical expression evaluator for real-time visual parameter modulation.
 * Pre-compiles formulas to ASTs, caches compiled expressions, and evaluates at 60 FPS with zero GC allocations.
 */
export class ExpressionEngine {
  private parser: Parser
  private cache = new Map<string, CompiledExpression>()
  private scope: Record<string, number> = {}
  private activeContext: FrameContext | null = null

  private dummyContext: FrameContext = {
    $TIME: 1.0,
    $DT: 0.016,
    $FRAME: 60,
    $FPS: 60.0,
    $WIDTH: 1920,
    $HEIGHT: 1080,
    $ASPECT: 16 / 9,
    $PIXEL_RATIO: 1.0,
    $BASS: 0.5,
    $MID: 0.5,
    $TREBLE: 0.5,
    $RMS: 0.5,
    $BEAT: 0.0,
    $BPM: 120.0,
    secondsSinceLastBeat: 0.1,
    framesSinceLastBeat: 6,
    frequencyData: new Uint8Array(1024),
    timeDomainData: new Float32Array(1024),
  }

  private dummyScope: Record<string, number> = {
    __SYS_TIME: 1.0,
    __SYS_DT: 0.016,
    __SYS_FRAME: 60,
    __SYS_FPS: 60.0,
    __SYS_WIDTH: 1920,
    __SYS_HEIGHT: 1080,
    __SYS_ASPECT: 16 / 9,
    __SYS_PIXEL_RATIO: 1.0,
    __SYS_BASS: 0.5,
    __SYS_MID: 0.5,
    __SYS_TREBLE: 0.5,
    __SYS_RMS: 0.5,
    __SYS_BEAT: 0.0,
    __SYS_BPM: 120.0,
  }

  /**
   * Initializes the ExpressionEngine with sandboxed parser options and math helper functions.
   */
  constructor() {
    this.parser = new Parser({
      allowMemberAccess: false,
      operators: {
        assignment: false,
        fndef: false,
      },
    })

    this.registerMathHelpers()
    this.registerSystemFunctions()
  }

  /**
   * Registers additional mathematical shaping and interpolation functions.
   */
  private registerMathHelpers(): void {
    // clamp(val, min, max)
    this.parser.functions.clamp = (val: number, min: number, max: number): number => {
      return Math.max(min, Math.min(max, val))
    }

    // lerp(a, b, t)
    this.parser.functions.lerp = (a: number, b: number, t: number): number => {
      return a + (b - a) * t
    }

    // smoothstep(edge0, edge1, x)
    this.parser.functions.smoothstep = (edge0: number, edge1: number, x: number): number => {
      const delta = edge1 - edge0 || 1.0
      const t = Math.max(0, Math.min(1, (x - edge0) / delta))
      return t * t * (3 - 2 * t)
    }
  }

  /**
   * Registers specialized audio analysis, beat decay, and periodic wave functions (#FUNCTION).
   */
  private registerSystemFunctions(): void {
    const fn = this.parser.functions

    // #BEAT([decay_seconds = 0.2]) & #BEAT_SECONDS(...)
    const beatFn = (decaySeconds = 0.2): number => {
      const ctx = this.activeContext
      if (!ctx) return 0.0
      const decay = typeof decaySeconds === 'number' && decaySeconds > 0 ? decaySeconds : 0.2
      const t = ctx.secondsSinceLastBeat
      if (t >= decay) return 0.0
      return Math.exp((-3.0 * t) / decay)
    }
    fn.__FN_BEAT = beatFn
    fn.__FN_BEAT_SECONDS = beatFn

    // #BEAT_FRAMES([decay_frames = 12], [curve = "exponential"])
    fn.__FN_BEAT_FRAMES = (decayFrames = 12, curve = 'exponential'): number => {
      const ctx = this.activeContext
      if (!ctx) return 0.0
      const frames = typeof decayFrames === 'number' && decayFrames > 0 ? decayFrames : 12
      const f = ctx.framesSinceLastBeat
      if (f >= frames) return 0.0

      if (curve === 'linear') {
        return 1.0 - f / frames
      }
      if (curve === 'logarithmic') {
        return Math.log(1.0 + ((frames - f) / frames) * 9.0) / Math.LN10
      }
      return Math.exp((-3.0 * f) / frames)
    }

    // #FFT(lower_band, [band_width = 0.02], [channel = 0])
    fn.__FN_FFT = (lowerBand = 0.0, bandWidth = 0.02): number => {
      const ctx = this.activeContext
      if (!ctx || !ctx.frequencyData) return 0.0
      const freqData = ctx.frequencyData
      const binCount = freqData.length
      if (binCount === 0) return 0.0

      const lower = Math.max(0.0, Math.min(1.0, typeof lowerBand === 'number' ? lowerBand : 0.0))
      const width = Math.max(0.001, Math.min(1.0 - lower, typeof bandWidth === 'number' ? bandWidth : 0.02))

      const startBin = Math.floor(lower * binCount)
      const endBin = Math.min(binCount, Math.ceil((lower + width) * binCount))
      let sum = 0
      let count = 0
      for (let i = startBin; i < endBin; i++) {
        sum += freqData[i] / 255.0
        count++
      }
      return count > 0 ? sum / count : 0.0
    }

    // #WAVEFORM(position, [channel = 0])
    fn.__FN_WAVEFORM = (position = 0.0): number => {
      const ctx = this.activeContext
      if (!ctx || !ctx.timeDomainData) return 0.0
      const timeData = ctx.timeDomainData
      const length = timeData.length
      if (length === 0) return 0.0

      const pos = Math.max(0.0, Math.min(1.0, typeof position === 'number' ? position : 0.0))
      const index = Math.min(length - 1, Math.floor(pos * length))
      return timeData[index]
    }

    // #TRI(t): Normalized triangle wave [-1.0, 1.0] with period 1.0
    fn.__FN_TRI = (t: number): number => {
      const phase = ((t % 1.0) + 1.0) % 1.0
      return 1.0 - 4.0 * Math.abs(phase - 0.5)
    }

    // #SAW(t): Normalized sawtooth wave [-1.0, 1.0] with period 1.0
    fn.__FN_SAW = (t: number): number => {
      const phase = ((t % 1.0) + 1.0) % 1.0
      return 2.0 * phase - 1.0
    }

    // #SQR(t): Normalized square wave [-1.0, 1.0] with period 1.0
    fn.__FN_SQR = (t: number): number => {
      const phase = ((t % 1.0) + 1.0) % 1.0
      return phase < 0.5 ? 1.0 : -1.0
    }
  }

  /**
   * Transforms user-facing syntax ($VARIABLE and #FUNCTION) into parser-friendly internal tokens.
   *
   * @param raw - Raw user expression string (e.g. "1.0 + $BASS * 0.5 + #BEAT(0.2)").
   * @returns Pre-processed tokenized expression string.
   */
  transformTokens(raw: string): string {
    return raw
      .replace(/\$([a-zA-Z0-9_]+)/g, '__SYS_$1')
      .replace(/#([a-zA-Z0-9_]+)/g, '__FN_$1')
  }

  /**
   * Validates expression syntax and security constraints without executing evaluation.
   *
   * @param expressionStr - Raw expression to validate.
   * @returns Validation result containing validity status and optional error message.
   */
  validate(expressionStr: string): ExpressionValidationResult {
    if (!expressionStr || typeof expressionStr !== 'string' || expressionStr.trim() === '') {
      return { isValid: false, error: 'Expression cannot be empty' }
    }

    // Explicitly reject member access dots (e.g. window.location, constructor.prototype)
    if (/\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\./.test(expressionStr) || /\.\s*[a-zA-Z_$]/.test(expressionStr)) {
      return { isValid: false, error: 'Member access and property navigation are not permitted' }
    }

    // Reject standalone or dangling # and $ symbols not followed by an identifier
    if (/(^|[^\w])[$#](?!\w)/.test(expressionStr)) {
      return {
        isValid: false,
        error: 'Incomplete symbol: "$" and "#" must be followed by an identifier (e.g. $BASS or #BEAT)',
      }
    }

    // Require all #SYSTEM_FUNCTIONS to be invoked with parentheses
    const fnWithoutParens = expressionStr.match(/#([a-zA-Z0-9_]+)\b\s*(?!\()/g)
    if (fnWithoutParens && fnWithoutParens.length > 0) {
      const fnName = fnWithoutParens[0].trim()
      return {
        isValid: false,
        error: `System function ${fnName} must be invoked with parentheses, e.g. ${fnName}()`,
      }
    }

    try {
      const transformed = this.transformTokens(expressionStr)
      const ast = this.parser.parse(transformed)

      // Validate all extracted AST variables against allowed system variables & functions
      const variables = ast.variables()
      for (const token of variables) {
        if (token.startsWith('__FN_')) {
          if (SUPPORTED_SYSTEM_FUNCTIONS.has(token)) {
            return {
              isValid: false,
              error: `System function #${token.slice(5)} must be invoked with parentheses, e.g. #${token.slice(5)}()`,
            }
          }
          return { isValid: false, error: `Unknown system function: #${token.slice(5)}` }
        }

        if (token.startsWith('__SYS_')) {
          if (!SUPPORTED_SYSTEM_VARIABLES.has(token)) {
            return { isValid: false, error: `Unknown system variable: $${token.slice(6)}` }
          }
        } else {
          return { isValid: false, error: `Unknown variable or invalid identifier: "${token}"` }
        }
      }

      // Dry-run evaluation with test context and scope to catch runtime argument/arithmetic failures
      const previousContext = this.activeContext
      try {
        this.activeContext = this.dummyContext
        const testRes = ast.evaluate(this.dummyScope)
        if (typeof testRes !== 'number' || !Number.isFinite(testRes)) {
          return { isValid: false, error: 'Expression evaluation did not return a valid finite number' }
        }
      } catch (evalErr) {
        const message = evalErr instanceof Error ? evalErr.message : String(evalErr)
        return { isValid: false, error: message }
      } finally {
        this.activeContext = previousContext
      }

      return { isValid: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { isValid: false, error: message }
    }
  }

  /**
   * Pre-compiles and caches an expression string into an AST representation.
   *
   * @param expressionStr - Raw expression string to compile.
   * @returns CompiledExpression object with AST and dependency metadata.
   */
  compile(expressionStr: string): CompiledExpression {
    const cached = this.cache.get(expressionStr)
    if (cached) return cached

    const validation = this.validate(expressionStr)
    if (!validation.isValid) {
      throw new Error(`Invalid expression "${expressionStr}": ${validation.error}`)
    }

    const transformed = this.transformTokens(expressionStr)
    const ast = this.parser.parse(transformed)
    const variables = ast.variables()

    const compiled: CompiledExpression = {
      raw: expressionStr,
      transformed,
      ast,
      variables,
    }

    this.cache.set(expressionStr, compiled)
    return compiled
  }

  /**
   * Synchronizes the internal scope object with current FrameContext telemetry.
   * Mutates properties in-place with zero object allocations.
   *
   * @param context - Active FrameContext telemetry object.
   */
  private updateScopeFromContext(context: FrameContext): void {
    const s = this.scope
    s.__SYS_TIME = context.$TIME
    s.__SYS_DT = context.$DT
    s.__SYS_FRAME = context.$FRAME
    s.__SYS_FPS = context.$FPS
    s.__SYS_WIDTH = context.$WIDTH
    s.__SYS_HEIGHT = context.$HEIGHT
    s.__SYS_ASPECT = context.$ASPECT
    s.__SYS_PIXEL_RATIO = context.$PIXEL_RATIO
    s.__SYS_BASS = context.$BASS
    s.__SYS_MID = context.$MID
    s.__SYS_TREBLE = context.$TREBLE
    s.__SYS_RMS = context.$RMS
    s.__SYS_BEAT = context.$BEAT
    s.__SYS_BPM = context.$BPM
  }

  /**
   * Evaluates a pre-compiled expression AST against active FrameContext telemetry.
   *
   * @param compiled - Pre-compiled expression AST.
   * @param context - Active FrameContext.
   * @param fallback - Safe default value if evaluation errors or produces non-finite result (default 0.0).
   * @returns Evaluated numeric output.
   */
  evaluateCompiled(compiled: CompiledExpression, context: FrameContext, fallback = 0.0): number {
    try {
      this.activeContext = context
      this.updateScopeFromContext(context)
      const res = compiled.ast.evaluate(this.scope)

      if (typeof res === 'number' && Number.isFinite(res)) {
        return res
      }
      return fallback
    } catch {
      return fallback
    }
  }

  /**
   * Convenience method to compile (with caching) and evaluate an expression string.
   *
   * @param expressionStr - Raw formula string.
   * @param context - Active FrameContext telemetry.
   * @param fallback - Fallback number on failure.
   * @returns Computed numeric result.
   */
  evaluate(expressionStr: string, context: FrameContext, fallback = 0.0): number {
    try {
      const compiled = this.compile(expressionStr)
      return this.evaluateCompiled(compiled, context, fallback)
    } catch {
      return fallback
    }
  }

  /**
   * Returns the count of compiled expressions in the in-memory cache.
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * Clears all pre-compiled expression ASTs from memory.
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Exposes the underlying expr-eval Parser instance for registering custom functions.
   */
  getParser(): Parser {
    return this.parser
  }
}

let defaultEngineInstance: ExpressionEngine | null = null

/**
 * Returns the application-wide default ExpressionEngine singleton.
 */
export function getDefaultExpressionEngine(): ExpressionEngine {
  if (!defaultEngineInstance) {
    defaultEngineInstance = new ExpressionEngine()
  }
  return defaultEngineInstance
}
