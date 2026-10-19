# Viewport Canvas (`src/ui/canvas/`)

This directory contains the full-screen canvas container for the 3D visualizer.

## Components

- [**`viewport-canvas.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/canvas/viewport-canvas.tsx):
  - Injects and mounts an HTML `<canvas>` element into the DOM.
  - Instantiates `RenderEngine` and attaches the initial `TestVisualNode`.
  - Sets up a 150ms debounced `ResizeObserver` to resize the engine without thrashing during window resize events.
  - Safely disposes the WebGL context and observers when unmounted.
