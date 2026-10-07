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
  - Composable node graph where visual generators, geometric transforms, color mappers, feedback loops, and post-processing passes can be chained in real time.
  - **Named Frame Buffers (`#BUFFER_NAME`):** Frame Buffer components can produce named textures (`save_to="#NAME"`) and consume named textures (`load_from="#NAME"`). This allows complex multi-quad compositing, tiling, feedback loops, and picture-in-picture arrangements (e.g. rendering a graphic into `#BUFFER_A` and compositing four scaled, transposed copies into the corners of a master buffer).
  - Universal parameter architecture: every component parameter can exist either as a fixed value (knob, slider, switch) or bind dynamically to a mathematical expression.
- **Dynamic Expression Engine & Universal Parameter Binding:**
  - Mathematical formulas evaluated once per frame inside the Render Data Plane.
  - **Special Values ($VARIABLE):** Built-in audio/system variables formatted with `$` (e.g., `$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, `$BEAT` [binary 1/0], `$FRAME`).
  - **System Functions (%FUNCTION):** Built-in DSP functions formatted with `%` prefix:
    - `%FFT(lower_band, band_width, channel)` with normalized logarithmic frequency inputs $[0.0, 1.0]$.
    - `%BEAT_SECONDS(decay_seconds)`: Transient attack pulse (1.0 decaying exponentially to 0.0 over time in seconds).
    - `%BEAT_FRAMES(decay_frames)`: Transient attack pulse (1.0 decaying exponentially to 0.0 over frame count).
    - `%BEAT(...)`: Shorthand for `%BEAT_SECONDS(0.2)`.
  - Example: Binding blend amount to `%FFT(0, 0.3, 1) * 0.5` or scale to `1.0 + %BEAT_SECONDS(0.3) * 0.5`.
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
