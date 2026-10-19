# Implementation Plan: Track 1 — Minimal Reactive Canvas & Audio Testbed

## Phase 1: Project Scaffolding, Tooling & Two-Plane Render Loop

- [x] Task: Project Scaffolding with Vite, React 19, TypeScript, and Tailwind CSS (6e36881)
  - [x] Initialize Vite React TypeScript project with Tailwind CSS configuration and Track 1 dependencies (`three`, `zustand`, `lucide-react`)
  - [x] Configure Vitest and React Testing Library setup with lightweight `RendererLike`, `Scheduler`, and `createAudioContext` dependency-injection test fixtures
  - [x] Configure ESLint and Prettier per `code_styleguides/typescript.md`
  - [x] Configure `vite.config.ts` (`base: '/visualitzacio/'`) and GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated GitHub Pages deployment
- [ ] Task: Two-Plane Architecture Skeleton, `FrameContext` & `RenderEngine` (TDD)
  - [ ] Write unit tests for pre-allocated `FrameContext` mutation (`$TIME`, `$DT` clamped $\le 0.1$, `$FRAME`, `$FPS`, `$WIDTH`, `$HEIGHT`, `$ASPECT`, `$PIXEL_RATIO`), `VisualNode` pass lifecycle, and `RenderEngine` loop pacing against `targetFps` and `resolutionScale`
  - [ ] Implement `RenderEngine` core class managing `requestAnimationFrame`, throttled FPS telemetry subscriber (250–500ms), 150ms debounced resize with clamped DPR ($\le 2$) scaled by `resolutionScale`, and `webglcontextlost` / `webglcontextrestored` listeners
  - [ ] Create Zustand store (`useAppStore`) for playback state, HUD settings (`showFpsOverlay`: default `true`, `isPresetSettingsOpen`: default `false`), and preset-wide performance settings (`targetFps`: default `60`, `resolutionScale`: default `1.0`) ensuring zero audio/RAF tick re-renders
- [ ] Task: Phase 1 Visual Checkpoint — Live 60 FPS Canvas & FPS Badge
  - [ ] Mount the Three.js canvas with a baseline `$TIME`-driven rotating geometric shape and the live FPS badge so Phase 1 is immediately visually inspectable in the browser and deployed to GitHub Pages

---

## Phase 2: Reactive Web Audio Pipeline & Feature Extraction

- [ ] Task: Audio Feature Extraction & DSP Utilities (TDD)
  - [ ] Write unit tests for logarithmic frequency band aggregation (`$BASS` 20–250 Hz, `$MID` 250–4000 Hz, `$TREBLE` 4000–16000 Hz via $f = 20 \times 10^{3x}$), time-domain waveform extraction ($[-1.0, 1.0]$), and stereo channel splitting (`ChannelSplitterNode`)
  - [ ] Write unit tests for binary `$BEAT` transient detection (`1.0` on beat frame, `0.0` otherwise) with inter-beat cooldown (`100ms`–`150ms`) and rolling `$BPM` estimation (default `120.0`)
  - [ ] Write unit tests for normalized `$RMS` energy ($[0.0, 1.0]$) with asymmetric attack/decay smoothing
  - [ ] Implement `AudioAnalyzer` utility class populating the pre-allocated `FrameContext` from raw Web Audio `AnalyserNode` buffers
- [ ] Task: Web Audio Manager & Source Selector (TDD)
  - [ ] Write tests for audio source switching (bundled sample vs. microphone), seek/loop controls, `AudioContext.resume()` user-gesture autoplay unlock, and graceful microphone permission denial handling
  - [ ] Implement `AudioManager` with injectable `createAudioContext`, sample player (`import.meta.env.BASE_URL` aware), and uncompressed `getUserMedia` capture (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`)
  - [ ] Bundle or procedurally synthesize a lightweight rhythmic audio test loop
- [ ] Task: Phase 2 Visual Checkpoint — Live Audio Telemetry Meter Bars
  - [ ] Render live debug meter bars on the canvas for `$BASS`, `$MID`, `$TREBLE`, `$RMS`, and binary `$BEAT` flash so audio reactivity can be visually verified in the browser at the end of Phase 2

---

## Phase 3: Live Reactive Scene, Clickable FPS Badge & Preset Performance Settings

- [ ] Task: Immediate Reactive Test Visual `VisualNode` (TDD)
  - [ ] Write tests verifying that the reactive `VisualNode` consumes `FrameContext` telemetry to modulate scale (`$BASS` / `$BEAT`), rotation (`$TIME` / `$DT`), and color (`$MID` / `$TREBLE`) without triggering React re-renders
  - [ ] Implement the audio-reactive Three.js scene in normalized $[-1.0, 1.0]$ coordinates
- [ ] Task: Top Toolbar, Clickable FPS Badge & Preset-Wide Settings Popover (TDD)
  - [ ] Write tests for play/pause/seek/loop controls, microphone toggle with permission error notice, FPS badge visibility switch, FPS badge color shift (cyan when $\ge$ `targetFps`, **amber immediately when `fps < targetFps`**, red when $< 50\%$ of `targetFps`), and clicking the FPS badge to open the Preset-Wide Settings popover
  - [ ] Write tests verifying that changing `targetFps` or `resolutionScale` (`1.0`, `0.75`, `0.5`, `0.25`) in the Preset-Wide Settings popover updates `useAppStore` and reconfigures `RenderEngine`
  - [ ] Implement the top toolbar, clickable glassmorphic FPS badge, and Preset-Wide Performance Settings popover
- [ ] Task: Track Verification & Milestone Demonstration Checkpoint
  - [ ] Verify clean production build via `npm run build` and 100% passing test suite via `npm test`
  - [ ] Launch browser via `npm run dev` and verify 60 FPS audio-reactive visuals, amber FPS badge state when under target, and interactive `target_fps` / `resolution_scale` controls
