# Visualització Project Working Agreement & Architecture Tenets

This document defines project-specific guidelines and architectural standards for Visualització. It supplements the global Antigravity working agreement.

---

## 🧱 Component Architecture Tenets

All visual nodes, engine modules, and UI inspectors must strictly adhere to the following principles:

### 1. Focused Identity (No "Jack-of-all-Trades")
- Each component/node must own a single, well-defined rendering or digital signal processing (DSP) paradigm.
- Do not overload existing nodes with unrelated responsibilities, secondary visual passes, or sprawling configuration flags.
- *Example*: Color remapping, blur, and lighting belong in dedicated compositing nodes or shader passes, not as 30 optional flags inside `FrameBufferNode` or `DuperscopeNode`.

### 2. Orthogonal Taxonomy & Generalization (No Overly Narrow Sprawl)
- Avoid creating an overly crowded component library with near-duplicate or hyper-narrow components.
- Before creating a new component, evaluate if the requirement can be cleanly accommodated by **generalizing an existing component** through parameters, expressions, or shader uniforms.
- If a proposed capability is too narrow to stand on its own as a distinct visual paradigm, combine it with a related existing component or generalize the abstraction.

### 3. Composability Over Specialization
- High-level, complex visual aesthetics should emerge from connecting clean, orthogonal primitives in the node graph (e.g. `DuperscopeNode` $\to$ `FrameBufferNode` feedback $\to$ `ColormapNode`), rather than building specialized monolithic components.

### 4. Ambiguity Pause Gate (Human-in-the-Loop)
- Whenever component boundaries, architectural trade-offs, or design decisions are ambiguous (e.g., whether to implement an effect as an expression engine function, a parameter on an existing node, or a new visual node):
  - **Pause immediately and ask the user for direction** with concrete pros and cons before writing code or scaffolding tracks.

### 5. Feedback-Driven Evolution
- New visual capabilities and engine APIs should be driven backwards from real creative use cases surfaced by the [**Preset Designer**](.agents/skills/preset-designer/SKILL.md) feedback loop rather than speculative design in a vacuum.
- All AI agents authoring or modifying presets must activate and follow the workspace skill at [`.agents/skills/preset-designer/SKILL.md`](.agents/skills/preset-designer/SKILL.md).

---

## ⚡ Performance Contracts (Two-Plane Architecture)
- **Zero-Allocation Render Plane**: 60 FPS WebGL render loop (`update()`) must perform zero heap allocations, zero object instantiations, and zero array creations per frame.
- **Strict Plane Isolation**: React UI plane (<10 Hz) must never trigger re-renders on Web Audio frames or 60 FPS animation ticks.
