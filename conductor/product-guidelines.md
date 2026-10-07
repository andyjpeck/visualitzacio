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
- **Named Buffer Visual Indicators:**
  - Nodes publishing a buffer (`save_to="#NAME"`) display an emerald/cyan badge indicating the broadcast target name.
  - Nodes consuming a buffer (`load_from="#NAME"`) feature an intuitive dropdown menu populated with all currently active `#BUFFER` names in the project.

## 3. Universal Parameter Pattern: The `f(x)` Expression Switcher
To maintain a unified, predictable visual language across all components when switching between fixed controls and dynamic formulas:
- **The `f(x)` Mode Toggle:** Every parameter row in every component inspector features an `f(x)` button adjacent to the parameter label.
- **Fixed Mode (Default):**
  - Displays standard tactile controls tailored to the data type: rotary knobs, linear faders, binary toggles, or dropdown selectors.
  - `f(x)` button appears in a subtle, neutral resting state.
- **Dynamic Expression Mode (Active):**
  - Clicking `f(x)` smoothly morphs the fixed control into a monospace formula input field.
  - The `f(x)` button glows in the active theme accent color (e.g. electric cyan `#00f0ff`).
  - **Inline Autocomplete & Documentation Dropdown:**
    - Appears automatically below the cursor upon typing `$` or `%`.
    - **Variables (`$`):** Lists `$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, `$BEAT`, `$FRAME`. Each entry displays the variable name, a human-readable definition, and a **real-time live calculated value preview** (e.g., `$BASS: 0.68`).
    - **System Functions (`%`):** Lists `%FFT(...)`, `%BEAT()`, `%BEAT_SECONDS(...)`, `%BEAT_FRAMES(...)`. Each entry shows the full function signature, parameter definitions, and return range.
    - Keyboard navigation (Up/Down arrow keys, Enter/Tab to select and insert with cursor inside parentheses for functions).
  - **Live Evaluation Preview Chip:** A subtle badge next to the input displaying the real-time evaluated result as music plays.
  - **Error Indication:** If the user enters an invalid formula, the field border pulses amber/red with an inline tooltip, and the engine safely falls back to the previous valid frame value without breaking visual output.

## 4. Diagnostics & Error Handling
- **Dedicated Diagnostics Console:** An integrated error and log console (capturing shader compilation issues, audio context states, and formula evaluation faults) that remains closed/collapsed by default.
- **Visual Alert Indicators:** Whenever warnings or errors are logged to the console, an unobtrusive badge or icon glows in the status bar/HUD to alert the user that diagnostics are available for inspection.
- **Tone & Terminology:** Concise, professional, and audio-engineering oriented (e.g., "Attack / Decay", "FFT Bins", "RMS Gain", "GLSL Pass", "MIDI CC").

## 5. Performance & Architecture Considerations
- **Frame Rate Target:** Consistent 60+ FPS target with minimal audio-to-visual latency (<16ms).
- **Scalability by Design:** While automated adaptive resolution scaling is a roadmap item, all core architecture and individual components must be designed from day one with degradation pathways in mind (e.g., configurable particle counts, shader complexity levels, and optional bypass switches).
- **Formula & Shader Sandboxing:** Safe formula parsing and error boundaries to prevent WebGL context loss or crashes from invalid user expressions.
