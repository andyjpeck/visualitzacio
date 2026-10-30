import { test, expect } from '@playwright/test'

test.describe('Real-Browser Actionability & Smoke Verification', () => {
  test('renders WebGL canvas, mounts portaled menus, and verifies zero element click interception', async ({
    page,
  }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message)
    })

    await page.goto('/')

    // 1. Verify canvas container and FPS badge are mounted
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    const fpsBadge = page.locator('[data-testid="fps-badge"]')
    await expect(fpsBadge).toBeVisible()

    // 2. Open Add Child menu on Master Output
    const addChildBtn = page.locator('[data-testid="tree-add-child-btn-master-frame-buffer"]')
    await expect(addChildBtn).toBeVisible()
    await addChildBtn.click()

    // 3. Verify portaled dropdown menu is visible and unoccluded
    const addMenu = page.locator('[data-testid="tree-add-child-menu-master-frame-buffer"]')
    await expect(addMenu).toBeVisible()

    // 4. Click "+ Duperscope" (will fail if obscured or pointer-events are intercepted)
    const addDuperscopeBtn = page.locator('[data-testid="tree-add-duperscope-btn-master-frame-buffer"]')
    await expect(addDuperscopeBtn).toBeVisible()
    await addDuperscopeBtn.click()

    // 5. Verify Duperscope layer was added and rendered with icon badge
    const scopeBadge = page.locator('[data-testid="duperscope-icon-badge"]')
    await expect(scopeBadge).toBeVisible()

    // 6. Click FPS badge to open Preset Settings modal dialog
    await fpsBadge.click()

    const modalDialog = page.locator('[role="dialog"]')
    await expect(modalDialog).toBeVisible()

    // 7. Verify modal buttons are actionable (not obscured by canvas)
    const closeBtn = modalDialog.getByRole('button', { name: /close|done/i }).first()
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()

    await expect(modalDialog).not.toBeVisible()

    // 8. Assert zero console errors or uncaught shader exceptions
    const criticalErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('favicon') &&
        !msg.includes('download the React DevTools') &&
        !msg.includes('[vite] connecting'),
    )

    expect(criticalErrors, `Browser console errors detected: ${criticalErrors.join('\n')}`).toEqual([])
  })
})
