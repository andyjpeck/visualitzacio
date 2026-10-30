import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

function getFilesRecursively(dir: string, ext: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath, ext))
    } else if (entry.isFile() && entry.name.endsWith(ext) && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
      results.push(fullPath)
    }
  }
  return results
}

describe('UI Stacking Architectural Guardrail (Fail-Closed Dialog Testing)', () => {
  it('strictly forbids inline unportaled dialogs or popovers across all UI components', () => {
    const uiDir = path.resolve(__dirname, '..')
    const files = getFilesRecursively(uiDir, '.tsx')

    expect(files.length).toBeGreaterThan(5) // Ensure files were scanned

    const violations: string[] = []

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const hasDialogRole = /role=["']dialog["']/.test(content)

      if (hasDialogRole) {
        const isBaseModal = file.endsWith('base-modal-dialog.tsx')
        if (isBaseModal) continue

        const usesBaseModal = content.includes('<BaseModalDialog')
        const usesCreatePortal = content.includes('createPortal(')

        if (!usesBaseModal && !usesCreatePortal) {
          violations.push(
            `\n[VIOLATION] ${path.relative(uiDir, file)}: Renders role="dialog" without <BaseModalDialog> or createPortal(). ` +
              `Floating dialogs inside relative/overflow:hidden containers cause clipping and visual occlusion. ` +
              `You MUST wrap this dialog in <BaseModalDialog> or mount it via createPortal(..., document.body) with fixed z-[9999].`
          )
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })
})
