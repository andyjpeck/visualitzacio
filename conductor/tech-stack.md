# Technology Stack: Visualització

## 1. Core Runtime & Tooling
- **Language:** TypeScript (strict mode)
- **Build Tool & Bundler:** Vite (with `vite-plugin-glsl` for hot-reloading GLSL vertex and fragment shaders)
- **Package Manager:** npm

## 2. Frontend Framework & Interface
- **Framework:** React 19
- **Styling:** Tailwind CSS (utility-first styling with custom CSS variables for runtime theme switching)
- **Icons:** Lucide React
- **Node Graph Pipeline UI:** `@xyflow/react` (React Flow) for modular component chaining, custom port handles, mini-map, and canvas navigation
- **State Management:** Zustand (ultra-lightweight, decoupled reactive state for audio telemetry and node graph pipeline synchronization)

## 3. Graphics, Shaders & Rendering Pipeline
- **3D / 2D Engine:** Three.js (WebGL 2.0 rendering context)
- **Shaders:** Custom GLSL (OpenGL Shading Language) fragment and vertex post-processing passes
- **Canvas Rendering:** Dedicated offscreen / dedicated render loop decoupled from React state to ensure uncompromised 60+ FPS

## 4. Audio Engine & Hardware Integration
- **Audio Processing:** Native Web Audio API (`AudioContext`, `AnalyserNode` for real-time FFT frequency spectrum and time-domain waveform analysis, custom RMS energy and beat/transient detection)
- **Audio Input:** `getUserMedia` (microphone/line-in), HTML5 Audio / File API (local MP3/WAV/FLAC playback), and `getDisplayMedia` (system/tab audio stream capture)
- **Hardware Integration:** Web MIDI API (`navigator.requestMIDIAccess`) with dynamic MIDI Learn and CC parameter binding

## 5. Expression & Math Engine
- **Formula Evaluator:** `expr-eval` (safe, high-speed mathematical expression parser without dangerous `eval()`, supporting custom audio-reactive variables: `t`, `bass`, `mid`, `treble`, `rms`, `fft[i]`)

## 6. Storage & Architecture
- **Architecture:** Client-Side Single Page Application (SPA)
- **Persistence (MVP):** IndexedDB (via `idb-keyval`) and LocalStorage for preset storage and theme preferences, paired with JSON preset import/export
- **Roadmap / Future:** Backend cloud sync (PostgreSQL/Supabase or Firebase) for user accounts and community preset sharing

## 7. Testing & Quality Assurance
- **Unit & Integration Testing:** Vitest + React Testing Library
- **Linting & Formatting:** ESLint + Prettier
