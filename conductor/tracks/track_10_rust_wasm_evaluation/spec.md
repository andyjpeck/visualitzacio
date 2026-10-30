# Track 10 Specification: Rust + WASM Engine Architecture & Desktop Portability Evaluation

## Context & Vision
Following the completion of Visualització's foundational and creative feature tracks (Tracks 1 through 9), **Track 10** investigates transitioning core mathematical and rendering workloads into **Rust + WebAssembly (WASM)** and packaging the synthesizer into a native high-performance desktop application via **Tauri**.

This track grounds architectural decisions in empirical benchmarks, measuring real-world frame times, memory overhead, and development friction before any large-scale migration.

---

## Architectural Analysis Reference

The complete architectural evaluation, boundary options, pros/cons, and engineering cost breakdown are documented in:
👉 [**`analysis.md`**](./analysis.md)

---

## Evaluation Goals & Deliverables

### 1. Hybrid Compute Benchmark (Duperscope Point Loop)
- **Goal:** Compare the throughput of the TypeScript/V8 JIT expression evaluator against a compiled Rust/WASM module for 4,096-point generative curves evaluated at 60 FPS (~245,760 mathematical evaluations/sec).
- **Metrics to Measure:**
  - Microsecond execution time per frame.
  - CPU usage under complex trigonometric/audio-reactive formulas.
  - Frame pacing consistency and micro-stutter occurrence under memory stress.

### 2. Zero-Copy Shared Memory Pipeline
- **Goal:** Verify that a `THREE.BufferAttribute` in WebGL can wrap a live `Float32Array` view directly into WASM linear memory (`wasm.memory.buffer`) without copying data across the JS bridge on every frame.
- **Criteria:**
  - Zero allocation in JavaScript during the 60 FPS render pass.
  - Memory bounds safety when WASM dynamically grows memory pages.

### 3. Audio DSP & Analysis in WebAssembly / AudioWorklet
- **Goal:** Determine whether running logarithmic FFT binning, transient energy envelopes, and tempo estimation in a Rust AudioWorklet provides measurable latency or accuracy improvements over standard Web Audio `AnalyserNode`.

### 4. Native Desktop Portability via Tauri
- **Goal:** Evaluate compiling the Rust engine core as a native desktop binary on macOS (Metal) and Windows (DirectX 12 / Vulkan) using **Tauri**:
  - Independent hardware display control (borderless fullscreen projector output on Display 2, Studio UI on Display 1).
  - Ultra-low latency ASIO/CoreAudio hardware sound card integration.
  - Native Web MIDI device access.

---

## Decision Gate & Outcome
At the conclusion of Track 10:
- Produce an empirical benchmark report comparing TypeScript vs. Rust WASM.
- If the performance gain on generative scripts exceeds **$3\times$** without incurring boundary latency bottlenecks, proceed with integrating the **Approach A (Hybrid Compute)** Rust module into the core repository.
- If the TypeScript/Three.js engine remains faster and simpler across target devices, retain the zero-allocation TypeScript architecture and document the empirical findings.
