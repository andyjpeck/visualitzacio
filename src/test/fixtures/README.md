# Test Fixtures (`src/test/fixtures/`)

This directory provides mock fixtures and synthetic environments for headless unit and integration testing.

## Modules

- [**`audio-context-mock.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/test/fixtures/audio-context-mock.ts):
  Synthetic Web Audio `AudioContext`, `AnalyserNode`, `GainNode`, and `MediaStreamAudioSourceNode` mocks for testing playback, volume controls, and mic permissions.

- [**`renderer-mock.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/test/fixtures/renderer-mock.ts):
  Mock implementation of `RendererLike` providing dummy DOM canvas elements and spy hooks for `render`, `setSize`, `setPixelRatio`, and `dispose`.

- [**`scheduler-mock.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/test/fixtures/scheduler-mock.ts):
  Deterministic, manual virtual-clock scheduler implementing `Scheduler` (`now`, `requestFrame`, `cancelFrame`, `triggerFrame`). Allows advancing virtual time and inspecting frame counts without async race conditions.
