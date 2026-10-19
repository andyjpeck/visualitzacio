# Specification: Track 1 — Minimal Reactive Canvas & Audio Testbed

## 1. Overview
This track delivers the foundational scaffold and first end-to-end inspectable visual milestone of Visualització. It establishes the Two-Plane execution model decoupling React UI from a 60+ FPS Three.js render loop, builds the core Web Audio processing pipeline (bundled audio sample player and microphone capture), extracts logarithmic frequency bands and binary beat transients, and mounts an interactive canvas with a toggleable FPS HUD.

At the completion of this track, **you will be able to run the app in your browser, play audio or use your microphone, and observe a live reactive graphic pulsing tightly to the music at 60 FPS**.

---

## 2. Functional Requirements

### 2.1 Project Infrastructure & Two-Plane Scaffold
- Initialize Vite + React 19 + TypeScript + Tailwind CSS with Vitest and testing setup.
- Configure ESLint, Prettier, and GitHub Actions CI/CD (`.github/workflows/deploy.yml`) targeting GitHub Pages.
- Enforce the Two-Plane decoupling:
  - **State Plane (React 19 + Zustand `useAppStore`):** Manages audio playback state (play/pause, volume, input source) and HUD settings (`showFpsOverlay`). Does not re-render on RAF ticks or audio data updates (<10 Hz).
  - **Render Data Plane (Three.js `RenderEngine`):** Executes purely in `requestAnimationFrame` at 60+ FPS with zero React re-render overhead. Uses pre-allocated `Float32Array` buffers.

### 2.2 Reactive Audio Engine Pipeline
- Web Audio `AudioContext` with standard user-gesture autoplay unlock (`audioContext.resume()`).
- Dual audio source selector:
  1. **Bundled Audio Sample Player:** Lightweight default ambient/rhythm audio test sample with play, pause, seek, and loop controls.
  2. **Microphone / Line-in Stream:** Uncompressed `getUserMedia` capture with raw musical settings (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`).
- Real-time DSP feature extraction (`AudioAnalyzer`):
  - Logarithmic frequency binning: `$BASS` (20–250 Hz), `$MID` (250–4000 Hz), `$TREBLE` (4000–16000 Hz) normalized to $[0.0, 1.0]$.
  - Exponential frequency mapping ($f = 20 \times 10^{3x}$ for $x \in [0.0, 1.0]$).
  - Time-domain waveform data extraction normalized to $[-1.0, 1.0]$.
  - Normalized RMS volume energy ($[0.0, 1.0]$).
  - Instantaneous binary `$BEAT` transient detection (`1.0` on beat frames, `0.0` otherwise).
  - Elapsed `$TIME` counter in fractional seconds and frame count `$FRAME`.

### 2.3 Live Reactive Viewport & FPS HUD
- Full-screen or framed preview canvas rendering a responsive Three.js WebGL scene.
- **Immediate Reactive Visual Testbed:**
  - An unlit visual test graphic (reactive geometric mesh or bundled test graphic) rendered on screen.
  - Modulated directly in real time by the audio telemetry:
    - Scale pulses with `$BASS` and binary `$BEAT`.
    - Rotation advances smoothly with `$TIME`.
    - Color tinting shifts with `$MID` and `$TREBLE`.
- **Toggleable FPS Counter Overlay:**
  - Monospaced badge displaying current rendering FPS in the viewport.
  - Visible by default; toggleable via a UI switch in the top toolbar.
  - Telemetry updated via a throttled subscriber (250–500ms) with zero React component re-renders.

---

## 3. Non-Functional Requirements
- **Performance:** Steady 60+ FPS rendering loop with zero memory allocation / garbage collection pauses during playback.
- **Audio Latency:** Web Audio buffer analysis latency under 16ms.
- **Fault-Tolerance:** Graceful handling of microphone permission denial and audio context suspension.

---

## 4. Acceptance Criteria
1. The web application builds cleanly via `npm run dev` and passes `npm test` and linting in Vitest.
2. The user can play/pause the bundled audio sample or toggle the microphone input.
3. Web Audio analyzer accurately computes `$BASS`, `$MID`, `$TREBLE`, and RMS energy into normalized $[0.0, 1.0]$ ranges.
4. Binary `$BEAT` transient flag evaluates strictly to `1.0` on beat frames and `0.0` on non-beat frames.
5. The live Three.js preview canvas renders at 60+ FPS, visibly modulating its scale, rotation, and color to the live audio signals.
6. The FPS counter badge is visible by default on the preview canvas, displays an accurate frame rate, is toggleable on/off via the toolbar, and triggers zero React re-renders.

---

## 5. Out of Scope for Track 1
- Full mathematical expression evaluator (`expr-eval`) and custom formula inputs (Track 2).
- Frame Buffer container hierarchy, ping-pong feedback trails, and named offscreen buffer routing (Track 3).
- React Flow visual node graph and universal `f(x)` parameter inspector (Track 4).
- Duperscope generative curve component (Track 5).
- Custom GLSL shader editor passes (Track 6).
- Web MIDI API hardware controller mapping (Track 7).
