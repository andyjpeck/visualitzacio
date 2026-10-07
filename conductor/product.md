# Visualització: Modular Reactive Music Visualization Platform

## Product Vision
Visualització is a modern web-based music visualization platform inspired by classic audio visualizers like Winamp's AVS (Advanced Visualization Studio) and MilkDrop. Rather than relying on rigid, bespoke visual presets, Visualització provides an extensible architecture where dynamic visualizations are built by composing modular processing and rendering components. Each modular component exposes reactive parameters—ranging from dials, toggles, and sliders to freeform mathematical expression inputs—all configurable through an intuitive, real-time GUI that synchronizes seamlessly with live audio input and Web Audio frequency analysis.

The platform is designed to serve two complementary environments:
1. **Casual Listening:** Frictionless browser experience for music lovers visualizing local tracks, mic input, or stream audio with a collapsible UI and curated presets.
2. **Live Performance / VJing:** Low-latency visual synthesis for stage, club, and DJ sets featuring Web MIDI controller mapping, tactile real-time parameter modulation, and full-screen projection.

## Key Target Personas & Use Cases
- **Music Enthusiasts & Casual Listeners:** Want an evocative, mesmerizing visual companion while playing music locally or listening to livestreams with zero configuration required.
- **VJs, DJs & Live Performers:** Need a modular, highly responsive visual instrument that maps directly to hardware MIDI controllers for stage performances.

## Core Capabilities
- **Modular Component Pipeline & Named Buffer Routing:** 
  - **Master Frame Buffer Root:** Every preset is structured with a single **Master Frame Buffer** at its root, inside of which all visual generators, child buffers, and transformations live.
  - **Frame Feedback vs. Clean Slate:** The Master Frame Buffer fully supports blend modes (Replace, Additive, Maximum, Minimum, Subtractive, Multiplicative) and opacity. When set to `Replace`, every frame starts with a clean slate; when set to additive, maximum, or feedback blend modes, the previous frame is continuously fed into the next frame to generate motion trails, decay, and feedback textures.
  - **Named Frame Buffers (`@BUFFER_NAME`):** Frame Buffer components can produce named textures (`save_to="@NAME"`) and consume named textures (`load_from="@NAME"`). This allows complex multi-quad compositing, tiling, and picture-in-picture arrangements (e.g. rendering a graphic into `@BUFFER_A` and compositing four scaled, transposed copies into the corners of a Master Frame Buffer). If a cyclic dependency or missing buffer is detected, the affected buffer is disabled and flagged with an error state rather than crashing or freezing.
  - Universal parameter architecture: every component parameter can exist either as a fixed value (knob, slider, switch) or bind dynamically to a mathematical expression.
  - **Screen Coordinate System (Winamp AVS Standard):** All visual positioning and screen coordinates follow the Winamp AVS / WebGL NDC standard ranging from `-1.0` to `1.0` with `(0.0, 0.0)` at center: `x` spans `-1.0` (left) to `1.0` (right), and `y` spans `-1.0` (bottom) to `1.0` (top).
- **Dynamic Expression Engine & Universal Parameter Binding:**
  - Mathematical formulas evaluated once per frame inside the Render Data Plane, supporting standard mathematical operators and functions.
  - **Special Values ($VARIABLE):** Built-in audio/system variables formatted with `$` (e.g., `$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, `$BEAT` [binary 1/0], `$FRAME`).
  - **System Functions (#FUNCTION):** Built-in DSP functions formatted with `#` prefix:
    - `#FFT(lower_band, band_width, channel)` with normalized logarithmic frequency inputs $[0.0, 1.0]$.
    - `#BEAT([decay_seconds = 0.2])` / `#BEAT_SECONDS([decay_seconds = 0.2])`: Transient attack pulse (1.0 decaying exponentially to 0.0 over time in seconds).
    - `#BEAT_FRAMES([decay_frames = 12])`: Transient attack pulse (1.0 decaying exponentially to 0.0 over frame count).
  - Example: Binding opacity to `#FFT(0, 0.3, 1) * 0.5` or scale to `1.0 + #BEAT(0.3) * 0.5`.
- **Reactive Audio Engine:**
  - Multi-source audio input: Microphone / Line-in, Local audio files (MP3, WAV, FLAC), and System / Tab audio capture (via getDisplayMedia / audio stream capture).
  - Web Audio API real-time FFT frequency spectrum, waveform time-domain data, beat detection, and RMS energy tracking exposed as reactive variables to all components.
- **Rendering & Shader Pipeline:**
  - Three.js + WebGL 2.0 graphics pipeline supporting 2D/3D geometry, particle systems, and customizable GLSL vertex and fragment post-processing shader passes.
- **MIDI & Performance Controls:**
  - Web MIDI API integration allowing instant MIDI Learn / CC knob mapping to any component parameter for tactile physical control.
- **Preset Management:**
  - Declarative JSON-based preset schema enabling seamless import, export, and sharing of modular visualization setups and preset libraries.
- **User Experience & Presentation:**
  - **MVP:** Sleek, responsive single-window interface with a collapsible floating HUD for parameter tweaking, preset switching, and full-screen canvas mode.
  - **Roadmap / Future:** Multi-window / Detached display output (Operator Control Console on screen 1, clean borderless projector window on screen 2 synced via BroadcastChannel).
