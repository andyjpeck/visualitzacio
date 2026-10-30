# Visualització 🔮

A real-time, 60 FPS modular music visualizer engine built with WebGL (Three.js), Web Audio API, and React 19.

Visualització is designed for high-performance audio reactivity, combining mathematically sound digital signal processing with a cyberpunk aesthetic and decoupled rendering pipeline.

---

## ✨ Features

- **Two-Plane Performance Architecture**: Strict separation between the high-frequency WebGL rendering plane (60+ FPS) and low-frequency React UI plane (<10 Hz) for zero garbage-collection stutter and zero React re-renders on audio frames.
- **Dynamic Expression Engine & Parameter Binding**:
  - Sandboxed mathematical formula parser (`ExpressionEngine`) based on `expr-eval` with AST compilation caching.
  - Zero-allocation per-frame scope bindings for all system variables (`$TIME`, `$DT`, `$FRAME`, `$FPS`, `$WIDTH`, `$HEIGHT`, `$ASPECT`, `$PIXEL_RATIO`, `$BASS`, `$MID`, `$TREBLE`, `$RMS`, `$BEAT`, `$BPM`).
  - Built-in DSP functions: logarithmic `#FFT()`, normalized `#WAVEFORM()`, exponential/linear/log `#BEAT()` & `#BEAT_FRAMES()` envelopes, periodic wave generators (`#TRI`, `#SAW`, `#SQR`), and math helpers (`clamp`, `lerp`, `smoothstep`).
  - `DynamicParam<T>` abstraction enabling any component parameter to be bound to either static constants or dynamic live expressions.
- **Interactive Formula Testbed HUD**:
  - Floating, viewport-clamped draggable dialog with strict syntax validation diagnostics.
  - Direct DOM 60 FPS numerical evaluation ticker with zero React re-renders.
  - 180-frame sliding window canvas sparkline chart with dynamic `min`/`max` scaling and automatic buffer release.
  - Interactive quick-reference token insertion and curated formula preset library.
- **Modular Frame Buffer, Ping-Pong Feedback & Named Buffers**:
  - `FrameBufferNode` container managing offscreen `THREE.WebGLRenderTarget` textures and resolution scaling.
  - Dual-FBO ping-pong feedback texture swapping with zero per-frame GC allocations for AVS/MilkDrop phosphor trails and infinite tunnel vortexes.
  - Custom GLSL full-screen quad shader (`CompositingShader`) supporting 6 standard blend modes (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`).
  - Audio-reactive transform modulation: dynamic expression bindings driving decay opacity, feedback zoom scale, spiral rotation, and XY shifts.
  - Global `BufferPool` registry enabling named buffer routing (`@NAME`) between visual passes with circular dependency detection and fallback textures.
  - Built-in Frame Buffer Template Selector with 6 curated presets (Clean Slate, Analog Phosphor Trails, Infinite Feedback Vortex, 4-Corner Multi-Screen Replicator, Picture-in-Picture Echo, Beat-Pulsed Shockwave Feedback) and dirty-state confirmation guards.
  - `StaticImageNode` component for static background and overlay textures supporting aspect-ratio preservation (`cover`, `contain`, `stretch`), dynamic opacity, and BufferPool export.
- **Studio Workspace & Hierarchical Layer Tree**:
  - Resizable split-view studio workspace (`StudioSplitView`) pairing the 3D playback viewport (left) with a vertically stacked right column (Parameter Inspector on top, Layer Tree on bottom) with dual dividers, min-width/height clamping, and persistent ratios in `localStorage`.
  - Dedicated **Hierarchical Layer Tree Outliner** (`WorkspacePane` + `LayerTreeView`): interactive drag-and-drop layer reordering and reparenting, inline label renaming on double-click, container expand/collapse preserving Master Output, execution order badges, and semantic buffer tag highlighting (`@NAME`).
  - Underlying `@xyflow/react` visual node graph engine (`VisualNodeGraph`) with Dagre hierarchical auto-layout, container bounds enforcement, and connection cycle prevention.
  - Floating playback toolbar (`Toolbar`), FPS badge, and audio telemetry overlay positioned within the 3D viewport canvas, featuring responsive auto-scaling (`ResizeObserver`) to prevent clipping on narrow viewports.
  - Universal portal-based modal dialog system (`BaseModalDialog` rendered via `createPortal` at `z-[9999]`) with backdrop blur overlay escaping nested pane stacking contexts.
- **100-Step History & Undo/Redo Engine**:
  - 100-step Semantic Action Delta history stack (`UndoRedoManager`) tracking node hierarchy mutations, connection routing, and parameter adjustments with minimal memory footprint.
  - Continuous input coalescing for 60 FPS slider adjustments and 500ms debounced formula keystrokes, ensuring a single gesture yields exactly one undoable step.
  - Global keyboard shortcut bindings (`Ctrl+Z`, `Cmd+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) with text input focus protection and tactile toolbar controls.
- **Preset Serialization & Import/Export Suite**:
  - Standardized JSON preset schema (`PresetSchema` v1) encoding metadata, performance configurations, audio frequency bands, ping-pong feedback settings, and pure topological component hierarchies without ephemeral pixel coordinates.
  - Complete import and export pipeline: download `.json` preset files, copy preset JSON to clipboard, load via file input, paste from clipboard (`Ctrl+V`), and drag-and-drop `.json` files directly onto the 3D viewport canvas.
  - Automatic DAG layout executed upon preset loading for pristine visual presentation.
- **Universal Parameter Inspector & `f(x)` Expressions**:
  - Docked inspector panel with single-column layout, parameter and dropdown tooltips, and component preset selector (`ComponentPresetSelector`) with dirty-state confirmation guards.
  - Seamless toggle between tactile fixed controls and dynamic mathematical expressions (`ParameterRow`) with AST formula preservation.
  - Inline syntax validation and keyboard-navigable autocomplete (`ExpressionAutocomplete`) on `$` (variables) and `#` (functions).
  - Direct image file uploads and drag-and-drop dropzone for `StaticImageNode` with live thumbnail preview and Base64 JSON encoding.
- **Multimodal Audio Engine**:
  - **Sample**: Bundled procedural electronic drum loop with sub-bass kick drops, noise-burst snares, and hi-hats.
  - **File**: Drag-and-drop or select any local audio file (`.mp3`, `.wav`, `.ogg`, `.flac`) with 60 FPS track seeking and duration display.
  - **Mic**: Live uncompressed microphone capture with 3.5x preamp boost for acoustic and room listening.
- **Real-Time DSP Telemetry**:
  - Logarithmic frequency band extraction: **Bass** (20–250 Hz), **Mid** (250–4000 Hz), **Treble** (4000–16000 Hz) with customizable boundaries.
  - Asymmetric attack/decay RMS amplitude metering.
  - Transient detection with instantaneous `$BEAT` flags and rolling `$BPM` counter.
- **Dynamic 3D Geometry**:
  - Prominent multifaceted icosahedron crystal with glowing neon emissive core.
  - High-frequency outer wireframe lattice.
  - Orbiting cyberpunk halo ring with multi-point specular neon lighting.
- **Performance Tuning**:
  - Preset settings modal for custom target FPS (30, 60, 120), internal resolution scaling (1.0x, 0.75x, 0.5x, 0.25x), and live feedback tuning.

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
    ├── assets/            # Global theme tokens and assets
    ├── audio/             # Web Audio graph, DSP FFT analysis, and beat synthesis
    ├── contracts/         # TypeScript interfaces, FrameContext, and engine contracts
    ├── engine/            # 60 FPS Two-Plane RenderEngine, scheduler, and 3D scenes
    │   ├── expressions/   # Mathematical parser, AST compiler, tokens, validator, and DSP functions
    │   ├── frame-buffer/  # FrameBufferNode, dual-FBO ping-pong, CompositingShader, BufferPool, and templates
    │   ├── nodes/         # Reusable visual nodes (StaticImageNode)
    │   └── presets/       # Schema-validated Preset serializer, deserializer, and roundtrip engine
    ├── test/              # Vitest test setup and headless mocks (AudioContext, WebGL)
    │   └── fixtures/      # Reusable mock factories
    └── ui/                # React 19 user interface
        ├── canvas/        # Viewport canvas mount and ResizeObserver
        ├── dialogs/       # Reusable portal BaseModalDialog shell and stack history navigation
        ├── expressions/   # Sparkline canvas, formula input, quick-reference, and preset catalog
        ├── graph/         # Interactive visual node graph, custom node cards, and DAG auto-layout
        ├── history/       # 100-step immutable JSON history engine and undo/redo keyboard shortcuts
        ├── hooks/         # Viewport dialog dragging, Escape key, and preset drag-and-drop/paste listeners
        ├── hud/           # Real-time audio telemetry overlay, FPS badge, and formula testbed
        ├── inspector/     # Docked parameter inspector, ParameterRow, and autocomplete
        ├── settings/      # Preset performance configuration modal and DSP boundary tuning
        ├── store/         # Zustand global state store
        ├── studio/        # Studio split-view workspace, dividers, WorkspacePane (Layers + JSON tabs), and PresetJsonTab
        ├── toolbar/       # Floating transport, audio source selection, seek bar, and responsive auto-scaling toolbar
        └── tree/          # Hierarchical Layer Tree outliner with drag-and-drop reordering
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

Runs all 269+ unit and component tests via Vitest:

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
