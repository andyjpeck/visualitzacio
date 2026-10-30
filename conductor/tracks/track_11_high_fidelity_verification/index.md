# Track 11: High-Fidelity Verification Overhaul

This track delivers end-to-end verification infrastructure to eradicate the "Green Test Mirage" across Visualització's WebGL graphics engine and React UI shell.

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Requirements for Playwright actionability checks, WebGL non-empty pixel smoke tests, React Portal modal stacking guarantees, and 3-tier Conductor verification gates.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased execution plan covering dialog portal refactoring, pipeline integration smoke tests, Playwright setup, and Conductor quality gate synchronization.
- [**Metadata (`metadata.json`)**](./metadata.json): GitHub issue linkage (#9) and track status.

## Key Deliverables

1. **Modal & Dialog Stacking Protection (React Portal):** Ensure all dialogs, popovers, and menus are mounted into `document.body` or `#modal-root` with explicit high z-index stacking layers, preventing occlusion by full-screen canvases or sibling containers.
2. **WebGL Non-Empty Pixel & Pipeline Smoke Tests:** End-to-end integration tests that load presets with active visual nodes (`DuperscopeNode`, `FrameBufferNode`, `StaticImageNode`), invoke `node.update(context)`, and assert that materials compile without WebGL errors and render non-empty geometry.
3. **Playwright Real-Browser Actionability Suite:** Headless Chromium E2E tests verifying pointer-event actionability, menu clicking, dialog opening, and zero browser console errors.
4. **Conductor 3-Tier Verification Gates:** Update Conductor workflow guidelines to mandate Unit + Pipeline Smoke + Visual Inspection before any track can be marked complete.
