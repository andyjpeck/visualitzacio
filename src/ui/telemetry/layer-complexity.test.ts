import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import { computeSceneLayerComplexity } from './layer-complexity'

describe('computeSceneLayerComplexity (Tier 0 Static Complexity & Lint Model)', () => {
  it('computes relative share percentages, pass counts, VRAM estimates, and subtree rollups across layer types', () => {
    const nodes: Node[] = [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Master Output',
          feedback: true,
        },
      },
      {
        id: 'source-buffer',
        type: 'frameBuffer',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 40 },
        data: {
          label: 'Source Buffer',
          feedback: false,
          saveTo: '@FRAME',
        },
      },
      {
        id: 'heavy-scope',
        type: 'duperscopeNode',
        parentId: 'source-buffer',
        position: { x: 20, y: 40 },
        data: {
          label: 'Heavy Scope',
          initCode: 'n = 512;',
          frameCode: 't = $TIME;',
          pointCode:
            'x = sin(i * 6.28 + t) * cos(i * 3.14); y = sin(i * 12.0) + #FFT(i) * #WAVEFORM(i); r = sqrt(i);',
        },
      },
      {
        id: 'quadrant-pass-through',
        type: 'frameBuffer',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 120 },
        data: {
          label: 'Quadrant Upper Left',
          feedback: false,
          loadFrom: '@FRAME',
          inputBlendMode: 'replace',
          outputBlendMode: 'additive',
          scale: 0.5,
        },
      },
      {
        id: 'bypassed-layer',
        type: 'staticImage',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 200 },
        data: {
          label: 'Bypassed Image',
          bypassed: true,
        },
      },
    ]

    const map = computeSceneLayerComplexity(nodes, 1.0)

    const master = map.get('master-frame-buffer')!
    const source = map.get('source-buffer')!
    const scope = map.get('heavy-scope')!
    const quadrant = map.get('quadrant-pass-through')!
    const bypassed = map.get('bypassed-layer')!

    expect(master).toBeDefined()
    expect(source).toBeDefined()
    expect(scope).toBeDefined()
    expect(quadrant).toBeDefined()
    expect(bypassed).toBeDefined()

    // Bypassed layer has 0 cost and 'bypassed' tier
    expect(bypassed.selfScore).toBe(0)
    expect(bypassed.sharePercent).toBe(0)
    expect(bypassed.tier).toBe('bypassed')

    // Pass-through quadrant buffer allocates 0 MB FBO VRAM and uses 1 full-screen pass
    expect(quadrant.estimatedVramMb).toBe(0)
    expect(quadrant.fullScreenPasses).toBe(1)
    expect(quadrant.selfScore).toBeLessThan(source.selfScore)

    // Heavy Duperscope (n=512 with 6 transcendental/DSP calls per point) is the heaviest single node
    expect(scope.estimatedPointOps).toBeGreaterThanOrEqual(512 * 3)
    expect(scope.selfScore).toBeGreaterThan(source.selfScore)
    expect(scope.sharePercent).toBeGreaterThan(quadrant.sharePercent)

    // Master subtree score equals total scene score (100% subtree share)
    expect(master.subtreeSharePercent).toBe(100)
    expect(source.subtreeScore).toBeCloseTo(source.selfScore + scope.selfScore, 4)
  })

  it('surfaces actionable anti-pattern lint warnings for downscaled @TAG sampling, heavy per-point loops, and 0-opacity active layers', () => {
    const nodes: Node[] = [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        position: { x: 0, y: 0 },
        data: { label: 'Master Output', feedback: true },
      },
      {
        id: 'producer-buffer',
        type: 'frameBuffer',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 40 },
        data: {
          label: 'Full-Res Producer',
          saveTo: '@FRAME',
          feedback: true,
        },
      },
      {
        id: 'scope-in-producer',
        type: 'duperscopeNode',
        parentId: 'producer-buffer',
        position: { x: 20, y: 40 },
        data: {
          label: 'Heavy Trig Scope',
          opacity: 0,
          initCode: 'n = 400;',
          pointCode:
            'x = sin(i) + cos(i) + tan(i * 0.5); y = sqrt(abs(i)) + pow(i, 2) + #FFT(i);',
        },
      },
      {
        id: 'consumer-q1',
        type: 'frameBuffer',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 120 },
        data: {
          label: 'Quadrant 1',
          loadFrom: '@FRAME',
          scale: 0.5,
        },
      },
    ]

    const map = computeSceneLayerComplexity(nodes, 1.0)
    const producer = map.get('producer-buffer')!
    const scope = map.get('scope-in-producer')!

    // Producer should warn about all consumers sampling @FRAME at <= 0.5x scale and multi-pass feedback overhead
    expect(producer.lintWarnings.some((w) => /0\.5x|resolution/i.test(w))).toBe(true)
    expect(producer.lintWarnings.some((w) => /feedback|FBO/i.test(w))).toBe(true)

    // Scope should warn about 0 opacity without being bypassed and heavy per-point trig/DSP calls
    expect(scope.lintWarnings.some((w) => /opacity|bypass/i.test(w))).toBe(true)
    expect(scope.lintWarnings.some((w) => /point|frame/i.test(w))).toBe(true)
  })
})
