import * as THREE from 'three'

/**
 * Numeric identifiers mapping directly to GLSL integer branch conditions.
 */
export const BLEND_MODES = {
  replace: 0,
  additive: 1,
  maximum: 2,
  minimum: 3,
  subtractive: 4,
  multiplicative: 5,
} as const

export type BlendModeName = keyof typeof BLEND_MODES

/**
 * Evaluates color blending arithmetic between background and foreground colors.
 * Used for CPU-side verification, unit testing, and software fallback.
 *
 * @param bg - Normalized RGBA background [0..1].
 * @param fg - Normalized RGBA foreground [0..1].
 * @param mode - BlendModeName identifier.
 * @param opacity - Opacity modulation factor [0..1].
 */
export function evaluateBlend(
  bg: [number, number, number, number],
  fg: [number, number, number, number],
  mode: BlendModeName,
  opacity = 1.0,
): [number, number, number, number] {
  const o = Math.max(0.0, Math.min(1.0, opacity))

  switch (mode) {
    case 'replace':
      return [
        bg[0] * (1 - o) + fg[0] * o,
        bg[1] * (1 - o) + fg[1] * o,
        bg[2] * (1 - o) + fg[2] * o,
        bg[3] * (1 - o) + fg[3] * o,
      ]

    case 'additive':
      return [
        Math.min(1.0, bg[0] + fg[0] * o),
        Math.min(1.0, bg[1] + fg[1] * o),
        Math.min(1.0, bg[2] + fg[2] * o),
        Math.min(1.0, bg[3] + fg[3] * o),
      ]

    case 'maximum':
      return [
        Math.max(bg[0], fg[0] * o),
        Math.max(bg[1], fg[1] * o),
        Math.max(bg[2], fg[2] * o),
        Math.max(bg[3], fg[3] * o),
      ]

    case 'minimum': {
      const modFg0 = 1.0 * (1 - o) + fg[0] * o
      const modFg1 = 1.0 * (1 - o) + fg[1] * o
      const modFg2 = 1.0 * (1 - o) + fg[2] * o
      const modFg3 = 1.0 * (1 - o) + fg[3] * o
      return [
        Math.min(bg[0], modFg0),
        Math.min(bg[1], modFg1),
        Math.min(bg[2], modFg2),
        Math.min(bg[3], modFg3),
      ]
    }

    case 'subtractive':
      return [
        Math.max(0.0, bg[0] - fg[0] * o),
        Math.max(0.0, bg[1] - fg[1] * o),
        Math.max(0.0, bg[2] - fg[2] * o),
        Math.max(0.0, bg[3] - fg[3] * o),
      ]

    case 'multiplicative':
      return [
        bg[0] * (1 - o) + bg[0] * fg[0] * o,
        bg[1] * (1 - o) + bg[1] * fg[1] * o,
        bg[2] * (1 - o) + bg[2] * fg[2] * o,
        bg[3] * (1 - o) + bg[3] * fg[3] * o,
      ]
  }
}

/**
 * Transforms UV texture coordinates around the normalized center (0.5, 0.5)
 * applying scale, rotation, and translation offsets.
 *
 * @param uv - Input UV coordinates [u, v].
 * @param scale - Uniform or 2D scaling factor. Values > 1 zoom outward; < 1 zoom inward.
 * @param rotationRad - Rotation angle in radians around center.
 * @param offset - 2D translational offset [x, y].
 */
export function transformUv(
  uv: [number, number],
  scale: [number, number] | number,
  rotationRad: number,
  offset: [number, number],
): [number, number] {
  const sx = typeof scale === 'number' ? scale : scale[0]
  const sy = typeof scale === 'number' ? scale : scale[1]

  const safeSx = Math.max(Math.abs(sx), 0.0001)
  const safeSy = Math.max(Math.abs(sy), 0.0001)

  // Center offset
  const dx = uv[0] - 0.5
  const dy = uv[1] - 0.5

  // Rotate around center
  const cosT = Math.cos(-rotationRad)
  const sinT = Math.sin(-rotationRad)
  const rx = dx * cosT - dy * sinT
  const ry = dx * sinT + dy * cosT

  // Scale and translate
  const ox = rx / safeSx - offset[0]
  const oy = ry / safeSy - offset[1]

  return [ox + 0.5, oy + 0.5]
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uBaseTexture;
uniform sampler2D uBlendTexture;
uniform int uHasBase;
uniform float uOpacity;
uniform int uBlendMode;
uniform vec2 uScale;
uniform float uRotation;
uniform vec2 uOffset;

varying vec2 vUv;

vec2 transformUv(vec2 uv, vec2 scale, float rotation, vec2 offset) {
  vec2 p = uv - vec2(0.5);
  float c = cos(-rotation);
  float s = sin(-rotation);
  p = mat2(c, -s, s, c) * p;
  p = p / max(scale, vec2(0.0001));
  p = p - offset;
  return p + vec2(0.5);
}

void main() {
  if (uHasBase == 0) {
    // Single-texture pass: sample uBlendTexture transformed with opacity
    vec2 sampleUv = transformUv(vUv, uScale, uRotation, uOffset);
    vec4 fg = vec4(0.0);
    if (sampleUv.x >= 0.0 && sampleUv.x <= 1.0 && sampleUv.y >= 0.0 && sampleUv.y <= 1.0) {
      fg = texture2D(uBlendTexture, sampleUv);
    }
    gl_FragColor = vec4(fg.rgb * uOpacity, fg.a * uOpacity);
    return;
  }

  // Dual-texture compositing pass:
  // uBaseTexture = decayed feedback history / background (transformed by scale, rotation, offset, decayed by uOpacity)
  vec2 trailUv = transformUv(vUv, uScale, uRotation, uOffset);
  vec4 bg = vec4(0.0);
  if (trailUv.x >= 0.0 && trailUv.x <= 1.0 && trailUv.y >= 0.0 && trailUv.y <= 1.0) {
    bg = texture2D(uBaseTexture, trailUv) * uOpacity;
  }

  // uBlendTexture = fresh child render / foreground (untransformed at screen vUv)
  vec4 fg = texture2D(uBlendTexture, vUv);

  // Compute effective foreground intensity/alpha for alpha-masking
  float fgAlpha = fg.a > 0.0 ? fg.a : clamp(max(fg.r, max(fg.g, fg.b)) * 3.0, 0.0, 1.0);

  vec4 result = bg;

  if (uBlendMode == 0) {
    // replace: blend fg over decayed bg based on fg opacity/alpha
    result = mix(bg, fg, fgAlpha);
  } else if (uBlendMode == 1) {
    // additive: add fresh foreground light to background trails
    result = clamp(bg + fg, 0.0, 1.0);
  } else if (uBlendMode == 2) {
    // maximum: brightest per-channel pixels win
    result = max(bg, fg);
  } else if (uBlendMode == 3) {
    // minimum: darkest per-channel pixels win (falls back to fg where bg is empty)
    if (bg.a < 0.01 && length(bg.rgb) < 0.01) {
      result = fg;
    } else if (fgAlpha < 0.01) {
      result = bg;
    } else {
      result = min(bg, fg);
    }
  } else if (uBlendMode == 4) {
    // subtractive: inverted foreground modulation on background trails, falling back to fg when trails are dark
    if (bg.a < 0.01 && length(bg.rgb) < 0.01) {
      result = fg;
    } else {
      result = vec4(max(vec3(0.0), bg.rgb - fg.rgb), max(bg.a, fg.a));
    }
  } else if (uBlendMode == 5) {
    // multiplicative: color-filters feedback trails where both exist, preserving fresh foreground on empty background
    if (bg.a < 0.01 && length(bg.rgb) < 0.01) {
      result = fg;
    } else {
      result = vec4(bg.rgb * fg.rgb + fg.rgb * 0.15, max(bg.a, fg.a));
    }
  }

  gl_FragColor = result;
}
`

/**
 * Creates a THREE.ShaderMaterial configured for multi-pass compositing and feedback loops.
 */
export function createCompositingMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uBaseTexture: { value: null },
      uBlendTexture: { value: null },
      uHasBase: { value: 0 },
      uOpacity: { value: 1.0 },
      uBlendMode: { value: BLEND_MODES.replace },
      uScale: { value: new THREE.Vector2(1.0, 1.0) },
      uRotation: { value: 0.0 },
      uOffset: { value: new THREE.Vector2(0.0, 0.0) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
}
