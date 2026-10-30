import type { Expression, Parser } from 'expr-eval'
import {
  type ExpressionEngine,
  getDefaultExpressionEngine,
} from '../expressions/expression-engine'
import {
  SUPPORTED_SYSTEM_FUNCTIONS,
  SUPPORTED_SYSTEM_VARIABLES,
} from '../expressions/expression-tokens'

/**
 * Execution phases of the Duperscope lifecycle.
 */
export type DuperscopePhase = 'init' | 'beat' | 'frame' | 'point'

/**
 * Pre-compiled assignment statement with validated AST and target identifier.
 */
export interface CompiledStatement {
  /** Target variable name in the execution scope. */
  target: string
  /** Raw target identifier string before validation. */
  rawTarget: string
  /** Raw mathematical expression string before token transformation. */
  rawExpression: string
  /** Token-transformed expression string parsed by expr-eval. */
  transformedExpression: string
  /** Compiled AST Expression ready for zero-allocation evaluation. */
  ast: Expression
}

/**
 * Diagnostic result of compiling a single Duperscope code phase.
 */
export interface DuperscopeCompilationResult {
  /** Whether all statements in the code block compiled without errors. */
  isValid: boolean
  /** Diagnostic error message if compilation failed. */
  error?: string
  /** Phase in which the error occurred. */
  errorPhase?: DuperscopePhase
  /** 0-based index of the statement that failed. */
  errorStatementIndex?: number
  /** List of compiled statements in execution sequence. */
  statements: CompiledStatement[]
}

/**
 * Input scripts dictionary for all 4 Duperscope lifecycle phases.
 */
export interface DuperscopeScripts {
  init: string
  beat: string
  frame: string
  point: string
}

/**
 * Comprehensive compilation result across all 4 lifecycle phases.
 */
export interface DuperscopeAllCompilationResult {
  init: DuperscopeCompilationResult
  beat: DuperscopeCompilationResult
  frame: DuperscopeCompilationResult
  point: DuperscopeCompilationResult
  /** True if any of the 4 phases produced a compilation error. */
  hasErrors: boolean
  /** First phase that failed compilation, if any. */
  firstErrorPhase?: DuperscopePhase
}

const READ_ONLY_ALWAYS = new Set(['i', 'v'])
const RESERVED_CONSTANTS = new Set(['PI', 'E'])
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Strips single-line (`// ...`) and block (`/* ... *\/`) comments from code.
 *
 * @param code - Raw source script string.
 * @returns Cleaned code with comments removed.
 */
export function stripComments(code: string): string {
  if (!code) return ''
  // 1. Remove multi-line block comments
  let clean = code.replace(/\/\*[\s\S]*?\*\//g, '')
  // 2. Remove single-line comments
  clean = clean.replace(/\/\/.*$/gm, '')
  return clean
}

/**
 * Splits multi-statement procedural code into individual statement strings by semicolons or newlines.
 *
 * @param code - Raw script string with comments stripped or unstripped.
 * @returns Array of non-empty statement strings.
 */
export function splitStatements(code: string): string[] {
  const stripped = stripComments(code)
  return stripped
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Sandboxed, high-performance multi-statement script compiler for Duperscope.
 * Validates assignment targets, guards read-only variables, and pre-compiles
 * mathematical expressions to ASTs for 60 FPS zero-allocation evaluation.
 */
export class DuperscopeCompiler {
  private expressionEngine: ExpressionEngine
  private parser: Parser

  constructor(expressionEngine: ExpressionEngine = getDefaultExpressionEngine()) {
    this.expressionEngine = expressionEngine
    this.parser = expressionEngine.getParser()
  }

  /**
   * Validates syntax and security for an expression occurring on the right-hand side of an assignment.
   */
  private validateExpressionSyntax(rawExpr: string): { isValid: boolean; error?: string } {
    if (!rawExpr || rawExpr.trim() === '') {
      return { isValid: false, error: 'Expression cannot be empty' }
    }

    // Disallow member access dots (e.g. window.location, constructor.prototype)
    if (/\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\./.test(rawExpr) || /\.\s*[a-zA-Z_$]/.test(rawExpr)) {
      return { isValid: false, error: 'Member access and property navigation are not permitted' }
    }

    // Disallow standalone $ or #
    if (/(^|[^\w])[$#](?!\w)/.test(rawExpr)) {
      return {
        isValid: false,
        error: 'Incomplete symbol: "$" and "#" must be followed by an identifier (e.g. $BASS or #BEAT)',
      }
    }

    // Require #FUNCTION to have parentheses
    const fnWithoutParens = rawExpr.match(/#([a-zA-Z0-9_]+)\b\s*(?!\()/g)
    if (fnWithoutParens && fnWithoutParens.length > 0) {
      const fnName = fnWithoutParens[0].trim()
      return {
        isValid: false,
        error: `System function ${fnName} must be invoked with parentheses, e.g. ${fnName}()`,
      }
    }

    try {
      const transformed = this.expressionEngine.transformTokens(rawExpr)
      const ast = this.parser.parse(transformed)

      // Verify any system variables or functions are recognized
      const variables = ast.variables()
      for (const token of variables) {
        if (token.startsWith('__FN_')) {
          if (!SUPPORTED_SYSTEM_FUNCTIONS.has(token)) {
            return { isValid: false, error: `Unknown system function: #${token.slice(5)}` }
          }
        } else if (token.startsWith('__SYS_')) {
          if (!SUPPORTED_SYSTEM_VARIABLES.has(token)) {
            return { isValid: false, error: `Unknown system variable: $${token.slice(6)}` }
          }
        }
      }

      return { isValid: true }
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * Compiles and validates a single procedural script block for a given lifecycle phase.
   *
   * @param code - Script text to compile.
   * @param phase - Lifecycle phase ('init' | 'beat' | 'frame' | 'point').
   * @returns Compilation result with AST statements or diagnostic error.
   */
  compilePhase(code: string, phase: DuperscopePhase): DuperscopeCompilationResult {
    const rawStatements = splitStatements(code)
    const compiledStatements: CompiledStatement[] = []

    for (let index = 0; index < rawStatements.length; index++) {
      const stmt = rawStatements[index]
      const eqIndex = stmt.indexOf('=')

      if (eqIndex === -1) {
        return {
          isValid: false,
          error: `Missing assignment operator (=) in statement: "${stmt}"`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      const rawTarget = stmt.slice(0, eqIndex).trim()
      const rawExpr = stmt.slice(eqIndex + 1).trim()

      // 1. Validate target identifier syntax
      if (rawTarget.startsWith('$')) {
        return {
          isValid: false,
          error: `Cannot assign to system variable "${rawTarget}". System variables are read-only.`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      if (!IDENTIFIER_REGEX.test(rawTarget)) {
        return {
          isValid: false,
          error: `Invalid identifier "${rawTarget}" for assignment.`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      // 2. Validate read-only constraints
      if (READ_ONLY_ALWAYS.has(rawTarget)) {
        return {
          isValid: false,
          error: `Variable "${rawTarget}" is read-only and cannot be assigned in any phase.`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      if (RESERVED_CONSTANTS.has(rawTarget)) {
        return {
          isValid: false,
          error: `Identifier "${rawTarget}" is a reserved constant and cannot be reassigned.`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      if (phase === 'point' && rawTarget === 'n') {
        return {
          isValid: false,
          error: `Variable "n" is read-only in point phase (point count is fixed during point iteration).`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      // 3. Validate right-hand expression
      if (rawExpr.length === 0) {
        return {
          isValid: false,
          error: `Empty expression on right-hand side of assignment to "${rawTarget}".`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      const validation = this.validateExpressionSyntax(rawExpr)
      if (!validation.isValid) {
        return {
          isValid: false,
          error: `Syntax error in expression for "${rawTarget}": ${validation.error}`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }

      try {
        const transformedExpression = this.expressionEngine.transformTokens(rawExpr)
        const ast = this.parser.parse(transformedExpression)

        compiledStatements.push({
          target: rawTarget,
          rawTarget,
          rawExpression: rawExpr,
          transformedExpression,
          ast,
        })
      } catch (err) {
        return {
          isValid: false,
          error: `Failed to compile expression for "${rawTarget}": ${err instanceof Error ? err.message : String(err)}`,
          errorPhase: phase,
          errorStatementIndex: index,
          statements: [],
        }
      }
    }

    return {
      isValid: true,
      statements: compiledStatements,
    }
  }

  /**
   * Compiles all 4 lifecycle phase scripts and produces a unified compilation summary.
   *
   * @param scripts - Object containing init, beat, frame, and point script strings.
   * @returns Multi-phase compilation result.
   */
  compileAll(scripts: DuperscopeScripts): DuperscopeAllCompilationResult {
    const init = this.compilePhase(scripts.init, 'init')
    const beat = this.compilePhase(scripts.beat, 'beat')
    const frame = this.compilePhase(scripts.frame, 'frame')
    const point = this.compilePhase(scripts.point, 'point')

    const phases: DuperscopePhase[] = ['init', 'beat', 'frame', 'point']
    const results = { init, beat, frame, point }
    let firstErrorPhase: DuperscopePhase | undefined

    for (const phase of phases) {
      if (!results[phase].isValid) {
        firstErrorPhase = phase
        break
      }
    }

    return {
      init,
      beat,
      frame,
      point,
      hasErrors: firstErrorPhase !== undefined,
      firstErrorPhase,
    }
  }
}
