# Layer Complexity & Static Telemetry (`src/ui/telemetry/`)

This directory implements the zero-runtime-overhead Tier 0 Static Computational Complexity & Anti-Pattern Lint Model for the Layers Tree Outliner.

## Files

- [**`layer-complexity.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/telemetry/layer-complexity.ts):
  - `computeSceneLayerComplexity(nodes, resolutionScale)`: Analyzes the React Flow scene graph in the UI Control Plane (`useMemo`) to compute per-layer direct cost scores (`selfScore`), container rollups (`subtreeScore`), normalized percentage cost shares (`sharePercent`, `subtreeSharePercent`), visual severity tiers (`bypassed | low | medium | high | heavy`), full-screen shader pass counts, `HalfFloatType` FBO VRAM estimates (`MB`), procedural AST/point loop operation estimates, and actionable optimization tips (`lintWarnings`).
- [**`layer-complexity.test.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/telemetry/layer-complexity.test.ts):
  - Unit tests verifying percentage share normalization, pass-through vs. ping-pong feedback FBO accounting, Duperscope point/AST cost scaling, and anti-pattern lint detection.
