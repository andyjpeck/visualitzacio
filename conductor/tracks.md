# Tracks Registry: Visualització

This registry tracks the planned, active, and completed workstreams across Visualització's roadmap.

---

## MVP Milestones: Foundation & Visual Studio (Tracks 1 – 4)

- [x] **Track 1: Minimal Reactive Canvas & Audio Testbed**
  *Goal: Two-Plane architecture, Web Audio analyzer, live preview canvas, clickable FPS overlay with preset performance settings (`target_fps`, `resolution_scale`), and day-1 reactive audio visuals.*  
  *Link: [./tracks/track_1_reactive_canvas_audio_testbed/index.md](./tracks/track_1_reactive_canvas_audio_testbed/index.md)* (Completed)

- [x] **Track 2: Dynamic Expression Engine & Parameter Binding**
  *Goal: `expr-eval` sandboxing, real-time `$VARIABLE` bindings, `#FUNCTION(...)` library with `#BEAT_FRAMES` decay curves, and live formula test input.*  
  *Link: [./tracks/track_2_expression_engine/index.md](./tracks/track_2_expression_engine/index.md)* (Completed)

- [x] **Track 3: Modular Frame Buffer, Ping-Pong Feedback & Named Buffers**
  *Goal: Master Frame Buffer root lifecycle, dual-FBO ping-pong feedback motion trails, 6 GLSL blend modes, `@NAME` buffer pool, Built-in Frame Buffer Preset Selector, and Static Image component.*  
  *Link: [./tracks/track_3_frame_buffer_pingpong_feedback/index.md](./tracks/track_3_frame_buffer_pingpong_feedback/index.md)* (Completed)

- [x] **Track 4: Visual Studio Shell, Node Graph & Preset Import/Export**
  *Goal: Split-view UI, `@xyflow/react` node graph with auto-layout, universal `f(x)` inspector with inline autocomplete dropdown, component preset selector with overwrite confirmation dialog, 100-step Undo/Redo JSON history buffer, and JSON preset serializer.*  
  *Link: [./tracks/track_4_visual_studio_node_graph/index.md](./tracks/track_4_visual_studio_node_graph/index.md)* (Completed)

---

## Advanced Creative Capabilities (Tracks 5 – 9)

- [x] **Track 5: Generative Visual Synthesis & Duperscope**
  *Goal: Multi-statement procedural script compiler (`init`, `beat`, `frame`, `point`), Instanced Screen-Space Quad Ribbon & circular particle draw modes, and Built-in Duperscope Preset Selector with classic generative curve templates. Completes the foundational component set (Frame Buffer, Static Image, Duperscope).*  
  *Link: [./tracks/track_5_generative_visual_synthesis_duperscope/index.md](./tracks/track_5_generative_visual_synthesis_duperscope/index.md)* (Completed)

- [ ] **Track 6: Next-Generation Component Suite (Colormap, LightSource, 3dMesh)**
  *Goal: Detail full technical specifications and implement the second-generation component suite: Colormap (AVS-inspired visual gradient stop bar & palette cycling), LightSource (2D/2.5D specular & audio-reactive lighting projections), and 3dMesh (3D polygonal primitives, GLTF model loader, and vertex displacement).*  
  *Status: Planned (Detailed specifications to be drafted following completion of defined components in Track 5)*

- [ ] **Track 7: Custom GLSL Shader Passes & Post-Processing Pipeline**
  *Goal: Arbitrary vertex/fragment shader component, audio uniform injection, in-browser Monaco/CodeMirror editor, and post-processing presets.*  
  *Status: Planned*

- [ ] **Track 8: Web MIDI Hardware Integration & Live Performance Mode**
  *Goal: Web MIDI API, interactive MIDI Learn, parameter smoothing (lerp), and distraction-free borderless fullscreen performance mode.*  
  *Status: Planned*

- [ ] **Track 9: Preset Library, Community Sharing & Detached Display Output**
  *Goal: IndexedDB local preset library, portable preset bundles, and dual-window detached projector output for live stage productions.*  
  *Status: Planned*

- [ ] **Track 10: Rust + WASM Engine Architecture & Desktop Portability Evaluation**
  *Goal: Feasibility study, boundary benchmarking, hybrid compute prototype (Audio DSP / Duperscope point loop in WASM), and native desktop Tauri packaging evaluation.*  
  *Link: [./tracks/track_10_rust_wasm_evaluation/index.md](./tracks/track_10_rust_wasm_evaluation/index.md)* (Planned)


- [x] **Track 11: High-Fidelity Verification Overhaul (Playwright, WebGL Smoke Tests, & Agent Quality Gates)**
  *Goal: Real Chromium E2E Playwright actionability checks for modal/dialog stacking, WebGL pipeline & non-empty pixel smoke tests, Chrome DevTools MCP visual inspection rules, and updated Conductor 3-tier quality gates.*  
  *Link: [./tracks/track_11_high_fidelity_verification/index.md](./tracks/track_11_high_fidelity_verification/index.md)* (Completed)


- [x] **Track 12: Toolbar Preset Selector & Overwrite Confirmation Guard**
  *Goal: Dynamic preset discovery from presets/*.json, upper toolbar preset selector, and protective BaseModalDialog confirmation guard on non-empty scenes.*  
  *Link: [./tracks/track_12_toolbar_preset_selector/index.md](./tracks/track_12_toolbar_preset_selector/index.md)* (Completed)


---

## Active & Bugfix Workstreams

- [x] **Track 13: Responsive Toolbar Overflow & Wrapping**
  *Goal: Semantic control clustering, multi-row flexbox wrapping, right-aligned stacking, and adaptive scaling down to 320px to ensure all toolbar buttons and dialog triggers remain within preview canvas boundaries and fully interactive.*  
  *Link: [./tracks/track_13_responsive_toolbar_overflow_wrapping/index.md](./tracks/track_13_responsive_toolbar_overflow_wrapping/index.md)* (Completed)

- [x] **Track 14: Engine Performance — Render Pass, VRAM & Bandwidth Optimizations (#14)**
  *Goal: Disable main canvas MSAA/depth, default `FrameBufferNode` to `depthBuffer: false` and skip direct pass-through FBO allocations, fix high-refresh display frame pacing with accumulator remainder carry-over, and optimize Duperscope dynamic buffer upload ranges and dormant point loop execution.*  
  *Link: [./tracks/track_14_engine_perf_bottlenecks/index.md](./tracks/track_14_engine_perf_bottlenecks/index.md)* (Completed)

- [x] **Track 15: Mask Compositor Node (3-Way Buffer Reveal) (#18)**
  *Goal: Lean 3-input GPU compositing pass that samples foreground, background, and mask textures in 1 pass without overdraw, full Layer Tree and Parameter Inspector integration, and rainy ocean sunset reveal preset authoring.*  
  *Link: [./tracks/track_15_mask_compositor_node/index.md](./tracks/track_15_mask_compositor_node/index.md)* (Completed)

- [x] **Track 15 (Alt): Editor & Performance Settings Section in Toolbar Menu (#15)**
  *Goal: Add a localStorage-backed Editor & Performance Settings section (Layer Complexity Cost Estimates toggle & Debug Telemetry Overlay toggle) to the toolbar Settings modal, isolated from preset JSON serialization.*  
  *Link: [./tracks/track_15_editor_performance_settings/index.md](./tracks/track_15_editor_performance_settings/index.md)* (Completed)

- [x] **Track 16: Computational Complexity Cost Indicators in Layers Tree (#16)**
  *Goal: Implement Tier 0 static computational complexity model, color-graded percentage share badges (`{sharePercent}%`), and portaled hover breakdown tooltips with anti-pattern lint tips in `LayerTreeView`.*  
  *Link: [./tracks/track_16_layer_complexity_telemetry/index.md](./tracks/track_16_layer_complexity_telemetry/index.md)* (Completed)

- [x] **Track 17: Preset State Isolation & Master Buffer Parameter Reset on Preset Switch**
  *Goal: Prevent parameter and transform leakage across preset loads by enforcing schema defaults for omitted properties on Master Output, resetting numeric *Val cache on dynamic expression unbinding, and clearing ping-pong render targets.*  
  *Link: [./tracks/track_17_preset_state_isolation/index.md](./tracks/track_17_preset_state_isolation/index.md)* (Completed)
