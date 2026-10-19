# Track 1: Foundation Reactive Canvas & Audio Testbed

This track establishes the core foundation for Visualització:
- Web Audio API pipeline (`AudioManager`) with procedural beat generation, microphone capture, and local audio file loading with seeking.
- Real-time DSP analysis (`AudioAnalyzer`) extracting frequency bands ($BASS, $MID, $TREBLE), RMS energy, and percussive beat detection.
- Core 60 FPS Two-Plane WebGL rendering loop (`RenderEngine`) with in-place mutable `FrameContext`.
- Cyberpunk 3D testbed scene (`TestVisualNode`) featuring a faceted crystal, wireframe lattice, halo ring, and dynamic neon lighting.
- UI layer with floating glassmorphic toolbar, FPS badge, preset configuration modal, and instant telemetry HUD.

## Files
- `spec.md`: Detailed technical specifications and acceptance criteria.
- `plan.md`: Step-by-step phased execution plan with test-driven tasks.
- `metadata.json`: Track status, active phase, and tracking metadata.
- `index.md`: Track summary and verification log.
