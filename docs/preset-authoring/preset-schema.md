# Preset Schema v2 Specification

Visualització presets are declarative JSON files describing the complete visual composition, performance settings, audio frequency boundaries, and node hierarchy.

---

## 📄 Top-Level JSON Structure

A valid **`PresetSchema` v2** object contains four primary top-level keys:

```json
{
  "schemaVersion": 2,
  "metadata": {
    "name": "Cyberpunk Neon Storm",
    "author": "Visualització Artist",
    "version": 1,
    "description": "High-energy audio reactive tunnel with ping-pong feedback",
    "created": "2026-10-30T12:00:00.000Z"
  },
  "settings": {
    "targetFps": 60,
    "resolutionScale": 1.0,
    "audioBands": {
      "bassMin": 20,
      "bassMax": 250,
      "midMin": 250,
      "midMax": 4000,
      "trebleMin": 4000,
      "trebleMax": 16000
    }
  },
  "feedback": {
    "selectedTemplateId": "clean-slate",
    "feedbackEnabled": false,
    "feedbackBlendMode": "replace",
    "feedbackOpacity": 1.0,
    "feedbackScale": 1.0,
    "feedbackRotation": 0.0,
    "feedbackPositionX": 0.0,
    "feedbackPositionY": 0.0,
    "isCustomFeedbackConfig": false
  },
  "root": {
    "id": "master-frame-buffer",
    "type": "masterFrameBuffer",
    "label": "Master Output",
    "params": {
      "blendMode": "replace",
      "outputBlendMode": "replace",
      "inputBlendMode": "none",
      "opacity": 1.0,
      "scale": 1.0,
      "positionX": 0.0,
      "positionY": 0.0
    },
    "children": []
  }
}
```

---

## 🔍 Section Definitions

### 1. `schemaVersion`
- **Type**: `number` (Must be `2`).

### 2. `metadata`
- `name` *(string, required)*: Display title of the preset.
- `author` *(string, optional)*: Creator name.
- `version` *(number, optional)*: Revision integer (default `1`).
- `description` *(string, optional)*: Summary of the visual aesthetic or music genre match.
- `created` *(string, required)*: ISO 8601 timestamp.

### 3. `settings`
- `targetFps` *(number, required)*: Engine frame pacing (`30`, `60`, or `120`).
- `resolutionScale` *(number, required)*: Internal WebGL render resolution multiplier (`1.0`, `0.75`, `0.5`, `0.25`).
- `audioBands` *(object, required)*: Frequency crossover thresholds in Hertz:
  - `bassMin` / `bassMax`: Default `20` to `250` Hz.
  - `midMin` / `midMax`: Default `250` to `4000` Hz.
  - `trebleMin` / `trebleMax`: Default `4000` to `16000` Hz.

### 4. `feedback`
Global master feedback settings (controls overall canvas trail retention):
- `feedbackEnabled` *(boolean)*: Toggle dual-FBO feedback loop.
- `feedbackBlendMode` *(string)*: `'replace' | 'additive' | 'maximum' | 'minimum' | 'subtractive' | 'multiplicative'`.
- `feedbackOpacity` *(number | string)*: Decay factor (e.g. `0.92` or dynamic expression `'0.85 + $BASS * 0.1'`).
- `feedbackScale` *(number | string)*: Zoom modulation (e.g. `1.02` for vortex tunnel).
- `feedbackRotation` *(number | string)*: Spiral angle in degrees (e.g. `0.5`).
- `feedbackPositionX` / `feedbackPositionY` *(number | string)*: Drift offset in normalized coordinates.

---

## 🌳 Node Tree (`root` & `children`)

Visualització v2 uses a strictly nested tree. The root is always the `masterFrameBuffer`. Leaf visual generators and nested buffers are placed inside the `children` array.

### Node Structure (`PresetNode`)
```typescript
interface PresetNode {
  id: string              // Unique identifier (e.g. "duperscope-1")
  type: string            // Node type ("duperscopeNode", "frameBuffer", "staticImage")
  label?: string          // Display label shown in the outliner
  params: Record<string, unknown> // Node-specific parameters
  children?: PresetNode[] // Nested child nodes (only for buffer containers)
}
```

---

## 🎛️ Component Parameters by Type

### 1. `duperscopeNode` (Duperscope Synthesizer)
```json
{
  "id": "duperscope-tunnel",
  "type": "duperscopeNode",
  "label": "Tunnel Ribbon",
  "params": {
    "drawMode": "lineLoop",
    "audioMode": "waveform",
    "channel": "center",
    "opacity": 1.0,
    "initCode": "n = 360;\nangle = 0;",
    "beatCode": "angle = angle + 0.1;",
    "frameCode": "angle = angle + 0.015;\nr = 0.2 + $TREBLE * 0.8;\ng = 0.7;\nb = 1.0;",
    "pointCode": "theta = i * 2 * PI;\nradius = 0.5 + (v * 0.25) + ($BASS * 0.15);\nx = cos(theta + angle) * radius;\ny = sin(theta + angle) * radius;",
    "appliedTemplateId": "oscilloscope-tunnel"
  }
}
```
- `drawMode`: `'lines'` (segmented ribbon), `'lineLoop'` (closed continuous ribbon), or `'points'` (circular particle discs).
- `audioMode`: `'waveform'` (time-domain oscilloscope) or `'spectrum'` (logarithmic FFT frequency).
- `channel`: `'center'` (mixed mono), `'left'`, or `'right'`.
- `opacity`: Constant number `0.0`–`1.0` or dynamic expression.
- `initCode`, `beatCode`, `frameCode`, `pointCode`: 4-phase script blocks.

### 2. `frameBuffer` (Container & Ping-Pong Feedback)
```json
{
  "id": "feedback-layer",
  "type": "frameBuffer",
  "label": "Phosphor Feedback",
  "params": {
    "blendMode": "additive",
    "inputBlendMode": "none",
    "outputBlendMode": "additive",
    "feedback": true,
    "opacity": 0.94,
    "scale": 1.01,
    "rotation": 0.2,
    "positionX": 0.0,
    "positionY": 0.0,
    "saveTo": null,
    "loadFrom": null
  },
  "children": []
}
```
- `feedback`: `true` to enable ping-pong trail accumulation.
- `outputBlendMode`: How this buffer blends onto its parent (`'replace'`, `'additive'`, `'maximum'`, etc.).
- `saveTo` / `loadFrom`: Buffer pool tags (`'@NAME'`) for cross-pass texture routing.

### 3. `staticImage` (Background or Overlay Texture)
```json
{
  "id": "bg-texture",
  "type": "staticImage",
  "label": "Background Overlay",
  "params": {
    "imageUrl": "data:image/png;base64,...",
    "fitMode": "cover",
    "opacity": "0.6 + $BASS * 0.3",
    "saveTo": null
  }
}
```
- `imageUrl`: HTTP URL or Base64 data URI.
- `fitMode`: `'cover'`, `'contain'`, or `'stretch'`.
- `opacity`: Static number or dynamic formula.
