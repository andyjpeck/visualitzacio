# Viewport Canvas (`src/ui/canvas/`)

This directory contains the full-screen canvas container for the 3D visualizer.

## Components & Tests

- [**`viewport-canvas.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/canvas/viewport-canvas.tsx):
  - Injects and mounts an HTML `<canvas>` element into the DOM.
  - Instantiates `RenderEngine` and sets up the root `master-frame-buffer` with the `TestVisualNode` attached.
  - Dynamically binds store feedback parameters (`feedbackEnabled`, `feedbackBlendMode`, `feedbackOpacity`, `feedbackScale`, `feedbackRotation`) to the engine using `getDefaultExpressionEngine()`.
  - Sets up a 150ms debounced `ResizeObserver` to resize the engine without thrashing during window resize events.
  - Safely disposes the WebGL context, frame buffers, and observers when unmounted.
- [**`viewport-canvas.test.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/canvas/viewport-canvas.test.tsx):
  - Integration test verifying viewport canvas mounting and testid container presence.
