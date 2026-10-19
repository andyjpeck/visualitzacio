import type { Parser } from 'expr-eval'
import type { FrameContext } from '../../contracts/frame-context'
import {
  SUPPORTED_SYSTEM_VARIABLES,
  SUPPORTED_SYSTEM_FUNCTIONS,
  transformTokens,
  createDummyScope,
} from './expression-tokens'

export interface ExpressionValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates expression syntax and security constraints without executing evaluation.
 *
 * @param expressionStr - Raw expression to validate
 * @param parser - expr-eval Parser instance
 * @param executeWithContext - Callback to run a dry-run evaluation with dummy test telemetry
 */
export function validateExpression(
  expressionStr: string,
  parser: Parser,
  executeWithContext: (fn: (ctx: FrameContext) => void) => void,
): ExpressionValidationResult {
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
    const transformed = transformTokens(expressionStr)
    const ast = parser.parse(transformed)

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
    let evalError: string | null = null
    const dummyScope = createDummyScope()

    executeWithContext(() => {
      try {
        const testRes = ast.evaluate(dummyScope)
        if (typeof testRes !== 'number' || !Number.isFinite(testRes)) {
          evalError = 'Expression evaluation did not return a valid finite number'
        }
      } catch (err) {
        evalError = err instanceof Error ? err.message : String(err)
      }
    })

    if (evalError) {
      return { isValid: false, error: evalError }
    }

    return { isValid: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { isValid: false, error: message }
  }
}
