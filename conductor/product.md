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
- **Modular Component Pipeline:** 
  - Composable node graph where visual generators, geometric transforms, color mappers, feedback loops, and post-processing passes can be chained in real time.
  - Granular parameter controls per component (knobs, sliders, toggles, dropdowns, and math formula text boxes).
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
