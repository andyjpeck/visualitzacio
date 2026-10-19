import { Parser, type Expression } from 'expr-eval'
import { createDefaultFrameContext, type FrameContext } from '../../contracts/frame-context'
import {
  SUPPORTED_SYSTEM_VARIABLES,
  SUPPORTED_SYSTEM_FUNCTIONS,
  transformTokens,
  updateScopeFromContext,
} from './expression-tokens'
import { registerMathHelpers, registerSystemFunctions } from './system-functions'
import { validateExpression, type ExpressionValidationResult } from './expression-validator'

export { SUPPORTED_SYSTEM_VARIABLES, SUPPORTED_SYSTEM_FUNCTIONS }
export type { ExpressionValidationResult }

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
 * High-performance, sandboxed mathematical expression evaluator for real-time visual parameter modulation.
 * Pre-compiles formulas to ASTs, caches compiled expressions, and evaluates at 60 FPS with zero GC allocations.
 */
export class ExpressionEngine {
  private parser: Parser
  private cache = new Map<string, CompiledExpression>()
  private scope: Record<string, number> = {}
  private activeContext: FrameContext | null = null
  private dummyContext: FrameContext = createDefaultFrameContext()

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

    registerMathHelpers(this.parser)
    registerSystemFunctions(this.parser, () => this.activeContext)
  }

  /**
   * Transforms user-facing syntax ($VARIABLE and #FUNCTION) into parser-friendly internal tokens.
   */
  transformTokens(raw: string): string {
    return transformTokens(raw)
  }

  /**
   * Validates expression syntax and security constraints without executing evaluation.
   */
  validate(expressionStr: string): ExpressionValidationResult {
    return validateExpression(
      expressionStr,
      this.parser,
      (callback) => {
        const previousContext = this.activeContext
        try {
          this.activeContext = this.dummyContext
          callback(this.dummyContext)
        } finally {
          this.activeContext = previousContext
        }
      },
    )
  }

  /**
   * Pre-compiles and caches an expression string into an AST representation.
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
   * Evaluates a pre-compiled expression AST against active FrameContext telemetry.
   */
  evaluateCompiled(compiled: CompiledExpression, context: FrameContext, fallback = 0.0): number {
    try {
      this.activeContext = context
      updateScopeFromContext(this.scope, context)
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
