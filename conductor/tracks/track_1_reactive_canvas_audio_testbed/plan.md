# Implementation Plan: Track 1 — Minimal Reactive Canvas & Audio Testbed

## Phase 1: Project Scaffolding, Tooling & Two-Plane Render Loop

- [ ] Task: Project Scaffolding with Vite, React 19, TypeScript, and Tailwind CSS
  - [ ] Initialize Vite React TypeScript project with Tailwind CSS configuration
  - [ ] Configure Vitest and React Testing Library setup with WebGL2 and Web Audio mock fixtures
  - [ ] Configure ESLint and Prettier per `code_styleguides/typescript.md`
  - [ ] Configure `vite.config.ts` base path and GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated GitHub Pages deployment
- [ ] Task: Two-Plane Architecture Skeleton & RenderEngine (TDD)
  - [ ] Write unit tests for decoupled Engine Loop controller (state subscriber vs. pure RAF ticker) and throttled FPS counter
  - [ ] Implement `RenderEngine` core class managing `requestAnimationFrame`, throttled FPS telemetry, and Three.js canvas mount
  - [ ] Create Zustand store for UI/playback state (`useAppStore`) with `showFpsOverlay` toggle preference (default `true`) ensuring zero audio/RAF tick re-renders
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 2: Reactive Web Audio Pipeline & Feature Extraction

- [ ] Task: Audio Feature Extraction & DSP Utilities (TDD)
  - [ ] Write unit tests for logarithmic frequency band aggregation (`$BASS`, `$MID`, `$TREBLE`), time-domain waveform data extraction, and channel splitting
  - [ ] Write unit tests for binary `$BEAT` detection (evaluating to `1.0` on beat frame, `0.0` otherwise)
  - [ ] Write unit tests for RMS energy smoothing and attack/decay calculations
  - [ ] Implement `AudioAnalyzer` utility class computing normalized values from raw Web Audio `AnalyserNode`
- [ ] Task: Web Audio Manager & Source Selector (TDD)
  - [ ] Write tests for audio source switching (bundled sample vs. microphone) and user-gesture autoplay unlock
  - [ ] Implement `AudioManager` with autoplay policy unlock, sample player, and uncompressed `getUserMedia` stream capture
  - [ ] Bundle a lightweight default ambient/rhythm audio test sample
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 3: Live Preview Canvas, Reactive Testbed & FPS HUD Checkpoint

- [ ] Task: Immediate Reactive Test Visual (TDD)
  - [ ] Write tests verifying that `RenderEngine` dynamically consumes live `AudioAnalyzer` telemetry to mutate visual mesh properties without triggering React re-renders
  - [ ] Implement reactive test scene in Three.js (pulsing geometry/graphic whose scale tracks `$BASS` / `$BEAT`, rotation tracks `$TIME`, and color tint tracks `$MID` / `$TREBLE`)
- [ ] Task: UI Shell, Toolbar Controls & FPS HUD (TDD)
  - [ ] Write tests for play/pause audio toggle, microphone input toggle, and FPS overlay switch
  - [ ] Implement clean top toolbar with audio playback controls, mic button, and FPS counter toggle
  - [ ] Mount the live Three.js canvas viewport with the glassmorphic FPS badge overlay
- [ ] Task: Track Verification & Milestone Demonstration Checkpoint
  - [ ] Verify clean build via `npm run build`
  - [ ] Run test suite via `npm test` verifying 100% passing tests
  - [ ] Launch browser via `npm run dev` and perform interactive inspection: verify 60 FPS counter and audio pulse reactivity on screen
