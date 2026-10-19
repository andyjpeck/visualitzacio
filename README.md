# Visualització 🔮

A real-time, 60 FPS modular music visualizer engine built with WebGL (Three.js), Web Audio API, and React 19.

Visualització is designed for high-performance audio reactivity, combining mathematically sound digital signal processing with a cyberpunk aesthetic and decoupled rendering pipeline.

---

## ✨ Features

- **Two-Plane Performance Architecture**: Strict separation between the high-frequency WebGL rendering plane (60+ FPS) and low-frequency React UI plane (<10 Hz) for zero garbage-collection stutter and zero React re-renders on audio frames.
- **Multimodal Audio Engine**:
  - **Sample**: Bundled procedural electronic drum loop with sub-bass kick drops, noise-burst snares, and hi-hats.
  - **File**: Drag-and-drop or select any local audio file (`.mp3`, `.wav`, `.ogg`, `.flac`) with 60 FPS track seeking and duration display.
  - **Mic**: Live uncompressed microphone capture with 3.5x preamp boost for acoustic and room listening.
- **Real-Time DSP Telemetry**:
  - Logarithmic frequency band extraction: **Bass** (20–250 Hz), **Mid** (250–4000 Hz), **Treble** (4000–16000 Hz).
  - Asymmetric attack/decay RMS amplitude metering.
  - Transient detection with instantaneous `$BEAT` flags and rolling `$BPM` counter.
- **Dynamic 3D Geometry**:
  - Prominent multifaceted icosahedron crystal with glowing neon emissive core.
  - High-frequency outer wireframe lattice.
  - Orbiting cyberpunk halo ring with multi-point specular neon lighting.
- **Performance Tuning**:
  - Preset settings modal for custom target FPS (30, 60, 120, 144) and internal resolution scaling (1.0x, 0.75x, 0.5x, 0.25x).

---

## 📂 Project Directory Structure

```text
visualitzacio/
├── component_proposals/   # Architectural design specs for visualizer components
├── conductor/             # Conductor++ orchestration, tracks, and style guides
│   ├── code_styleguides/  # TypeScript and component coding conventions
│   └── tracks/            # Track execution plans and task specifications
├── public/                # Static public assets served by Vite
└── src/                   # Core frontend application source code
    ├── assets/            # Global stylesheets (Tailwind CSS 4) and theme tokens
    ├── audio/             # Web Audio graph, DSP FFT analysis, and beat synthesis
    ├── contracts/         # TypeScript interfaces, FrameContext, and engine contracts
    ├── engine/            # 60 FPS Two-Plane RenderEngine, scheduler, and 3D scenes
    ├── test/              # Vitest test setup and headless mocks (AudioContext, WebGL)
    │   └── fixtures/      # Reusable mock factories
    └── ui/                # React 19 user interface
        ├── canvas/        # Viewport canvas mount and ResizeObserver
        ├── hud/           # Real-time audio telemetry overlay and FPS badge
        ├── settings/      # Preset performance configuration modal
        ├── store/         # Zustand global state store
        └── toolbar/       # Top floating glassmorphic transport & seek toolbar
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
git clone https://github.com/andyjpeck/visualitzacio.git
cd visualitzacio
npm install
```

### Development Server

```bash
npm run dev
```

Visit [http://localhost:5173/visualitzacio/](http://localhost:5173/visualitzacio/) in your browser.

### Test Suite

Runs all 55+ unit and component tests via Vitest:

```bash
npm test
```

### Linting

Runs Oxlint across the entire codebase:

```bash
npm run lint
```

### Production Build

Typechecks with `tsc` and bundles with Vite:

```bash
npm run build
```

---

## 📜 License

MIT
