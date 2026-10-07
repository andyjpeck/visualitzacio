# Product Guidelines: Visualització

## 1. Visual Identity & Aesthetic
- **Theme Architecture:** Pluggable, runtime theme system with an intuitive theme switcher.
- **Default Theme (Cyberpunk / Neon High-Contrast):** Deep void backgrounds (`#08080c`, `#10121a`) paired with vibrant neon glowing borders, dark glassmorphism, and electric indicators (cyan `#00f0ff`, magenta `#ff007f`, amber `#ffb800`).
- **Dark Studio Theme (Legibility First):** Slate and neutral dark charcoal backgrounds (`#18181b`, `#27272a`) with high-contrast neutral borders and restrained accent coloring designed for clean daylight or studio workstation legibility.
- **Typography:** High-legibility modern sans-serif paired with monospaced accents for numeric telemetry, formula editors, and MIDI assignments.

## 2. Interface Architecture & Layout
- **Split-View Workspace:** Side-by-side layout pairing a live visualizer viewport (left) with a vertically split node-graph and inspector pane (right).
- **Two Operating Modes:**
  - *Studio / Editor Mode:* Split-view with node graph, parameter inspectors, audio FFT visualizer, and MIDI mapping HUD.
  - *Live Performance Mode:* Fullscreen distraction-free canvas with auto-hiding HUD controls on mouse inactivity.
- **Tactile Modulation:** Knobs, faders, and formula inputs display live visual pulsing/deflection reflecting real-time audio reactivity.
- **FPS Counter HUD Overlay:**
  - In Studio / Editor Mode, a monospaced FPS counter badge is displayed on the live preview viewport by default (e.g., top-left corner with subtle dark glassmorphic styling).
  - Fully toggleable via a viewport toolbar switch or keyboard shortcut, with the preference persisted across sessions.
  - Automatically hidden in Live Performance Mode to ensure an uncluttered, distraction-free display.
  - Decoupled from React render cycles (updated via a throttled ref or RAF subscriber every 250–500ms) to avoid high-frequency component re-renders.
- **Master Frame Buffer Anchor & Auto-Layout:**
  - The node graph visually anchors the **Master Frame Buffer** as the permanent root container with a distinctive header/crown badge and subtle glowing boundary.
  - The Master Frame Buffer cannot be deleted, but selecting it opens its inspector, allowing the user to configure its `blend_mode` (clean slate vs. frame feedback trails), background clear color, and master transforms.
  - Presets serialize the component tree hierarchy without manual canvas coordinates; upon import, the graph executes clean automatic hierarchical layout.
- **Screen Coordinate System (Winamp AVS Standard):**
  - All visual elements, canvas quads, and spatial transformations operate in a normalized Cartesian coordinate space from `-1.0` to `1.0` with `(0.0, 0.0)` at screen center:
    - `x` spans `-1.0` (left edge) to `1.0` (right edge).
    - `y` spans `-1.0` (bottom edge) to `1.0` (top edge).
  - Position parameters (`positionX`, `positionY`) throughout all inspectors and components map directly to this normalized space.

## 3. Universal Parameter Pattern: The `f(x)` Expression Switcher
To maintain a unified, predictable visual language across all components when switching between fixed controls and dynamic formulas:
- **The `f(x)` Mode Toggle:** Every parameter row in every component inspector features an `f(x)` button adjacent to the parameter label.
- **Fixed Mode (Default) — Maps to Schema `"mode": "fixed"`:**
  - Displays standard tactile controls tailored to the data type: rotary knobs, linear faders, binary toggles, or dropdown selectors.
  - `f(x)` button appears in a subtle, neutral resting state.
- **Dynamic Expression Mode (Active) — Maps to Schema `"mode": "expression"`:**
  - Clicking `f(x)` smoothly morphs the fixed control into a monospace formula input field.
  - The `f(x)` button glows in the active theme accent color (e.g. electric cyan `#00f0ff`).
  - **Inline Autocomplete & Documentation Dropdown:**
    - Appears automatically below the cursor upon typing `$` or `#`.
    - **Variables (`$`):** Lists `$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, `$BEAT`, `$FRAME` with human-readable definitions from the [System Variables Reference](./system_variables.md).
    - **System Functions (`#`):** Lists `#FFT(...)`, `#WAVEFORM(...)`, `#BEAT()`, `#BEAT_SECONDS(...)`, `#BEAT_FRAMES(...)` with full function signatures, parameter descriptions, and return value ranges from the [System Functions Reference](./system_functions.md).
    - Full keyboard navigation (Up/Down arrow keys, Enter/Tab to select and insert with cursor positioned inside function parentheses).
  - **Expression Validation & Status Chip:** Validates syntax upon typing. Displays an evaluated checkmark or result summary chip. Invalid formulas pulse amber/red with an inline tooltip, safely retaining the previous valid frame value (or default fixed value on frame 0) without breaking rendering.

## 4. Diagnostics & Error Handling
- **Dedicated Diagnostics Console:** An integrated error and log console (capturing shader compilation issues, audio context states, buffer routing errors, and formula evaluation faults) that remains closed/collapsed by default.
- **Visual Alert Indicators:** Whenever warnings or errors are logged to the console, an unobtrusive badge or icon glows in the status bar/HUD to alert the user that diagnostics are available for inspection.
- **Tone & Terminology:** Concise, professional, and audio-engineering oriented (e.g., "Attack / Decay", "FFT Bins", "RMS Gain", "GLSL Pass", "MIDI CC").

## 5. Performance & Architecture Considerations
- **Frame Rate Target:** Consistent 60+ FPS target with minimal audio-to-visual latency (<16ms).
- **Scalability by Design:** While automated adaptive resolution scaling is a roadmap item, all core architecture and individual components must be designed from day one with degradation pathways in mind (e.g., configurable particle counts, shader complexity levels, and optional bypass switches).
- **Formula & Shader Sandboxing:** Safe formula parsing and error boundaries to prevent WebGL context loss or crashes from invalid user expressions.
