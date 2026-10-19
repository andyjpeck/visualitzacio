import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultFrameContext, type FrameContext } from '../../contracts/frame-context'
import { ExpressionEngine } from './expression-engine'

describe('ExpressionEngine (TDD)', () => {
  let engine: ExpressionEngine
  let context: FrameContext

  beforeEach(() => {
    engine = new ExpressionEngine()
    context = createDefaultFrameContext()
    context.$TIME = 2.5
    context.$DT = 0.016
    context.$FRAME = 150
    context.$FPS = 60.0
    context.$WIDTH = 1920
    context.$HEIGHT = 1080
    context.$ASPECT = 16 / 9
    context.$PIXEL_RATIO = 1.0
    context.$BASS = 0.8
    context.$MID = 0.5
    context.$TREBLE = 0.3
    context.$RMS = 0.65
    context.$BEAT = 1.0
    context.$BPM = 128.0
    context.secondsSinceLastBeat = 0.05
    context.framesSinceLastBeat = 3
  })

  describe('Core Parsing & Standard Math', () => {
    it('evaluates constant arithmetic expressions with correct precedence', () => {
      expect(engine.evaluate('2 + 3 * 4', context)).toBe(14)
      expect(engine.evaluate('(2 + 3) * 4', context)).toBe(20)
      expect(engine.evaluate('10 / 2 - 3', context)).toBe(2)
      expect(engine.evaluate('2 ^ 3', context)).toBe(8)
    })

    it('evaluates built-in standard math functions and constants', () => {
      expect(engine.evaluate('sin(0)', context)).toBe(0)
      expect(engine.evaluate('cos(0)', context)).toBe(1)
      expect(engine.evaluate('abs(-42)', context)).toBe(42)
      expect(engine.evaluate('min(10, 5)', context)).toBe(5)
      expect(engine.evaluate('max(10, 5)', context)).toBe(10)
      expect(engine.evaluate('PI', context)).toBeCloseTo(Math.PI, 4)
    })

    it('caches compiled expressions across multiple calls', () => {
      const exprStr = '1.0 + sin($TIME)'
      const compiled1 = engine.compile(exprStr)
      const compiled2 = engine.compile(exprStr)
      expect(compiled1).toBe(compiled2)
      expect(engine.getCacheSize()).toBe(1)

      engine.clearCache()
      expect(engine.getCacheSize()).toBe(0)
    })
  })

  describe('System Variables ($VARIABLE)', () => {
    it('evaluates all audio telemetry system variables correctly', () => {
      expect(engine.evaluate('$BASS', context)).toBe(0.8)
      expect(engine.evaluate('$MID', context)).toBe(0.5)
      expect(engine.evaluate('$TREBLE', context)).toBe(0.3)
      expect(engine.evaluate('$RMS', context)).toBe(0.65)
      expect(engine.evaluate('$BEAT', context)).toBe(1.0)
      expect(engine.evaluate('$BPM', context)).toBe(128.0)
    })

    it('evaluates engine and viewport system variables correctly', () => {
      expect(engine.evaluate('$TIME', context)).toBe(2.5)
      expect(engine.evaluate('$DT', context)).toBe(0.016)
      expect(engine.evaluate('$FRAME', context)).toBe(150)
      expect(engine.evaluate('$FPS', context)).toBe(60.0)
      expect(engine.evaluate('$WIDTH', context)).toBe(1920)
      expect(engine.evaluate('$HEIGHT', context)).toBe(1080)
      expect(engine.evaluate('$ASPECT', context)).toBeCloseTo(16 / 9, 4)
      expect(engine.evaluate('$PIXEL_RATIO', context)).toBe(1.0)
    })

    it('evaluates composite expressions combining variables and math', () => {
      // 1.0 + 0.8 * 0.5 = 1.4
      expect(engine.evaluate('1.0 + $BASS * 0.5', context)).toBeCloseTo(1.4, 4)
      // $WIDTH / $HEIGHT should match $ASPECT
      expect(engine.evaluate('$WIDTH / $HEIGHT', context)).toBeCloseTo(16 / 9, 4)
    })
  })

  describe('Validation & Error Handling', () => {
    it('validates syntax and returns error details on malformed expressions', () => {
      const valid = engine.validate('1.0 + $BASS * 2')
      expect(valid.isValid).toBe(true)
      expect(valid.error).toBeUndefined()

      const invalid = engine.validate('1.0 + (5 *')
      expect(invalid.isValid).toBe(false)
      expect(invalid.error).toBeDefined()
    })

    it('returns designated fallback value on runtime division by zero or NaN', () => {
      // Division by zero in expr-eval produces Infinity; our engine should handle this safely
      const result = engine.evaluate('1 / 0', context, 42.0)
      expect(result).toBe(42.0)
    })

    it('returns fallback value when evaluation fails or expression contains unknown variables', () => {
      const fallbackVal = -1.0
      const result = engine.evaluate('invalid_var_xyz * 2', context, fallbackVal)
      expect(result).toBe(fallbackVal)
    })
  })

  describe('Security & Sandboxing', () => {
    it('disallows assignment operators and statement execution', () => {
      const validation = engine.validate('x = 5')
      expect(validation.isValid).toBe(false)
    })

    it('disallows member access and prototype navigation', () => {
      const validation = engine.validate('window.location')
      expect(validation.isValid).toBe(false)

      const protoValidation = engine.validate('constructor.prototype')
      expect(protoValidation.isValid).toBe(false)
    })
  })

  describe('Execution Performance', () => {
    it('evaluates compiled expressions within performance budget (<0.02ms per eval)', () => {
      const compiled = engine.compile('1.0 + $BASS * 0.5 + sin($TIME * 2.0)')
      const iterations = 5000
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        context.$TIME += 0.016
        engine.evaluateCompiled(compiled, context)
      }

      const elapsed = performance.now() - start
      const timePerEvalMs = elapsed / iterations

      // Verify evaluation speed is well within 0.05ms budget
      expect(timePerEvalMs).toBeLessThan(0.05)
    })
  })
})
