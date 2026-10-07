# System Variables Reference ($VARIABLE)

This document defines the real-time reactive system variables available within Visualització's Dynamic Expression Engine and scriptable components (e.g., Duperscope).

All system variables use an uppercase name prefixed with a dollar sign (`$`). They are calculated once per video frame (~60 Hz) in the Render Data Plane and are read-only.

---

## Variable Catalog

| Variable | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| **`$BASS`** | `float` | `0.0` to `1.0` | Normalized energy of low-frequency audio spectrum (approx. 20 Hz – 250 Hz). Ideal for kick drums, sub-bass, and low rhythm modulation. |
| **`$MID`** | `float` | `0.0` to `1.0` | Normalized energy of mid-frequency audio spectrum (approx. 250 Hz – 4000 Hz). Ideal for vocals, synths, and snare transients. |
| **`$TREBLE`** | `float` | `0.0` to `1.0` | Normalized energy of high-frequency audio spectrum (approx. 4000 Hz – 16000 Hz). Ideal for hi-hats, cymbals, and shakers. |
| **`$RMS`** | `float` | `0.0` to `1.0` | Normalized Root-Mean-Square (RMS) audio energy. Measures overall perceived loudness and volume across all frequencies. |
| **`$BPM`** | `float` | `0.0` to `300.0` | Estimated or user-configured tempo in beats per minute. Defaults to `120.0` when no audio is playing or tempo is undetermined. |
| **`$BEAT`** | `float` | `0.0` or `1.0` | Discrete binary beat flag. Evaluates strictly to `1.0` on frames where an instantaneous audio beat transient is detected; evaluates to `0.0` on all other frames. (For smoothly decaying beat pulses, see `#BEAT()` in System Functions). |
| **`$TIME`** | `float` | $\ge 0.0$ | Elapsed playback/running time in fractional seconds since the engine started. Increases continuously. |
| **`$FRAME`** | `int` | $\ge 0$ | Monotonically increasing frame counter integer since engine start (0, 1, 2, ...). Useful for discrete step cycles. |

---

## Usage Examples

- **Pulse scale with bass:**
  `1.0 + $BASS * 0.3`
- **Continuous rotation over time:**
  `$TIME * 0.5`
- **High-frequency sparkle opacity:**
  `0.2 + $TREBLE * 0.8`
