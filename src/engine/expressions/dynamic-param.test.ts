import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultFrameContext, type FrameContext } from '../../contracts/frame-context'
import { createDynamicParam, type DynamicParam } from './dynamic-param'
import { ExpressionEngine } from './expression-engine'

describe('DynamicParam Abstraction (TDD)', () => {
  let engine: ExpressionEngine
  let context: FrameContext

  beforeEach(() => {
    engine = new ExpressionEngine()
    context = createDefaultFrameContext()
    context.$BASS = 0.75
    context.$TIME = 3.0
  })

  it('handles static numeric literals without compilation overhead', () => {
    const param: DynamicParam = createDynamicParam(42.5, engine)
    expect(param.isDynamic).toBe(false)
    expect(param.raw).toBe(42.5)
    expect(param.evaluate(context)).toBe(42.5)
  })

  it('handles pure numeric strings as static values', () => {
    const param: DynamicParam = createDynamicParam('12.34', engine)
    expect(param.isDynamic).toBe(false)
    expect(param.evaluate(context)).toBe(12.34)
  })

  it('compiles and evaluates dynamic mathematical expressions', () => {
    const param: DynamicParam = createDynamicParam('1.0 + $BASS * 2.0', engine)
    expect(param.isDynamic).toBe(true)
    // 1.0 + 0.75 * 2.0 = 2.5
    expect(param.evaluate(context)).toBeCloseTo(2.5, 4)
  })

  it('updates dynamically when FrameContext changes', () => {
    const param: DynamicParam = createDynamicParam('$BASS', engine)
    expect(param.evaluate(context)).toBe(0.75)

    context.$BASS = 0.2
    expect(param.evaluate(context)).toBe(0.2)
  })

  it('returns safe fallback value on syntax errors or invalid formulas', () => {
    const param: DynamicParam = createDynamicParam('invalid + + formula', engine)
    expect(param.evaluate(context, 99.0)).toBe(99.0)
  })
})
