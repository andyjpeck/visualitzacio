# Audio Subsystem (`src/audio/`)

The `audio` directory provides Web Audio API graph management, digital signal processing (DSP), live microphone capture, procedural drum synthesis, and local file playback with track seeking.

## Key Modules

- [**`audio-manager.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/audio/audio-manager.ts):
  - Manages the Web Audio `AudioContext` lifecycle and graph routing.
  - Controls output gain volume and active inputs across procedural drum loops, uncompressed microphone streams, and custom local audio files.
  - Enforces mutual exclusivity between sources so only one audio source is active at a time.
  - Provides precise track duration, current time tracking, and `seek(seconds)` scrubbing for local files.
  - Exposes an active `AnalyserNode` connected to a silent sink (`0.0` gain) to keep the browser audio thread pumped without speaker feedback.

- [**`audio-file-loader.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/audio/audio-file-loader.ts):
  - Handles asynchronous audio file reading (via `file.arrayBuffer()` or streaming `FileReader`) and `ctx.decodeAudioData()`.
  - Provides progress tracking percentages and stage descriptions across read, decode, and finalize phases.

- [**`audio-analyzer.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/audio/audio-analyzer.ts):
  - Extracts frequency energy into discrete logarithmic bands with customizable cutoff boundaries:
    - **`$BASS`** (default 20 Hz – 250 Hz)
    - **`$MID`** (default 250 Hz – 4000 Hz)
    - **`$TREBLE`** (default 4000 Hz – 16000 Hz)
  - Supports dynamic runtime cutoff updates via `setAudioBands()` synchronized from preset settings.
  - Provides `decayIdle(frameContext)` to smoothly decay transient audio variables when paused or idle.
  - Computes smoothed Root-Mean-Square (RMS) amplitude with asymmetric attack and decay filters.
  - Detects percussive transients to trigger instantaneous **`$BEAT`** flags and calculates rolling **`$BPM`** tempo.
  - Exposes utility functions `logScaleToFrequency` and `frequencyToLogScale` for logarithmic spectrum mapping ($20\text{ Hz} \rightarrow 20,000\text{ Hz}$).

- [**`procedural-beat.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/audio/procedural-beat.ts):
  - Synthesizes an in-memory 4/4 electronic drum loop (sub-bass kick pitch drop, noise-burst snare, and stereo hi-hats) using continuous phase accumulation.
