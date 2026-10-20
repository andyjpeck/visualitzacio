# Parameter Inspector & Universal f(x) Expression Engine

This directory contains the universal docked **Parameter Inspector** module and tactile dynamic controls for Track 4: Visual Studio Shell, Node Graph & Preset Import/Export.

## Architecture & Capabilities

1. **ParameterInspector (`parameter-inspector.tsx`):**
   - Docked in the top-right split view pane above the visual node graph.
   - Synchronized with `selectedNodeId` in `useAppStore`.
   - Modulates properties of the active node (MasterFrameBuffer, FrameBuffer, StaticImage, TestVisual).
   - Falls back to global preset performance settings (Target FPS, Resolution Scale) when no node is selected.
   - Features component preset selection for rapid Frame Buffer templates.

2. **ParameterRow (`parameter-row.tsx`):**
   - Universal dual-mode parameter control supporting tactile fixed inputs (sliders, rotary knobs, dropdowns, toggles) and mathematical formulas.
   - Seamlessly morphs on `f(x)` toggle into an AST expression formula editor.
   - Embeds the zero-allocation 60 FPS real-time numerical readout and 180-frame sliding-window sparkline canvas line chart.
   - Focus synchronization: highlighted with an animated cyber-glow ring and auto-scrolls into view when clicked from any node card on the graph canvas.

3. **ExpressionAutocomplete (`expression-autocomplete.tsx`):**
   - Inline autocomplete dropdown for mathematical formulas.
   - Detects `$` (system variables) and `#` (system functions) keystrokes under cursor.
   - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) with cursor repositioning.

## Module Exports

| File | Purpose |
| :--- | :--- |
| `parameter-inspector.tsx` | Docked top parameter inspector with node data bindings |
| `parameter-inspector.test.tsx` | Vitest unit tests for parameter inspector rendering and mutations |
| `parameter-row.tsx` | Tactile fixed controls & f(x) formula morphing with live sparkline |
| `parameter-row.test.tsx` | Vitest unit tests for slider, dropdown, toggle, and f(x) morphing |
| `expression-autocomplete.tsx` | Keyboard-navigable variable and function formula suggestions |
| `expression-autocomplete.test.tsx` | Vitest unit tests for autocomplete triggers and token insertion |
