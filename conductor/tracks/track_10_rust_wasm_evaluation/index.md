# Track 10: Rust + WASM Engine Architecture & Desktop Portability Evaluation

This track establishes a formal research and evaluation workstream to benchmark, prototype, and decide on migrating performance-critical engine workloads from TypeScript to **Rust + WebAssembly (WASM)**, as well as evaluating native desktop portability via **Tauri**.

## Documents

- [**Track Analysis & Feasibility Study (`analysis.md`)**](./analysis.md): In-depth comparison of hybrid compute vs. full engine rewrites, pros/cons, engineering cost breakdown, and boundary performance considerations.
- [**Track Specification (`spec.md`)**](./spec.md): Evaluation criteria, prototype benchmarking goals, memory bandwidth analysis, and Tauri desktop feasibility.
- [**Metadata (`metadata.json`)**](./metadata.json): Track lifecycle status and configuration.

## Key Objectives

1. **Benchmark Generative Loop Throughput:** Measure CPU performance and memory bandwidth comparing V8 JIT TypeScript vs. SIMD-accelerated Rust WASM evaluating 4,096-point generative curves at 60–120 FPS.
2. **Zero-Copy Shared Memory Verification:** Prototype direct zero-copy WebGL attribute uploads by having Three.js read vertex positions directly out of Rust/WASM linear memory (`wasm.memory.buffer`).
3. **Audio DSP Extraction Feasibility:** Evaluate moving Web Audio logarithmic FFT binning and beat onset detection into a dedicated Rust AudioWorklet/WASM module.
4. **Desktop Packaging Evaluation (Tauri):** Assess building a low-latency native desktop build for live stage performances (Vulkan/Metal rendering with dual-monitor detached projector outputs).
