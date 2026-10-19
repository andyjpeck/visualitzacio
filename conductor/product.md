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
- **Modular Component Pipeline & Visual Hierarchy:**
  - Dynamic visualizer trees built from composable visual components and containers (such as [Frame Buffer](../component_proposals/frame_buffer.md), [Static Image](../component_proposals/static_image.md), and [Duperscope](../component_proposals/duperscope.md)).
  - Universal parameter architecture: modulatable component parameters can exist either as a fixed value (knob, slider, switch, dropdown) or bind dynamically to a mathematical expression.
  - **Built-in Component Preset Selector:** Components with rich creative possibilities (such as `Frame Buffer` and `Duperscope`) include an in-inspector **Component Preset Selector** pre-loaded with curated example templates so users can immediately explore how they work. If the component already contains user modifications or child nodes, a confirmation dialog protects the user before overwriting their changes.
- **Dynamic Expression Engine & Universal Parameter Binding:**
  - Mathematical formulas evaluated once per frame inside the Render Data Plane, supporting standard mathematical operators and functions.
  - **Special Values (`$VARIABLE`):** Real-time reactive variables representing audio energy, timing, and engine state (e.g., `$BASS`, `$TIME`, `$BEAT`). See the complete [System Variables Reference](./system_variables.md).
  - **System Functions (`#FUNCTION`):** Built-in DSP and envelope functions for frequency sampling, time-domain waveforms, and beat decay pulses (e.g., `#FFT(...)`, `#WAVEFORM(...)`, `#BEAT(...)`). See the complete [System Functions Reference](./system_functions.md).
- **Reactive Audio Engine:**
  - Multi-source audio input: Microphone / Line-in, Local audio files (MP3, WAV, FLAC), and System / Tab audio capture (via getDisplayMedia / audio stream capture).
  - Web Audio API real-time FFT frequency spectrum, waveform time-domain data, beat detection, and RMS energy tracking exposed as reactive variables to all components.
- **Rendering & Shader Pipeline:**
  - Three.js + WebGL 2.0 graphics pipeline supporting 2D/3D geometry, particle systems, and customizable GLSL vertex and fragment post-processing shader passes.
- **MIDI & Performance Controls:**
  - Web MIDI API integration allowing instant MIDI Learn / CC knob mapping to any component parameter for tactile physical control.
- **Preset Management, Undo/Redo History & Per-Preset Performance Settings:**
  - Declarative JSON-based preset schema enabling seamless import, export, and sharing of modular visualization setups and preset libraries.
  - **100-Step Undo / Redo History:** Because the entire preset hierarchy and parameters are represented as lightweight JSON (~2–15 KB per snapshot), the editor maintains an in-memory ring buffer of up to **100 history states** (<5 MB RAM total), enabling instant undo/redo across parameter tweaks, component preset loads, and node graph edits.
  - **Preset-Wide Performance Settings:** Each preset stores its own configurable **Target FPS** (`target_fps`, default `60`) and **Render Resolution Scale** (`resolution_scale`, default `1.0`), allowing users to trade off resolution or frame rate for heavy visualizations.
- **User Experience & Presentation:**
  - **MVP:** Sleek, responsive single-window interface with a collapsible floating HUD for parameter tweaking, preset switching, and full-screen canvas mode.
  - **Roadmap / Future:** Multi-window / Detached display output (Operator Control Console on screen 1, clean borderless projector window on screen 2 synced via BroadcastChannel).
