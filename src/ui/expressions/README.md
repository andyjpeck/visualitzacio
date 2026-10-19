# UI Expression Components (`src/ui/expressions/`)

This directory contains reusable UI components and catalogs for dynamic mathematical expressions, designed for the dynamic testbed HUD and future right-hand inspector panels.

## Contents

- `expression-catalog.ts`: Curated catalog of preset formulas, quick-reference variables (`$BASS`, `$TIME`, etc.), and quick-reference system functions (`#BEAT`, `#FFT`, etc.) with documentation tooltips and tokens.
- `expression-sparkline.tsx`: 60 FPS real-time canvas line chart and direct-DOM value readout with dynamic min/max scaling and sliding-window memory management.
- `expression-input.tsx`: Monospace formula input with real-time syntax validation status badge and error diagnostic display.
- `expression-quick-reference.tsx`: Collapsible reference accordion with token inserters and hover explanation tooltips.
