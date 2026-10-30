import { describe, expect, it } from 'vitest'
import {
  DuperscopeCompiler,
  stripComments,
  splitStatements,
} from './duperscope-compiler'

describe('DuperscopeCompiler (Task 1.1)', () => {
  const compiler = new DuperscopeCompiler()

  describe('Comment Stripping', () => {
    it('strips single-line comments (//)', () => {
      const code = `
        // Initial setup
        n = 360; // Set point count
        angle = 0;
      `
      const stripped = stripComments(code)
      expect(stripped).not.toContain('Initial setup')
      expect(stripped).not.toContain('Set point count')
      expect(stripped).toContain('n = 360;')
      expect(stripped).toContain('angle = 0;')
    })

    it('strips multi-line block comments (/* ... */)', () => {
      const code = `
        /*
         * Duperscope tunnel generator
         * Author: VJ Cyber
         */
        rot = rot + 0.01; /* increment */ r = 1.0;
      `
      const stripped = stripComments(code)
      expect(stripped).not.toContain('Duperscope tunnel generator')
      expect(stripped).not.toContain('increment')
      expect(stripped).toContain('rot = rot + 0.01;')
      expect(stripped).toContain('r = 1.0;')
    })

    it('handles empty code and comment-only code gracefully', () => {
      expect(stripComments('')).toBe('')
      expect(stripComments('   // only comment\n  /* block */  ').trim()).toBe('')
    })
  })

  describe('Statement Splitting', () => {
    it('splits statements by semicolon', () => {
      const code = 'n = 200; rot = 0; zoom = 1.0;'
      const statements = splitStatements(code)
      expect(statements).toEqual(['n = 200', 'rot = 0', 'zoom = 1.0'])
    })

    it('splits statements by newline when semicolons are omitted', () => {
      const code = `
        n = 200
        rot = 0
        zoom = 1.0
      `
      const statements = splitStatements(code)
      expect(statements).toEqual(['n = 200', 'rot = 0', 'zoom = 1.0'])
    })

    it('handles mixed semicolons and newlines with trailing empty separators', () => {
      const code = `
        n = 200;
        rot = 0;

        zoom = 1.0;
      `
      const statements = splitStatements(code)
      expect(statements).toEqual(['n = 200', 'rot = 0', 'zoom = 1.0'])
    })
  })

  describe('Statement Validation & Compilation', () => {
    it('compiles valid multi-statement init code', () => {
      const code = `
        // Setup 256 points
        n = 256;
        rot = 0;
        speed = 0.02;
      `
      const result = compiler.compilePhase(code, 'init')
      expect(result.isValid).toBe(true)
      expect(result.statements).toHaveLength(3)
      expect(result.statements[0].target).toBe('n')
      expect(result.statements[1].target).toBe('rot')
      expect(result.statements[2].target).toBe('speed')
    })

    it('compiles valid point code with system variables and math functions', () => {
      const code = `
        theta = i * 2 * PI;
        radius = 0.5 + (v * 0.25) + ($BASS * 0.15);
        x = cos(theta) * radius;
        y = sin(theta) * radius;
      `
      const result = compiler.compilePhase(code, 'point')
      expect(result.isValid).toBe(true)
      expect(result.statements).toHaveLength(4)
      expect(result.statements.map((s) => s.target)).toEqual(['theta', 'radius', 'x', 'y'])
    })

    it('handles empty scripts as valid no-op programs', () => {
      const result = compiler.compilePhase('   \n  // comment only\n  ', 'point')
      expect(result.isValid).toBe(true)
      expect(result.statements).toHaveLength(0)
    })
  })

  describe('Read-Only Variable Guards', () => {
    it('rejects assignment to "i" in any phase', () => {
      const result = compiler.compilePhase('i = 0.5;', 'point')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/read-only.*i/i)
    })

    it('rejects assignment to "v" in any phase', () => {
      const result = compiler.compilePhase('v = 1.0;', 'point')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/(?:read-only.*v|v.*read-only)/i)
    })

    it('rejects assignment to system variables ($TIME, $BASS)', () => {
      const result = compiler.compilePhase('$BASS = 0.5;', 'frame')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/system variable|read-only/i)
    })

    it('rejects assignment to mathematical constants (PI, E)', () => {
      const result = compiler.compilePhase('PI = 3.14;', 'init')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/constant|read-only/i)
    })

    it('rejects assignment to "n" inside the "point" phase', () => {
      const result = compiler.compilePhase('n = 100;', 'point')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/n.*read-only.*point phase/i)
    })

    it('allows assignment to "n" in "init", "beat", and "frame" phases', () => {
      expect(compiler.compilePhase('n = 360;', 'init').isValid).toBe(true)
      expect(compiler.compilePhase('n = 128;', 'beat').isValid).toBe(true)
      expect(compiler.compilePhase('n = 200;', 'frame').isValid).toBe(true)
    })
  })

  describe('Syntax & Sandboxing Errors', () => {
    it('rejects statements missing assignment operator (=)', () => {
      const result = compiler.compilePhase('cos(t) * 0.5;', 'frame')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/missing assignment operator/i)
    })

    it('rejects invalid target variable names', () => {
      const result = compiler.compilePhase('123abc = 4;', 'frame')
      expect(result.isValid).toBe(false)
      expect(result.error).toMatch(/invalid identifier/i)
    })

    it('rejects syntax errors in the right-hand expression', () => {
      const result = compiler.compilePhase('x = cos(;', 'point')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('prevents prototype or member access sandboxing exploits', () => {
      const result = compiler.compilePhase('x = window.location;', 'point')
      expect(result.isValid).toBe(false)
    })
  })

  describe('compileAll Utility', () => {
    it('compiles all 4 phases and reports status per phase', () => {
      const scripts = {
        init: 'n = 360; angle = 0;',
        beat: 'angle = angle + 0.1;',
        frame: 'angle = angle + 0.015; r = 0.5;',
        point: 'x = cos(angle); y = sin(angle);',
      }
      const compiled = compiler.compileAll(scripts)
      expect(compiled.init.isValid).toBe(true)
      expect(compiled.beat.isValid).toBe(true)
      expect(compiled.frame.isValid).toBe(true)
      expect(compiled.point.isValid).toBe(true)
      expect(compiled.hasErrors).toBe(false)
    })

    it('flags hasErrors if any single phase fails validation', () => {
      const scripts = {
        init: 'n = 360;',
        beat: 'angle = angle + 0.1;',
        frame: 'angle = angle + 0.015;',
        point: 'n = 500;', // Invalid in point!
      }
      const compiled = compiler.compileAll(scripts)
      expect(compiled.point.isValid).toBe(false)
      expect(compiled.hasErrors).toBe(true)
      expect(compiled.firstErrorPhase).toBe('point')
    })
  })
})
