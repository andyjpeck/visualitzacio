# Floating Toolbar (`src/ui/toolbar/`)

This directory contains the main interactive control header of Visualització.

## Components

- [**`toolbar.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/toolbar/toolbar.tsx):
  - Top-right floating glassmorphic toolbar with cyberpunk aesthetics.
  - **Transport Play / Pause Button**: Starts/pauses procedural drums or custom audio files; automatically disabled when microphone capture is active.
  - **Source Toggle Buttons**: Ordered as **Sample → File → Mic**. Clicking opens file pickers or requests microphone permissions as appropriate.
  - **Progress & Seek Bar**: Dynamically appears when **File** is active, showing current elapsed time, total duration, and a draggable scrubber slider operating on 60 FPS RAF with zero React re-renders.
  - **Master Volume Control**: Interactive range slider adjusting output gain.
  - **HUD Toggle & Settings Gear**: Toggles FPS overlay and opens the Preset Performance Settings modal.
  - **Error Toast Banner**: Displays graceful error notifications if microphone permissions are denied or file decoding fails.
