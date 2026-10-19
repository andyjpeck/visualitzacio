/**
 * System telemetry frame context passed into render nodes and expression scopes.
 * Pre-allocated and mutated in-place each frame to avoid Garbage Collection (GC) pauses.
 */
export interface FrameContext {
  // Engine timing & loop
  $TIME: number
  $DT: number
  $FRAME: number
  $FPS: number

  // Viewport & canvas resolution
  $WIDTH: number
  $HEIGHT: number
  $ASPECT: number
  $PIXEL_RATIO: number

  // Audio frequency bands (normalized 0.0 to 1.0)
  $BASS: number
  $MID: number
  $TREBLE: number

  // Volume & transient energy
  $RMS: number
  $BEAT: number // Instantaneous binary flag: 1.0 on beat frame, 0.0 otherwise
  $BPM: number // Rolling tempo estimation (default 120.0)
}

/**
 * Creates an empty, pre-allocated FrameContext with default values.
 */
export function createDefaultFrameContext(): FrameContext {
  return {
    $TIME: 0.0,
    $DT: 1 / 60,
    $FRAME: 0,
    $FPS: 60.0,
    $WIDTH: 1920,
    $HEIGHT: 1080,
    $ASPECT: 1920 / 1080,
    $PIXEL_RATIO: 1.0,
    $BASS: 0.0,
    $MID: 0.0,
    $TREBLE: 0.0,
    $RMS: 0.0,
    $BEAT: 0.0,
    $BPM: 120.0,
  }
}
