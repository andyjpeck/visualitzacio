import * as THREE from 'three'

/**
 * GLSL Vertex shader for rendering the full-screen 2D compositing quad.
 */
export const MASK_COMPOSITOR_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * GLSL Fragment shader performing 1-pass 3-way texture compositing (Foreground, Background, Mask).
 */
export const MASK_COMPOSITOR_FRAGMENT_SHADER = `
uniform sampler2D uForegroundTexture;
uniform sampler2D uBackgroundTexture;
uniform sampler2D uMaskTexture;
uniform int uHasForeground;
uniform int uHasBackground;
uniform int uHasMask;
uniform int uMaskInvert;

varying vec2 vUv;

void main() {
  vec4 fg = uHasForeground == 1 ? texture2D(uForegroundTexture, vUv) : vec4(0.0, 0.0, 0.0, 0.0);
  vec4 bg = uHasBackground == 1 ? texture2D(uBackgroundTexture, vUv) : vec4(0.0, 0.0, 0.0, 0.0);
  float maskVal = uHasMask == 1 ? texture2D(uMaskTexture, vUv).r : 0.0;

  if (uMaskInvert == 1) {
    maskVal = 1.0 - maskVal;
  }

  vec4 blended = mix(fg, bg, clamp(maskVal, 0.0, 1.0));
  gl_FragColor = blended;
}
`

/**
 * Creates a THREE.ShaderMaterial configured for 1-pass 3-way mask compositing.
 */
export function createMaskCompositorMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: MASK_COMPOSITOR_VERTEX_SHADER,
    fragmentShader: MASK_COMPOSITOR_FRAGMENT_SHADER,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uForegroundTexture: { value: null },
      uBackgroundTexture: { value: null },
      uMaskTexture: { value: null },
      uHasForeground: { value: 0 },
      uHasBackground: { value: 0 },
      uHasMask: { value: 0 },
      uMaskInvert: { value: 0 },
    },
  })
}

/**
 * Evaluates software 3-way mask blending between foreground and background.
 * Used for CPU verification, unit testing, and headless fallback.
 *
 * @param fg - Normalized RGBA foreground [0..1].
 * @param bg - Normalized RGBA background [0..1].
 * @param mask - Normalized mask factor [0..1].
 * @param invert - Whether to invert the mask value (1 - mask).
 */
export function evaluateMaskMix(
  fg: [number, number, number, number],
  bg: [number, number, number, number],
  mask: number,
  invert = false,
): [number, number, number, number] {
  let m = Math.max(0.0, Math.min(1.0, mask))
  if (invert) {
    m = 1.0 - m
  }
  return [
    fg[0] * (1.0 - m) + bg[0] * m,
    fg[1] * (1.0 - m) + bg[1] * m,
    fg[2] * (1.0 - m) + bg[2] * m,
    fg[3] * (1.0 - m) + bg[3] * m,
  ]
}
