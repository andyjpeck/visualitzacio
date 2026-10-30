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
- **FPS Counter HUD Overlay & Preset Performance Settings:**
  - In Studio / Editor Mode, a monospaced FPS counter badge is displayed on the live preview viewport by default (e.g., top-left corner with subtle dark glassmorphic styling).
  - Fully toggleable via a viewport toolbar switch or keyboard shortcut, with the preference persisted across sessions.
  - Automatically hidden in Live Performance Mode to ensure an uncluttered, distraction-free display.
  - Decoupled from React render cycles (updated via a throttled ref or RAF subscriber every 250–500ms) to avoid high-frequency component re-renders.
  - **Color States & Click-to-Configure:**
    - **Nominal (Cyan / Green):** Measured FPS meets or exceeds the preset's configured `target_fps` (default `60`).
    - **Under Target (Amber):** Shifts to amber (`#ffb800`) as soon as measured FPS falls below `target_fps` (or red if FPS drops below 50% of `target_fps`).
    - **Click Action:** Clicking the FPS badge immediately opens the **Preset-Wide Settings** panel/popover, where the user can adjust the preset's **Target FPS** (`target_fps`) and **Internal WebGL Render Target Resolution Scale** (`resolution_scale`, e.g., `1.0`, `0.75`, `0.5`, `0.25`).
- **Master Frame Buffer Anchor & Auto-Layout:**
  - The node graph visually anchors the **Master Frame Buffer** as the permanent root container with a distinctive header/crown badge and subtle glowing boundary.
  - The Master Frame Buffer cannot be deleted, but selecting it opens its inspector (see [Frame Buffer Proposal](../component_proposals/frame_buffer.md)).
  - Presets serialize the component tree hierarchy without manual canvas coordinates; upon import, the graph executes clean automatic hierarchical layout.
- **Undo / Redo History & Input Coalescing (100 States):**
  - The Studio / Editor toolbar provides **Undo** (`Ctrl+Z` / `Cmd+Z`) and **Redo** (`Ctrl+Y` / `Ctrl+Shift+Z`) actions backed by a 100-snapshot JSON history stack.
  - **Continuous Input Coalescing:** Dragging a slider/knob or typing in a formula/code editor updates the live visualizer immediately at 60 FPS, but coalesces the history commit until pointer release (`onPointerUp`) or a 500ms typing debounce so a single drag gesture records exactly one undo step.
- **Screen Coordinate System (Winamp AVS Standard):**
  - All visual elements, canvas quads, and spatial transformations operate in a normalized Cartesian coordinate space from `-1.0` to `1.0` with `(0.0, 0.0)` at screen center:
    - `x` spans `-1.0` (left edge) to `1.0` (right edge).
    - `y` spans `-1.0` (bottom edge) to `1.0` (top edge).
  - Position parameters (`position_x`, `position_y`) throughout all inspectors and components map directly to this normalized space.
- **Rotation Units & Spatial Angles (Degrees Standard):**
  - All public signatures, user-facing parameter inspectors, component schemas, formula variables, and preset configurations use **degrees** (e.g., `-180°` to `+180°` or continuous rotational degrees).
  - WebGL fragment shaders and Three.js 3D objects convert degrees to radians internally (`(deg * Math.PI) / 180`) at the boundary layer so that users and preset authors never need to reason about raw radian values.

## 3. Component Inspector & The `f(x)` Expression Switcher
To maintain a unified, predictable visual language across all components when exploring presets or switching between fixed controls and dynamic formulas:
- **Component Preset Selector & Overwrite Confirmation Guard:**
  - Components with curated built-in examples (such as [Duperscope](../component_proposals/duperscope.md) and [Frame Buffer](../component_proposals/frame_buffer.md)) display a **Load Component Preset** dropdown in the inspector header.
  - **Dirty-State Confirmation Dialog:** If the component is still in its untouched default state, selecting a component preset applies it immediately. If the user has already modified parameters, edited script blocks, or added child nodes inside the component, attempting to load a component preset triggers a confirmation modal warning that loading the template will overwrite their current component configuration. Confirming pushes the previous state onto the 100-step Undo stack before applying the template.
- **The `f(x)` Mode Toggle:** Every modulatable parameter row in a component inspector features an `f(x)` button adjacent to the parameter label. (Static string, asset URL, buffer target `@NAME`, and multi-line code fields do not use the `f(x)` toggle).
- **Fixed Mode (Default) — Maps to Schema `"mode": "fixed"`:**
  - Displays standard tactile controls tailored to the data type: rotary knobs, linear faders, binary toggles, or dropdown selectors.
  - `f(x)` button appears in a subtle, neutral resting state.
- **Dynamic Expression Mode (Active) — Maps to Schema `"mode": "expression"`:**
  - Clicking `f(x)` smoothly morphs the fixed control into a monospace formula input field.
  - The `f(x)` button glows in the active theme accent color (e.g. electric cyan `#00f0ff`).
  - **Inline Autocomplete & Documentation Dropdown:**
    - Appears automatically below the cursor upon typing `$` or `#`.
    - **Variables (`$`):** Lists all system variables with human-readable definitions from the [System Variables Reference](./system_variables.md).
    - **System Functions (`#`):** Lists all system functions with full signatures, parameter descriptions, and return value ranges from the [System Functions Reference](./system_functions.md).
    - Full keyboard navigation (Up/Down arrow keys, Enter/Tab to select and insert with cursor positioned inside function parentheses).
  - **Strict Syntax Validation & Feedback:**
    - Validates syntax on every keystroke with immediate status icons (`Syntax Valid` check or `Syntax Error` cross).
    - Rejects misspelled system function names (e.g. `#BEAzT(...)`) or unknown variable identifiers (`$FOO`) with explicit, actionable error diagnostics, preventing silent evaluation failures.
    - Invalid formulas pulse amber/red with an inline tooltip, safely falling back to the designated default value without terminating the render loop.
  - **60 FPS Real-Time Evaluation & Waveform Sparkline Chart:**
    - **Direct DOM Telemetry:** Real-time numerical readout updates directly via DOM element refs at 60 FPS, completely bypassing virtual-DOM diffing and React re-renders.
    - **Sliding-Window Sparkline Canvas:** A dedicated `<canvas>` renders a 180-frame sliding window (~3 seconds of real-time history) with dynamic headroom scaling, electric cyan stroke, and linear gradient fill beneath the curve.
    - **Dual-Scale Extrema Readout:** Displays tabular `min:` and `max:` readouts computed in real-time from the active sliding window to give immediate visual feedback on dynamic range.
  - **Strict Memory Lifecycle & Multi-Component Performance Rules:**
    - *Scalability Mandate:* Visualització presets may contain dozens of simultaneously active components and modulated parameters. To prevent memory exhaustion and GC stutter:
    - Sliding-window history buffers and canvas redraw loops **must only be maintained for the actively open / expanded expression control or dialog**.
    - Whenever an expression control, popover, or testbed is closed, collapsed, or switches to a different formula, all history arrays **must be immediately cleared** (`length = 0` / released) and animation frame callbacks stopped.
    - Background components evaluate AST expressions statelessly with zero historical memory buffering.
  - **Interactive Token Discovery & Quick Reference:**
    - Expandable / collapsible Quick Reference section positioned prominently above example presets, persisting user open/closed state across sessions.
    - Interactive chips with informative hover tooltips detailing parameter descriptions, audio characteristics, and expected output ranges.
    - One-click token insertion directly appending into the active formula field.

## 4. Diagnostics & Error Handling
- **Dedicated Diagnostics Console:** An integrated error and log console (capturing shader compilation issues, audio context states, buffer routing errors, and formula evaluation faults) that remains closed/collapsed by default.
- **Visual Alert Indicators:** Whenever warnings or errors are logged to the console, an unobtrusive badge or icon glows in the status bar/HUD to alert the user that diagnostics are available for inspection.
- **Tone & Terminology:** Concise, professional, and audio-engineering oriented (e.g., "Attack / Decay", "FFT Bins", "RMS Gain", "GLSL Pass", "MIDI CC").

## 5. Performance & Architecture Considerations
- **Frame Rate Target & Frame Budget:** Default 60 FPS target (<16.6ms per-frame render & DSP compute budget, sampling the Web Audio analyser once per RAF tick with zero extra buffering). Users can configure per-preset `target_fps` and `resolution_scale` in Preset Settings to balance visual complexity with frame rate.
- **Scalability by Design:** All core architecture and individual components are designed from day one with degradation pathways in mind (e.g., configurable preset `resolution_scale`, `target_fps`, particle/point counts, and optional component bypass switches).
- **Formula & Shader Sandboxing:** Safe formula parsing and error boundaries to prevent WebGL context loss or crashes from invalid user expressions.

## 6. Codebase Health, Decomposition & Track Completion Reviews
To prevent architectural drift and maintain a healthy, decoupled codebase as the feature set expands across the 9-track roadmap:
- **Mandatory Track-End Stateless Review:** Before any track is marked as complete or merged into `main`, a comprehensive stateless review of both code and documentation must be executed.
- **Single-Responsibility & Scope Evaluation:** No UI component or engine class should grow into an unmaintainable monolith. Larger files are acceptable as long as they maintain a clear, narrow, and cohesive scope; file size should serve as an indicator/heuristic to evaluate whether a file can be logically decomposed, rather than forcing decomposition purely based on line counts. Components or classes that accumulate multiple disparate responsibilities (e.g. data catalogs, dragging logic, canvas rendering, state store mutations, and file I/O) should be decomposed into dedicated single-responsibility modules and reusable primitives.
- **Reusable Primitive Extraction:** Reusable UI elements (like sparkline renderers, expression inputs, quick-reference guides, and draggable dialog hooks) must be promoted to shared libraries (`src/ui/expressions/`, `src/ui/hooks/`) so future tracks can compose them cleanly without duplicating code.
- **Continuous Documentation & Specification Sync:** Root documentation, directory READMEs, Conductor track plans, system variable/function references, and product specifications must be updated concurrently with code changes. Code and documentation are held to the exact same standards.

