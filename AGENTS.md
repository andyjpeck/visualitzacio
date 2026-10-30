# Visualització AI Agent Guide 🤖🎨

Welcome, AI Agent! This repository contains **Visualització**, a modular WebGL generative audio visualizer and visual synthesizer.

---

## 🎨 Visual Presets & The Preset Designer Skill

If your task involves **creating, modifying, debugging, or designing visual presets**:
- **Activate the Workspace Skill**: [`preset-designer`](.agents/skills/preset-designer/SKILL.md) located at `.agents/skills/preset-designer/SKILL.md`.
- **Authoritative Documentation**: Ground all technical decisions in [`docs/preset-authoring/`](docs/preset-authoring/):
  - [`preset-schema.md`](docs/preset-authoring/preset-schema.md) — Canonical PresetSchema v2 structure & validation
  - [`expression-language.md`](docs/preset-authoring/expression-language.md) — Expression syntax, telemetry variables, and audio functions
  - [`duperscope-scripting.md`](docs/preset-authoring/duperscope-scripting.md) — 4-phase procedural mathematics lifecycle
  - [`frame-buffer-compositing.md`](docs/preset-authoring/frame-buffer-compositing.md) — Feedback loops, blend modes, and transforms
- **Mandatory Output Rule**: Whenever you generate or update a preset, provide the complete JSON inside a collapsed `<details>` block with a copy button, followed immediately by the 1-click preview link (`?preset=<name>&play=1`).

---

## 🧱 Repository Architecture & Tenets

For general codebase modifications, architecture rules, and testing standards, see:
- [`GEMINI.md`](GEMINI.md) — Component Architecture Tenets, Two-Plane Performance Contracts, and Working Agreements.
- [`conductor/`](conductor/) — Project specifications and track history.

### Essential Development Commands
```bash
npm test -- --run     # Run full test suite (Vitest)
npx oxlint src        # Static analysis and linting
npm run build         # TypeScript typecheck (tsc -b) and Vite bundle
```
