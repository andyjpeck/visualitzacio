# Colormap Component Proposal

> **Component Type:** `colormap`  
> **Status:** Draft / Initial Concept (Detailed specification to be defined)

---

## 1. Overview & Vision

The **Colormap** component maps incoming pixel colors, luminance values, or normalized gradient indices to new color palettes. Inspired by Winamp AVS's iconic Color Map effect, it enables dramatic color grading, thermal heatmaps, psychedelic palette cycling, and false-color transformations.

A central highlight of this component will be its visual representation: AVS represented color maps with an intuitive, visual gradient bar where users could visually place color stops, adjust color transitions, and watch palette cycles travel across the spectrum in real time.

---

## 2. Preliminary Concept

- **Gradient Bar & Stop Editor:** Visual UI element allowing users to add, slide, and pick RGB/HSL color stops.
- **Palette Cycling:** Configurable cycling direction and rate, modulatable by audio ($TIME, $BPM, or beat pulses).
- **Lookup Modes:**
  - Luminance to Palette (grayscale intensity maps to gradient).
  - Hue Shift / Rotation.
  - Multi-band frequency mapping (Bass/Mid/Treble drive separate color regions).
- **Shader Implementation:** Accelerated via a 1D or 2D gradient lookup texture (LUT) in a WebGL fragment shader pass.

---

## 3. Pending Specification Details

> [!NOTE]
> This proposal is an early conceptual placeholder. Full technical specification, parameter schemas, and UI mockups will be drafted in a dedicated planning task.

Details to be specified in the future:
1. Exact parameter schema (`stops`, `cycle_speed`, `blend_mode`, `interpolation`).
2. Interaction ergonomics for the visual gradient editor in the component inspector.
3. Audio expression bindings (modulating stop positions via `f(x)` formulas).
4. Preset serialization format for reusable color map palettes.
