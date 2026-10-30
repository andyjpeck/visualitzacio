# Preset Authoring Guide & Engine Documentation

Welcome to the **Visualització Preset Authoring Guide**. This documentation serves as the authoritative, ground-truth reference for creating real-time audio-reactive visual compositions.

---

## 🎨 Engine Overview & Architecture

Visualització is a modular WebGL (Three.js) visual synthesizer driven by the Web Audio API. Compositions are modeled as a **hierarchical tree of visual nodes** contained within a root **Master Output** frame buffer.

Visual presets are stored and loaded as clean, standardized JSON files conforming to **`PresetSchema` v2**.

### The 4 Core Primitives
Visualització adheres to the **Clean Primitive Philosophy**: a tight, orthogonal set of focused components that compose cleanly in the node graph without bloated monoliths.

1. **`masterFrameBuffer` / `frameBuffer`**:
   - Offscreen texture containers managing resolution scaling, blend modes, and dual-FBO ping-pong feedback motion trails (decay, scale, rotation, displacement).
   - Serves as the parent container for visual generators.
2. **`duperscopeNode` (Duperscope)**:
   - High-performance procedural generative synthesizer evaluating mathematical curve equations across 4 execution phases (`init`, `beat`, `frame`, `point`).
   - Renders variable-thickness screen-space quad ribbons (`lines`, `lineLoop`) or anti-aliased circular particle discs (`points`).
3. **`staticImage`**:
   - Static background or overlay image planes supporting aspect ratio preservation (`cover`, `contain`, `stretch`) and dynamic opacity modulation.
4. **`testVisual`**:
   - Diagnostic 3D multifaceted crystal with glowing neon wireframe and reactive pulse.

---

## 🤖 AI Agent Preset Designer Skill

If you are an AI assistant or agent designing presets for Visualització:
- Activate the workspace skill at [.agents/skills/preset-designer/SKILL.md](../../.agents/skills/preset-designer/SKILL.md).
- Follow the guidelines in [AGENTS.md](../../AGENTS.md).
- Always provide the complete, validated preset JSON inside a collapsed `<details>` block with a copy button, followed immediately by the 1-click preview link (`?preset=<name>&play=1`).

---

## 📚 Documentation Table of Contents

- [**Preset Schema v2 Reference (`preset-schema.md`)**](./preset-schema.md)  
  *Canonical JSON structure, metadata, settings, node parameters, and validation rules.*
- [**Expression Language & Dynamic Parameters (`expression-language.md`)**](./expression-language.md)  
  *Sandboxed math formulas, `$SYSTEM` telemetry variables, `#AUDIO` DSP functions, and wave generators.*
- [**Duperscope Generative Scripting (`duperscope-scripting.md`)**](./duperscope-scripting.md)  
  *4-phase lifecycle (`init`, `beat`, `frame`, `point`), local variables, draw modes, and algorithmic recipes.*
- [**Frame Buffer Compositing & Feedback (`frame-buffer-compositing.md`)**](./frame-buffer-compositing.md)  
  *Dual-FBO ping-pong feedback, GLSL blend modes, transform modulation, and `@NAME` buffer routing.*
