# Specification: Track 1 — Minimal Reactive Canvas & Audio Testbed

## 1. Overview
This track delivers the foundational scaffold and first end-to-end inspectable visual milestone of Visualització. It establishes the Two-Plane execution model decoupling React UI from a 60+ FPS Three.js render loop, builds the core Web Audio processing pipeline (bundled audio sample player and microphone capture), extracts logarithmic frequency bands and binary beat transients into a pre-allocated `FrameContext`, and mounts an interactive canvas with a clickable, color-coded FPS HUD connected to Preset-Wide Performance Settings (`target_fps` and `resolution_scale`).

Every phase in Track 1 ends with a concrete, visually inspectable checkpoint in the browser, culminating in a live audio-reactive scene pulsing tightly to music at the target frame rate.

---

## 2. Functional Requirements

### 2.1 Project Infrastructure, Two-Plane Scaffold & Testability Seams
- Initialize Vite + React 19 + TypeScript + Tailwind CSS with Vitest and React Testing Library setup.
- Configure ESLint, Prettier, and GitHub Actions CI/CD (`.github/workflows/deploy.yml`) targeting GitHub Pages (`base: '/visualitzacio/'`).
- Enforce the Two-Plane decoupling:
  - **State Plane (React 19 + Zustand `useAppStore`):** Manages audio playback state (play/pause, volume, input source, permission/error status), HUD settings (`showFpsOverlay`, `isPresetSettingsOpen`), and preset-wide performance settings (`targetFps`: default `60`, `resolutionScale`: default `1.0` with options `1.0`, `0.75`, `0.5`, `0.25`). Does not re-render on RAF ticks or audio data updates (<10 Hz).
  - **Render Data Plane (Three.js `RenderEngine`):** Executes purely in `requestAnimationFrame` paced to `targetFps` with zero React re-render overhead. Uses pre-allocated `Float32Array` buffers and a single pre-allocated `FrameContext` object mutated in-place each frame.
- **Forward-Compatible & Testable Architecture Seams:**
  - **`FrameContext` Object:** Pre-allocated structure holding all per-frame system variables (`$TIME`, `$DT`, `$FRAME`, `$FPS`, `$WIDTH`, `$HEIGHT`, `$ASPECT`, `$PIXEL_RATIO`, `$BASS`, `$MID`, `$TREBLE`, `$RMS`, `$BEAT`, `$BPM`) so Track 2's `expr-eval` evaluator can bind directly to the same object with zero refactoring.
  - **`VisualNode` Pass Interface:** Minimal lifecycle interface (`init(ctx)`, `resize(w, h, dpr)`, `update(frameContext)`, `dispose()`) implemented by Track 1's test visual so Track 3's `FrameBufferNode` can wrap children without rewriting `RenderEngine`.
  - **Dependency Injection for Headless Unit Testing:** `RenderEngine` accepts an injectable `RendererLike` interface and `Scheduler` (`requestAnimationFrame` / `performance.now`), and `AudioManager` accepts an injectable `createAudioContext` factory so all engine logic is 100% unit-testable in Vitest + `jsdom` without brittle WebGL2 canvas shims.

### 2.2 Reactive Audio Engine Pipeline
- Web Audio `AudioContext` with standard user-gesture autoplay unlock (`audioContext.resume()`).
- Dual audio source selector:
  1. **Bundled Audio Sample Player:** Procedural or lightweight CC0 rhythmic test loop (`import.meta.env.BASE_URL` aware) with play, pause, seek, and loop controls.
  2. **Microphone / Line-in Stream:** Uncompressed `getUserMedia` capture with raw musical settings (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`).
- Real-time DSP feature extraction (`AudioAnalyzer`):
  - Logarithmic frequency binning: `$BASS` (20–250 Hz), `$MID` (250–4000 Hz), `$TREBLE` (4000–16000 Hz) normalized to $[0.0, 1.0]$.
  - Exponential frequency mapping ($f = 20 \times 10^{3x}$ for $x \in [0.0, 1.0]$).
  - Time-domain waveform data extraction normalized to $[-1.0, 1.0]$ and stereo channel splitting (`ChannelSplitterNode` for Left, Right, and Mono mixdown).
  - Normalized `$RMS` volume energy ($[0.0, 1.0]$) with asymmetric attack/decay smoothing.
  - Instantaneous binary `$BEAT` transient detection (`1.0` on beat frames, `0.0` otherwise) with a minimum inter-beat cooldown (`100ms`–`150ms`) so a single kick transient fires on a single frame.
  - Estimated `$BPM` tempo variable (initialized to `120.0` default and updated via rolling inter-beat intervals).
  - Elapsed `$TIME` counter in fractional seconds, clamped frame delta `$DT` (`Math.min(dt, 0.1)`), and integer `$FRAME` counter.

### 2.3 Live Reactive Viewport, Clickable FPS Badge & Preset-Wide Settings
- Responsive Three.js WebGL preview canvas with 150ms debounced resize handling, DPR clamping (`Math.min(window.devicePixelRatio, 2)`), and internal render resolution multiplied by `resolutionScale`.
- **Immediate Reactive Visual Testbed (`VisualNode`):**
  - Renders a live audio-reactive geometric scene in normalized $[-1.0, 1.0]$ coordinates.
  - Modulated in real time by `FrameContext` telemetry:
    - Scale pulses with `$BASS` and binary `$BEAT`.
    - Rotation advances smoothly with `$TIME` and `$DT`.
    - Color tinting shifts with `$MID` and `$TREBLE`.
- **Clickable, Color-Coded FPS Counter Badge & Preset Settings Popover:**
  - Monospaced glassmorphic badge in the corner of the preview canvas displaying measured FPS (updated via a throttled 250–500ms subscriber with zero React re-renders).
  - Visible by default and toggleable via the top toolbar.
  - **Dynamic Color States:**
    - **Nominal (Cyan / Green):** Measured FPS $\ge$ `targetFps` (within a 1 FPS rounding tolerance).
    - **Under Target (Amber):** Shifts immediately to amber (`#ffb800`) **as soon as measured FPS falls below `targetFps`** (`fps < targetFps`).
    - **Severe Drop (Red):** Shifts to crimson (`#ff2a6d`) if measured FPS drops below 50% of `targetFps`.
  - **Click-to-Configure Action:** Clicking the FPS badge opens the **Preset-Wide Performance Settings** popover, allowing the user to adjust `targetFps` (e.g., `60`, `30`) and `resolutionScale` (`1.0x`, `0.75x`, `0.5x`, `0.25x`) in real time.

---

## 3. Non-Functional Requirements
- **Performance:** Steady frame pacing at `targetFps` (default 60 FPS) with zero memory allocation / garbage collection pauses inside the per-frame render loop.
- **Audio Latency:** Web Audio buffer analysis latency under 16ms.
- **Fault-Tolerance:** Graceful handling and clear UI status messaging on microphone permission denial, `AudioContext` autoplay suspension, and `webglcontextlost` / `webglcontextrestored` events.

---

## 4. Acceptance Criteria
1. **Build, Lint, Test & CI/CD:** The application builds cleanly via `npm run build` (with `base: '/visualitzacio/'`), passes `npm test` and ESLint, and includes `.github/workflows/deploy.yml` for GitHub Pages deployment.
2. **Audio Source Controls & Autoplay Unlock:** The user can play, pause, seek, and loop the bundled audio sample or toggle raw microphone capture (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`), with automatic `AudioContext.resume()` on user gesture.
3. **DSP Feature Extraction:** `AudioAnalyzer` accurately computes `$BASS`, `$MID`, `$TREBLE`, and `$RMS` into normalized $[0.0, 1.0]$ ranges, extracts time-domain waveform samples in $[-1.0, 1.0]$, and populates the pre-allocated `FrameContext` (including `$TIME`, `$DT`, `$FRAME`, `$BPM`).
4. **Binary `$BEAT` Detection:** Binary `$BEAT` transient flag evaluates strictly to `1.0` on detected beat frames and `0.0` on non-beat frames, enforcing a cooldown window to prevent double-triggering on a single transient.
5. **Live 60 FPS Audio-Reactive Scene:** The Three.js preview canvas renders a `VisualNode` test scene at 60+ FPS, visibly modulating scale, rotation, and color from `FrameContext` telemetry with zero React component re-renders during RAF ticks.
6. **Clickable FPS Badge & Preset Performance Settings:** The FPS badge is visible by default (toggleable in the toolbar), turns **amber** as soon as measured FPS falls below `targetFps`, and opens the Preset-Wide Settings popover when clicked so the user can change `targetFps` and `resolutionScale` (`1.0`, `0.75`, `0.5`, `0.25`).
7. **Resilience & Viewport Scaling:** Denying microphone permission surfaces a clear non-crashing UI notice, and resizing the viewport or changing `resolutionScale` updates the internal WebGL drawing buffer dimensions (with clamped DPR $\le 2$).

---

## 5. Out of Scope for Track 1
- Full mathematical expression evaluator (`expr-eval`), `#BEAT` / `#BEAT_FRAMES` decay functions, and custom formula inputs (Track 2).
- Frame Buffer container hierarchy, ping-pong feedback trails, and named offscreen buffer routing (Track 3).
- React Flow visual node graph and universal `f(x)` parameter inspector (Track 4).
- Duperscope generative curve component (Track 5).
- Custom GLSL shader editor passes (Track 6).
- Web MIDI API hardware controller mapping (Track 7).
