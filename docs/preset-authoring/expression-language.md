# Expression Language & Dynamic Parameters Reference

Visualització includes a real-time, sandboxed mathematical expression engine powered by `expr-eval`. Any numeric parameter can be bound to either a static constant or a dynamic formula that evaluates at 60 FPS.

---

## ⚡ Syntax & Sandbox Rules

1. **Pure Mathematical Formulas**: Supports standard arithmetic (`+`, `-`, `*`, `/`, `%`, `^`), parentheses, and comparisons (`<`, `>`, `<=`, `>=`, `==`).
2. **Strict Security Sandboxing**:
   - Property navigation dots (`obj.prop`) are strictly forbidden to prevent object traversal.
   - Dynamic JavaScript execution (`eval`, `Function`, `window`, `document`) is disallowed.
3. **Prefix Conventions**:
   - `$`: Reserved for engine and audio telemetry variables (e.g. `$TIME`, `$BASS`).
   - `#`: Reserved for DSP and wave-generator functions (e.g. `#FFT(0.1)`, `#BEAT_FRAMES(15)`).

---

## 📊 System Variables Reference (`$VARIABLE`)

All system variables are injected into scope each frame with zero heap allocations:

| Variable | Description | Range / Unit | Typical Use |
| :--- | :--- | :--- | :--- |
| **`$TIME`** | Continuous running time since engine start | Seconds (float) | Continuous rotation, wave phase |
| **`$DT`** | Delta time elapsed since last frame | Seconds (clamped $\le 0.1$) | Frame-rate independent integration |
| **`$FRAME`** | Monotonically increasing frame index | Integer ($0, 1, 2, \dots$) | Strobe triggers, frame counters |
| **`$FPS`** | Rolling measured frames-per-second | Float (e.g. $59.94$) | Adaptive detail scaling |
| **`$WIDTH`** | Viewport width | CSS Pixels | Aspect ratio calculations |
| **`$HEIGHT`** | Viewport height | CSS Pixels | Aspect ratio calculations |
| **`$ASPECT`** | Viewport aspect ratio ($WIDTH / HEIGHT$) | Float (e.g. $1.777$) | Coordinate normalization |
| **`$PIXEL_RATIO`** | Hardware device pixel ratio | Float ($1.0$ to $2.0$) | Screen-space line thickness scaling |
| **`$BASS`** | Sub-bass energy (default 20–250 Hz) | Normalized $[0.0, 1.0]$ | Scale pulse, kick flashes, shockwaves |
| **`$MID`** | Mid-range energy (default 250–4000 Hz) | Normalized $[0.0, 1.0]$ | Color shifting, rotation velocity |
| **`$TREBLE`** | High-frequency energy (default 4–16 kHz) | Normalized $[0.0, 1.0]$ | Sparkle, line thickness, wireframe glow |
| **`$RMS`** | Root-Mean-Square total energy amplitude | Normalized $[0.0, 1.0]$ | Master brightness, glow intensity |
| **`$BEAT`** | Instantaneous transient beat flag | `1.0` on beat, `0.0` otherwise | Explosive flashes, camera shakes |
| **`$BPM`** | Estimated rolling tempo | Beats-per-minute (default $120.0$) | Tempo-synchronized animations |

---

## 🎛️ Audio & DSP Functions Reference (`#FUNCTION(...)`)

### 1. Audio Buffer Sampling
- **`#FFT(frequencyRatio)`**:
  - Samples the real-time FFT frequency spectrum using a logarithmic scale matching human hearing.
  - `frequencyRatio`: Normalized position in $[0.0, 1.0]$ ($0.0 \approx 20\text{ Hz}$, $1.0 \approx 20\text{ kHz}$).
  - *Returns*: Normalized amplitude in $[0.0, 1.0]$.
  - *Example*: `#FFT(0.1)` (samples bass energy), `#FFT(0.8)` (samples high hats).
- **`#WAVEFORM(timeRatio)`**:
  - Samples the instantaneous time-domain oscilloscope audio waveform.
  - `timeRatio`: Position across the active audio window in $[0.0, 1.0]$.
  - *Returns*: Bipolar audio amplitude in $[-1.0, 1.0]$.

### 2. Beat Decay Envelopes
- **`#BEAT(decaySeconds)`**:
  - Fires an instantaneous pulse of `1.0` on beat detection, then exponentially decays to `0.0` over `decaySeconds`.
  - *Formula*: $e^{-(\Delta t / \tau)}$
  - *Example*: `#BEAT(0.3)` (snappy 300ms kick drop).
- **`#BEAT_FRAMES(decayFrames, curveType?)`**:
  - Frame-based beat decay counter.
  - `decayFrames`: Number of frames to decay over (e.g. `20` frames $\approx 333\text{ms}$ at 60 FPS).
  - `curveType`: `'exp'` (default, exponential decay), `'lin'` (linear fade), or `'log'` (steep initial drop).
  - *Example*: `#BEAT_FRAMES(15, 'exp')`.

### 3. Periodic Wave Generators
- **`#TRI(frequency, offset?)`**: Triangle wave in $[-1.0, 1.0]$.
- **`#SAW(frequency, offset?)`**: Sawtooth wave in $[-1.0, 1.0]$.
- **`#SQR(frequency, offset?)`**: Square wave (`1.0` or `-1.0`).

### 4. Mathematical Helpers
- **`clamp(x, min, max)`**: Clamps `x` between `min` and `max`.
- **`lerp(a, b, t)`**: Linear interpolation between `a` and `b` by factor `t`.
- **`smoothstep(edge0, edge1, x)`**: Hermite smooth interpolation between 0 and 1.
- **`sin(x)`, `cos(x)`, `tan(x)`, `sqrt(x)`, `abs(x)`, `min(a, b)`, `max(a, b)`**: Standard math functions.
- **`PI`**, **`E`**: Mathematical constants.

---

## 💡 Practical Formula Examples

* **Audio-Pulsed Zoom Scale**:
  ```text
  1.0 + $BASS * 0.15 + #BEAT(0.2) * 0.1
  ```
* **Hypnotic Feedback Rotation**:
  ```text
  sin($TIME * 0.5) * 1.5 + $MID * 2.0
  ```
* **Decaying Phosphor Trail Opacity**:
  ```text
  clamp(0.92 + $TREBLE * 0.06, 0.85, 0.98)
  ```
* **Color Hue Cycling with Beat Flash**:
  ```text
  ($TIME * 0.1 + $BASS * 0.3) % 1.0
  ```
