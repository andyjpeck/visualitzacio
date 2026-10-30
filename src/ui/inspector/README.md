# Parameter Inspector & Universal f(x) Expression Engine

This directory contains the universal docked **Parameter Inspector** module and tactile dynamic controls for Track 4: Visual Studio Shell, Node Graph & Preset Import/Export and Track 5: Generative Visual Synthesis & Duperscope.

## Architecture & Capabilities

1. **ParameterInspector (`parameter-inspector.tsx`):**
   - Docked in the top-right split view pane above the workspace pane.
   - Synchronized with `selectedNodeId` in `useAppStore`.
   - Modulates properties of the active node (MasterFrameBuffer, FrameBuffer, StaticImage, TestVisual, DuperscopeNode).
   - Single-column vertical layout with descriptive tooltips across all parameters and dropdown options.
   - Features component preset selection (`ComponentPresetSelector`, `duperscope-preset-dropdown`) with dirty-state detection and confirmation modal (`BaseModalDialog`) protecting modified components from accidental overwrite.
   - Supports local image file upload and drag-and-drop dropzone for `StaticImageNode` with live thumbnail preview and Base64 JSON encoding.
   - Renders 4-Phase Procedural Script Editors (`init`, `beat`, `frame`, `point`) for `DuperscopeNode` with real-time syntax validation badges, diagnostic error banners, and 500ms debounced undo coalescing.
   - Falls back to global preset performance settings (Target FPS, Resolution Scale) when no node is selected.

2. **ParameterRow (`parameter-row.tsx`):**
   - Universal dual-mode parameter control supporting tactile fixed inputs (sliders, rotary knobs, dropdowns, toggles) and mathematical formulas.
   - Seamlessly morphs on `f(x)` toggle into an AST expression formula editor with formula string preservation across toggles and collapses.
   - Embeds the zero-allocation 60 FPS real-time numerical readout and 180-frame sliding-window sparkline canvas line chart.
   - Focus synchronization: highlighted with an animated cyber-glow ring and auto-scrolls into view when clicked from any node card on the graph canvas.

3. **ExpressionAutocomplete (`expression-autocomplete.tsx`):**
   - Inline autocomplete dropdown for mathematical formulas and Duperscope procedural phase scripts.
   - Detects `$` (system variables), `#` (system functions), and local variable identifiers (`n`, `i`, `v`, `x`, `y`, `r`, `g`, `b`, `a`, `linesize`, `skip`) under cursor.
   - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) with cursor repositioning.

4. **Component Preset Utilities (`component-preset-utils.ts`):**
   - Pure dirty-state comparison utilities (`isNodeDirty`) validating whether a node's parameter state differs from built-in template configurations before applying overwrites.

## Module Exports

| File | Purpose |
| :--- | :--- |
| `parameter-inspector.tsx` | Docked top parameter inspector with node data bindings, file upload, Duperscope 4-phase editor, and tooltips |
| `parameter-inspector.test.tsx` | Vitest unit tests for parameter inspector rendering, mutations, and image uploads |
| `duperscope-inspector.test.tsx` | Vitest unit tests for Duperscope inspector controls, 4-phase script editor, error banners, and template guards |
| `parameter-row.tsx` | Tactile fixed controls & f(x) formula morphing with live sparkline and tooltips |
| `parameter-row.test.tsx` | Vitest unit tests for slider, dropdown, toggle, and f(x) morphing |
| `component-preset-utils.ts` | Dirty-state detection helpers comparing active parameters to template baselines |
| `component-preset-selector.test.tsx` | Vitest unit tests for template overwriting and dirty-state confirmation modals |
| `expression-autocomplete.tsx` | Keyboard-navigable variable and function formula suggestions |
| `expression-autocomplete.test.tsx` | Vitest unit tests for autocomplete triggers and token insertion |
