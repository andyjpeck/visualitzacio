# Specification: Track 17 — Preset State Isolation & Master Buffer Parameter Reset on Preset Switch

## 1. Overview
When switching between presets (specifically loading `Quadrant Mirrored Spectrum` which binds a beat-reactive dynamic formula to `rotation`, followed by `Rainy Ocean Sunset Reveal` which omits `rotation`), the master output buffer leaks the previously bound dynamic expression and cached rotation value. The sunset preset visually twists to the beat even though it contains no rotation expression.

This track eliminates all preset parameter, transform, and buffer leakage on preset transitions by establishing rigorous default resets in the visual node sync pass, fixing `bindExpression` to reset cached numerical values on unbind, and clearing stale ping-pong and named buffer pool state on preset load.

---

## 2. Functional Requirements

### FR-1: Default Parameter Fallbacks in `ViewportCanvas` Sync Pass (`src/ui/canvas/viewport-canvas.tsx`)
- When synchronizing `FrameBufferNode` instances (most critically the permanent singleton `master-frame-buffer`), do not skip omitted properties with `!== undefined` guards without applying canonical defaults:
  - `rotation`: fallback to `gNode.data.rotation ?? 0`
  - `scale`: fallback to `gNode.data.scale ?? 1`
  - `scaleX`: fallback to `gNode.data.scaleX ?? null`
  - `scaleY`: fallback to `gNode.data.scaleY ?? null`
  - `flipX`: fallback to `gNode.data.flipX ?? false`
  - `flipY`: fallback to `gNode.data.flipY ?? false`
  - `positionX`: fallback to `gNode.data.offsetX ?? gNode.data.positionX ?? 0`
  - `positionY`: fallback to `gNode.data.offsetY ?? gNode.data.positionY ?? 0`
  - `opacity`: fallback to `gNode.data.opacity ?? 1`
  - `saveTo`: fallback to `(gNode.data.saveTo as string) || null`
  - `loadFrom`: fallback to `(gNode.data.loadFrom as string) || null`
  - `inputBlendMode`: fallback to `gNode.data.inputBlendMode ? String(gNode.data.inputBlendMode) : 'none'`
  - `outputBlendMode`: fallback to `gNode.data.outputBlendMode ? String(gNode.data.outputBlendMode) : (vNode.isMaster ? 'replace' : 'none')`
  - `blendMode`: fallback to `gNode.data.blendMode ? String(gNode.data.blendMode) : 'replace'`
  - `feedback`: fallback to `Boolean(gNode.data.feedback)`

### FR-2: Numerical and Param State Reset in `FrameBufferNode.bindExpression` (`src/engine/frame-buffer/frame-buffer-node.ts`)
- In `bindExpression`, when unbinding a parameter (`expr === null || expr === undefined || expr === ''`), reset both the dynamic parameter (`*Param = null`) AND the internal numeric cached value (`*Val`):
  - `opacity`: `opacityVal = 1.0`, `opacityParam = null`
  - `scale`: `scaleVal = 1.0`, `scaleParam = null`
  - `scaleX`: `scaleXVal = null`, `scaleXParam = null`
  - `scaleY`: `scaleYVal = null`, `scaleYParam = null`
  - `flipX`: `flipXVal = false`, `flipXParam = null`
  - `flipY`: `flipYVal = false`, `flipYParam = null`
  - `rotation`: `rotationVal = 0.0`, `rotationParam = null`
  - `positionX`: `positionXVal = 0.0`, `positionXParam = null`
  - `positionY`: `positionYVal = 0.0`, `positionYParam = null`

### FR-3: Ping-Pong Render Target and Buffer Pool Clean Slate on Preset Switch
- Ensure `masterBuffer.clearBuffer()` is called on preset transition so lingering feedback pixels from previous presets do not bleed into the new scene.
- Ensure `BufferPool` clears orphaned named textures (`@NAME`) when a preset is replaced.

---

## 3. Non-Functional Requirements
- **Performance:** Parameter resets must execute only during graph change reconciliation (O(N) where N is node count in preset, typically < 20) and introduce zero overhead to the 60 FPS animation frame loop.
- **Backwards Compatibility:** All existing presets (including `quadrant-mirrored-spectrum.json` and `rainy-ocean-sunset.json`) and existing unit/roundtrip tests must continue to function and pass without alteration to preset schemas.

---

## 4. Acceptance Criteria
- [ ] Loading `Quadrant Mirrored Spectrum` followed by `Rainy Ocean Sunset Reveal` results in `masterBuffer` having `rotationVal === 0`, `rotationParam === null`, and zero angular rotation or beat twist on Master Output.
- [ ] `bindExpression('rotation', null)` or `bindExpression('rotation', 0)` resets both `rotationParam` and `rotationVal` to `0.0`.
- [ ] Switching between presets clears any residual texture mappings and ping-pong trails.
- [ ] All unit, integration, and roundtrip tests pass cleanly with no tautological assertions.
