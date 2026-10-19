# System Functions Reference (#FUNCTION)

This document defines the built-in Digital Signal Processing (DSP) and envelope functions available within Visualització's Dynamic Expression Engine and scriptable components (e.g., Duperscope).

All system functions use an uppercase name prefixed with a hash/pound sign (`#`) and **always require parentheses** `()`.

---

## Function Catalog

### 1. `#FFT(lower_band, band_width, [channel = 0])`
Calculates the normalized frequency energy of a custom frequency window from the live audio FFT spectrum.

- **Arguments:**
  - `lower_band` (`float`, range `0.0` to `1.0`): The normalized start frequency. Mapped logarithmically across the human audible spectrum ($20\text{ Hz}$ to $20,000\text{ Hz}$) using $f = 20 \times 10^{3x}$.
  - `band_width` (`float`, range `0.0` to `1.0`): The width of the frequency window to average.
  - `channel` (`int`, optional, default `0`): Stereo channel selection:
    - `0`: Center / Mono mixdown ($(Left + Right) / 2$)
    - `1`: Left audio channel only
    - `2`: Right audio channel only
- **Returns:** `float` in range `0.0` to `1.0`.
- **Examples:**
  - `#FFT(0.0, 0.25, 0)`: Evaluates sub-bass and bass energy on the mono channel.
  - `#FFT(0.8, 0.2, 1)`: Evaluates high treble sparkle on the left channel only.

---

### 2. `#WAVEFORM(position, [channel = 0])`
Samples instantaneous time-domain audio waveform amplitude at a specific normalized position.

- **Arguments:**
  - `position` (`float`, range `0.0` to `1.0`): Normalized index along the current audio buffer window ($0.0$ is the start of the buffer, $1.0$ is the end).
  - `channel` (`int`, optional, default `0`):
    - `0`: Center / Mono mixdown ($(Left + Right) / 2$)
    - `1`: Left audio channel only
    - `2`: Right audio channel only
- **Returns:** `float` in range `-1.0` to `1.0`.
- **Example:**
  - `#WAVEFORM(0.5, 0)`: Samples the center sample of the active audio waveform.

---

### 3. `#BEAT([decay_seconds = 0.2])` / `#BEAT_SECONDS([decay_seconds = 0.2])`
Generates a transient beat attack pulse with a smooth exponential decay calculated over elapsed time in seconds.

- **Arguments:**
  - `decay_seconds` (`float`, optional, default `0.2`): The duration in seconds over which the pulse decays toward `0.0`.
- **Behavior:**
  - When a beat transient occurs, the function jumps instantly to `1.0`.
  - On subsequent frames, it decays following an exponential curve $e^{-t / \tau}$ toward `0.0`.
- **Returns:** `float` in range `0.0` to `1.0`.
- **Example:**
  - `1.0 + #BEAT(0.15) * 0.4`: Causes an element to punch up in scale on each beat and smoothly return to baseline over 150 milliseconds.

---

### 4. `#BEAT_FRAMES([decay_frames = 12], [curve = "exponential"])`
Generates a transient beat attack pulse that decays toward `0.0` over a specified frame count, supporting multiple decay curve mechanisms.

- **Arguments:**
  - `decay_frames` (`int`, optional, default `12`): The number of render frames over which the pulse decays toward `0.0`.
  - `curve` (`string` or identifier, optional, default `"exponential"`): The mathematical decay curve to apply:
    - `"exponential"` (default): Smooth natural analog decay ($e^{-k \cdot t}$), starting steep and tapering off softly.
    - `"linear"`: Constant rate decay ($(1 - f / \text{decay\_frames})$), producing a mechanical, steady fade to zero.
    - `"logarithmic"`: Inverted logarithmic decay (rapid initial drop followed by an elongated tail).
- **Behavior:**
  - When an instantaneous beat transient occurs, the pulse resets to `1.0`.
  - On subsequent render frames, it attenuates according to the selected `curve` until reaching `0.0` at frame `decay_frames`.
- **Returns:** `float` in range `0.0` to `1.0`.
- **Examples:**
  - `#BEAT_FRAMES(12)`: Decays exponentially over 12 frames (~200ms at 60 FPS).
  - `#BEAT_FRAMES(24, "linear")`: Decays linearly over 24 frames (~400ms at 60 FPS).
  - `#BEAT_FRAMES(8, "logarithmic")`: Drops sharply over 8 frames with a logarithmic tail.
