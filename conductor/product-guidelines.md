# Product Guidelines: Visualització

## 1. Visual Identity & Aesthetic
- **Theme Architecture:** Pluggable, runtime theme system with an intuitive theme switcher.
- **Default Theme (Cyberpunk / Neon High-Contrast):** Deep void backgrounds (`#08080c`, `#10121a`) paired with vibrant neon glowing borders, dark glassmorphism, and electric indicators (cyan `#00f0ff`, magenta `#ff007f`, amber `#ffb800`).
- **Dark Studio Theme (Legibility First):** Slate and neutral dark charcoal backgrounds (`#18181b`, `#27272a`) with high-contrast neutral borders and restrained accent coloring designed for clean daylight or studio workstation legibility.
- **Typography:** High-legibility modern sans-serif paired with monospaced accents for numeric telemetry, formula editors, and MIDI assignments.

## 2. Interface Architecture & Layout
- **Split-View Workspace:** Side-by-side layout pairing a modular node-graph connection editor with the real-time visualizer canvas.
- **Two Operating Modes:**
  - *Studio / Editor Mode:* Split-view with node graph, parameter inspectors, audio FFT visualizer, and MIDI mapping HUD.
  - *Live Performance Mode:* Fullscreen distraction-free canvas with auto-hiding HUD controls on mouse inactivity.
- **Tactile Modulation:** Knobs, faders, and formula inputs display live visual pulsing/deflection reflecting real-time audio reactivity.

## 3. Diagnostics & Error Handling
- **Dedicated Diagnostics Console:** An integrated error and log console (capturing shader compilation issues, audio context states, and formula evaluation faults) that remains closed/collapsed by default.
- **Visual Alert Indicators:** Whenever warnings or errors are logged to the console, an unobtrusive badge or icon glows in the status bar/HUD to alert the user that diagnostics are available for inspection.
- **Tone & Terminology:** Concise, professional, and audio-engineering oriented (e.g., "Attack / Decay", "FFT Bins", "RMS Gain", "GLSL Pass", "MIDI CC").

## 4. Performance & Architecture Considerations
- **Frame Rate Target:** Consistent 60+ FPS target with minimal audio-to-visual latency (<16ms).
- **Scalability by Design:** While automated adaptive resolution scaling is a roadmap item, all core architecture and individual components must be designed from day one with degradation pathways in mind (e.g., configurable particle counts, shader complexity levels, and optional bypass switches).
- **Formula & Shader Sandboxing:** Safe formula parsing and error boundaries to prevent WebGL context loss or crashes from invalid user expressions.
