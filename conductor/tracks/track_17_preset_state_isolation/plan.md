# Implementation Plan: Track 17 — Preset State Isolation & Master Buffer Parameter Reset on Preset Switch

## Phase 1: TDD Foundation — Parameter Reset & Sequential Preset Loading Tests
- [x] Task 1.1: Add unit test in `src/engine/frame-buffer/frame-buffer-node.test.ts` verifying `bindExpression` resets both `*Param` and `*Val` to defaults when given `null`, `undefined`, or empty string.
- [x] Task 1.2: Add integration test in `src/ui/canvas/viewport-canvas.test.tsx` verifying sequential preset load (`Quadrant Mirrored Spectrum` -> `Rainy Ocean Sunset Reveal`) completely resets `masterBuffer`'s rotation formula and values to `0.0` with no beat reactivity.

## Phase 2: Engine & Viewport Implementation
- [x] Task 2.1: Update `FrameBufferNode.bindExpression` in `src/engine/frame-buffer/frame-buffer-node.ts` to reset `*Val` to canonical defaults (`rotationVal = 0.0`, `scaleVal = 1.0`, etc.) when unbinding.
- [x] Task 2.2: Refactor `src/ui/canvas/viewport-canvas.tsx` node synchronization to apply schema defaults for omitted properties on `FrameBufferNode` instances (especially `master-frame-buffer`) and clear ping-pong/named buffer residues on preset change.
- [x] Task 2.3: Run unit and integration tests to ensure green status across all test suites.

## Phase 3: Verification & Track Wrap-up
- [x] Task 3.1: Run full test suite (`npm test`) and lint check (`npm run lint src`).
- [x] Task 3.2: Update `conductor/tracks.md` and track metadata to mark Track 17 complete.
