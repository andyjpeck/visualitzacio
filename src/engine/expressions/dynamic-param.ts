import type { FrameContext } from '../../contracts/frame-context'
import type { CompiledExpression, ExpressionEngine } from './expression-engine'

/**
 * Encapsulates a component parameter that can either be a static numeric constant or a dynamic expression.
 */
export interface DynamicParam<T = number> {
  /** Raw value representation (constant number or formula string). */
  readonly raw: number | string
  /** True if this parameter is dynamically evaluated via an expression. */
  readonly isDynamic: boolean
  /** Pre-compiled AST (if dynamic and successfully compiled). */
  readonly compiled?: CompiledExpression
  /**
   * Evaluates the parameter against the current frame context.
   *
   * @param context - Current FrameContext telemetry.
   * @param fallback - Safe default fallback value.
   * @returns Evaluated numeric output.
   */
  evaluate(context: FrameContext, fallback?: T): T
}

/**
 * Creates a DynamicParam instance from a numeric constant or formula string.
 * Automatically detects static numeric strings to bypass AST evaluation overhead.
 *
 * @param raw - Constant number or mathematical formula string.
 * @param engine - Active ExpressionEngine instance.
 * @returns Configured DynamicParam.
 */
export function createDynamicParam(
  raw: number | string,
  engine: ExpressionEngine,
): DynamicParam<number> {
  // If raw is already a number
  if (typeof raw === 'number') {
    return {
      raw,
      isDynamic: false,
      evaluate: () => raw,
    }
  }

  // If raw is a numeric string (e.g. "42", "3.1415", "-0.5")
  const trimmed = raw.trim()
  const parsedNumeric = Number(trimmed)
  if (trimmed !== '' && !Number.isNaN(parsedNumeric)) {
    return {
      raw,
      isDynamic: false,
      evaluate: () => parsedNumeric,
    }
  }

  // Dynamic formula string
  try {
    const compiled = engine.compile(trimmed)
    return {
      raw,
      isDynamic: true,
      compiled,
      evaluate: (context: FrameContext, fallback = 0.0): number => {
        return engine.evaluateCompiled(compiled, context, fallback)
      },
    }
  } catch {
    // If compilation fails, return fallback-only param
    return {
      raw,
      isDynamic: true,
      evaluate: (context: FrameContext, fallback = 0.0): number => {
        void context
        return fallback
      },
    }
  }
}
