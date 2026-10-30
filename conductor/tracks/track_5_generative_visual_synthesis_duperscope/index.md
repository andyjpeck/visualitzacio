# Track 5: Generative Visual Synthesis & Duperscope

This track delivers **Duperscope**, Visualització's programmable parametric curve and particle generator inspired by Winamp AVS Superscope, completing the foundational component set (`FrameBufferNode`, `StaticImageNode`, `DuperscopeNode`).

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Comprehensive functional requirements (FR-1 through FR-6) covering the multi-statement script compiler, 4-phase lifecycle (`init`, `beat`, `frame`, `point`), always-on 1:1 square aspect projection, Instanced Screen-Space Quad Ribbon line renderer and circular particle shader, built-in template catalog, and Studio Inspector / Outliner integration.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased test-driven implementation plan with measurable task checklists.
- [**Metadata (`metadata.json`)**](./metadata.json): GitHub issue linkage (#8) and active status tracking.

## Key Deliverables

1. **Multi-Statement Duperscope Script Compiler (`DuperscopeCompiler`):** Comment stripping (`//` and `/* ... */`), semicolon/newline statement splitting, read-only variable guards (`i`, `v`, and `n` in `point`), sandboxed `expr-eval` AST validation, zero-allocation point-loop execution, and blank-on-error fallback with per-block diagnostic reporting.
2. **4-Phase Execution Lifecycle (`init` $\to$ `beat` $\to$ `frame` $\to$ `point`):** Persistent user state dictionary across frames, `beat`-before-`frame` execution on transient beats (`$BEAT === 1.0`), logarithmic spectrum mapping for `v`, and dynamic point count `n` (`1` to `4096`).
3. **WebGL Duperscope Node (`DuperscopeNode`):** Always-on 1:1 square aspect-corrected coordinate space $(x, y) \in [-1.0, 1.0]$, 3 draw modes (`lines`, `lineLoop` via pre-allocated Instanced Screen-Space Quad Ribbons supporting `linesize` `1px`–`128px` and RGBA gradients; `points` via circular particle shader), and modulatable `opacity`.
4. **Built-in Duperscope Template Library:** Curated catalog (*Oscilloscope Tunnel*, *Frequency Spectrum Ribbon*, *Reactive Lissajous Figure*, *Single Audio-Reactive Beat Particle*) integrated with dirty-state overwrite confirmation guards.
5. **Studio Inspector, Outliner & Preset Schema v2 Integration:** 4-phase code editors with `$VARIABLE`, `#FUNCTION`, and Duperscope local variable (`n, i, v, x, y, r, g, b, a, linesize, skip`) autocomplete, per-block syntax error banners, `+ Duperscope` layer creation, Preset Schema v2 serialization/deserialization, and 100-step Semantic Action Delta Undo/Redo support.
