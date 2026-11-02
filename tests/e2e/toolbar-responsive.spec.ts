import { test, expect } from '@playwright/test'

test.describe('Toolbar Responsive Wrapping & Actionability', () => {
  test('keeps all right-side toolbar controls accessible and wraps rows on 400px viewport', async ({
    page,
  }) => {
    // Set a constrained viewport width (compact pane width 400px)
    await page.setViewportSize({ width: 400, height: 800 })

    await page.goto('/')

    const toolbar = page.locator('[data-testid="playback-toolbar"]')
    await expect(toolbar).toBeVisible({ timeout: 10000 })

    // Verify all 3 semantic clusters and scrubber container are present
    const playbackCluster = page.locator('[data-testid="playback-source-cluster"]')
    const actionCluster = page.locator('[data-testid="action-tools-cluster"]')
    const presetCluster = page.locator('[data-testid="preset-selector-cluster"]')

    await expect(playbackCluster).toBeVisible()
    await expect(actionCluster).toBeVisible()
    await expect(presetCluster).toBeVisible()

    // Verify preset selector is at the end of the toolbar
    const lastChild = page.locator('[data-testid="playback-toolbar"] > *:last-child')
    await expect(lastChild).toHaveAttribute('data-testid', 'preset-selector-cluster')

    // Right-side action buttons must all be visible and within the viewport boundaries
    const undoBtn = page.locator('[data-testid="toolbar-undo-btn"]')
    const redoBtn = page.locator('[data-testid="toolbar-redo-btn"]')
    const debugBtn = page.locator('[data-testid="toolbar-debug-data-btn"]')
    const settingsBtn = page.getByRole('button', { name: /open preset settings/i })
    const studioBtn = page.locator('[data-testid="action-tools-cluster"]').getByRole('button').last()

    await expect(undoBtn).toBeVisible()
    await expect(redoBtn).toBeVisible()
    await expect(debugBtn).toBeVisible()
    await expect(settingsBtn).toBeVisible()
    await expect(studioBtn).toBeVisible()

    // Assert every button's bounding box is fully contained within [0, 400] horizontally
    for (const btn of [undoBtn, redoBtn, debugBtn, settingsBtn, studioBtn]) {
      const box = await btn.boundingBox()
      expect(box, 'Button must have bounding box').not.toBeNull()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(400)
      }
    }

    // Verify actionability: clicking Settings button opens the Preset Settings dialog
    await settingsBtn.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Close the dialog
    const closeBtn = dialog.getByRole('button', { name: /close|done/i }).first()
    await closeBtn.click()
    await expect(dialog).not.toBeVisible()

    // Verify actionability: clicking Debug Data button toggles debug telemetry
    await debugBtn.click()
    await expect(debugBtn).toHaveAttribute('title', 'Show Debug Data')
  })

  test('maintains full button containment and vertical multi-row wrapping at extreme 320px viewport', async ({
    page,
  }) => {
    // Set extreme compact/mobile width 320px
    await page.setViewportSize({ width: 320, height: 800 })

    await page.goto('/')

    const toolbar = page.locator('[data-testid="playback-toolbar"]')
    await expect(toolbar).toBeVisible({ timeout: 10000 })

    const playbackCluster = page.locator('[data-testid="playback-source-cluster"]')
    const actionCluster = page.locator('[data-testid="action-tools-cluster"]')
    const presetCluster = page.locator('[data-testid="preset-selector-cluster"]')

    await expect(playbackCluster).toBeVisible()
    await expect(actionCluster).toBeVisible()
    await expect(presetCluster).toBeVisible()

    // Verify multi-row wrapping occurred by asserting vertical offset between clusters
    const playbackBox = await playbackCluster.boundingBox()
    const actionBox = await actionCluster.boundingBox()
    const presetBox = await presetCluster.boundingBox()

    expect(playbackBox).not.toBeNull()
    expect(actionBox).not.toBeNull()
    expect(presetBox).not.toBeNull()

    if (playbackBox && actionBox && presetBox) {
      // Must wrap across multiple vertical rows
      const distinctYPositions = new Set([playbackBox.y, actionBox.y, presetBox.y])
      expect(distinctYPositions.size).toBeGreaterThanOrEqual(2)

      // All elements must stay within 320px viewport bounds
      expect(playbackBox.x + playbackBox.width).toBeLessThanOrEqual(320)
      expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(320)
      expect(presetBox.x + presetBox.width).toBeLessThanOrEqual(320)
    }

    // Verify clickability under extreme 320px constraint
    const debugBtn = page.locator('[data-testid="toolbar-debug-data-btn"]')
    await expect(debugBtn).toBeVisible()
    await debugBtn.click()
    await expect(debugBtn).toHaveAttribute('title', 'Show Debug Data')
  })
})
