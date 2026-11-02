# Track Specification: Responsive Toolbar Overflow & Wrapping

## Overview
In the upper floating playback toolbar (`Toolbar`), controls and action buttons on the right side (Undo, Redo, Debug Data overlay toggle, Preset Settings modal gear, and Live/Studio Mode toggle) become inaccessible when horizontal preview real estate is constrained. This occurs because the toolbar is anchored at `right-4` with `max-w-[calc(100%-2rem)]` and flex layout defaults to `flex-nowrap`, causing items to overflow horizontally off the right canvas edge and under the split pane.

This track implements a responsive multi-line layout combining semantic control clustering, flexbox wrapping (`flex-wrap`), right-aligned stacking (`justify-end`), and dynamic subtle scaling to ensure all 9 controls and actions remain fully contained, visible, and interactive within the preview canvas from full width down to 320px.

---

## Functional Requirements

1. **Semantic Control Clustering**:
   Group individual toolbar elements into cohesive flex clusters so they don't awkwardly fragment mid-control:
   - **Playback & Source Cluster**: Play/Pause button + Source selector pill toggle (Sample / File / Mic).
   - **Preset & Progress Cluster**: Audio progress scrubber / loading indicator (when active) + Generative Preset Selector dropdown (`PresetSelector`).
   - **Action Tools Cluster**: Undo button, Redo button, Debug Data overlay toggle (`Activity`), Preset Settings modal button (`Settings`), Studio / Live Mode toggle (`Maximize2`/`Minimize2`).

2. **Responsive Multi-Row Wrapping**:
   - Apply `flex-wrap gap-2 justify-end` to the toolbar container so that clusters wrap onto subsequent rows when horizontal space is constrained.
   - Maintain right alignment (`justify-end`) so wrapped rows hug the right edge with uniform margin (`right-4`) and flow downward cleanly.
   - When wrapped across multiple rows, ensure the container background, border, and glassmorphic backdrop expand to encompass all wrapped rows seamlessly.

3. **Canvas Containment & Bounds Safety**:
   - Ensure the toolbar container and all child elements never overflow the canvas right, left, or top boundaries.
   - When the preview pane is narrow (< 480px) and the FPS overlay is active, ensure the toolbar positions below the FPS badge (`top-14` or responsive offset) to avoid visual collisions.
   - Prevent clipping of dropdown menus (PresetSelector) and modal dialog triggers.

4. **Adaptive Scale & Dimension Detection**:
   - Calculate natural toolbar width based on unconstrained cluster widths rather than clamped `offsetWidth`.
   - Apply subtle proportional scaling only at extreme constraints (e.g. < 360px) where the widest individual cluster would exceed the available container width.
   - Ensure minimum scale never renders buttons smaller than standard interactive touch/click guidelines (minimum 32px height).

---

## Non-Functional Requirements
- Maintain 60 FPS performance on WebGL rendering and audio telemetry loops without layout thrashing.
- Zero unnecessary React re-renders during playback.
- Maintain code coverage > 80% for toolbar components.

---

## Acceptance Criteria
- All 9 toolbar controls and action buttons are visible and clickable across viewport / pane widths from 1920px down to 320px.
- Vitest unit tests verify that toolbar wraps into multiple rows and maintains all buttons within bounding box at narrow widths (600px, 480px, 360px, 320px).
- Playwright E2E tests confirm clickability and actionability of right-side buttons (Undo, Redo, Debug, Settings, Studio Mode) under narrow preview canvas widths.
- All existing 401+ tests continue to pass with zero regressions.

---

## Out of Scope
- Modifying canvas WebGL rendering engine or audio processing nodes.
- Redesigning the parameter inspector or node graph layout.
