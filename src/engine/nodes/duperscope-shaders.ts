import * as THREE from 'three'

/**
 * GLSL Vertex shader for rendering variable-thickness line segments via Instanced Screen-Space Quad Ribbons.
 * Bypasses the 1.0px WebGL gl.lineWidth limitation, supporting linesize from 1px to 128px with 1:1 aspect correction.
 */
export const DUPERSCOPE_RIBBON_VERTEX_SHADER = `
attribute vec2 aCorner; // x: 0 (start) to 1 (end), y: -1 (left) to 1 (right)
attribute vec3 instanceStart;
attribute vec3 instanceEnd;
attribute vec4 instanceStartColor;
attribute vec4 instanceEndColor;
attribute float instanceStartSize;
attribute float instanceEndSize;

uniform vec2 uResolution;
uniform float uAspect;
uniform float uPixelRatio;
uniform float uOpacity;

varying vec4 vColor;

void main() {
  // Discard / collapse degenerate or zero-alpha segments
  if (instanceStartColor.a <= 0.0 && instanceEndColor.a <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vColor = vec4(0.0);
    return;
  }

  // Canonical NDC coordinates directly without square aspect distortion
  vec2 startNDC = instanceStart.xy;
  vec2 endNDC = instanceEnd.xy;

  // Convert NDC to pixel coordinates
  vec2 startPix = (startNDC * 0.5 + 0.5) * uResolution;
  vec2 endPix = (endNDC * 0.5 + 0.5) * uResolution;

  vec2 dir = endPix - startPix;
  float len = length(dir);
  if (len < 0.001) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vColor = vec4(0.0);
    return;
  }

  dir = dir / len;
  vec2 normal = vec2(-dir.y, dir.x);

  float size = mix(instanceStartSize, instanceEndSize, aCorner.x) * uPixelRatio;
  vec2 offsetPix = normal * (aCorner.y * 0.5 * size);

  vec2 currentPix = mix(startPix, endPix, aCorner.x) + offsetPix;
  vec2 currentNDC = (currentPix / uResolution) * 2.0 - 1.0;

  gl_Position = vec4(currentNDC, 0.0, 1.0);

  vColor = mix(instanceStartColor, instanceEndColor, aCorner.x);
  vColor.a *= uOpacity;
}
`

/**
 * GLSL Fragment shader for Instanced Screen-Space Quad Ribbons with alpha discard.
 */
export const DUPERSCOPE_RIBBON_FRAGMENT_SHADER = `
varying vec4 vColor;

void main() {
  if (vColor.a <= 0.0) discard;
  gl_FragColor = vColor;
}
`

/**
 * GLSL Vertex shader for rendering points mode with per-point size and 1:1 aspect correction.
 */
export const DUPERSCOPE_POINTS_VERTEX_SHADER = `
attribute vec4 color;
attribute float aSize;

uniform float uAspect;
uniform float uPixelRatio;
uniform float uOpacity;

varying vec4 vColor;

void main() {
  vec3 pos = position;
  gl_Position = vec4(pos, 1.0);
  gl_PointSize = max(1.0, aSize * uPixelRatio);
  vColor = color;
  vColor.a *= uOpacity;
}
`

/**
 * GLSL Fragment shader for rendering anti-aliased circular particles.
 */
export const DUPERSCOPE_POINTS_FRAGMENT_SHADER = `
varying vec4 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5 || vColor.a <= 0.0) discard;
  float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
  gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
}
`

/**
 * Creates a THREE.ShaderMaterial for rendering thick instanced screen-space quad ribbons.
 */
export function createDuperscopeRibbonMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: DUPERSCOPE_RIBBON_VERTEX_SHADER,
    fragmentShader: DUPERSCOPE_RIBBON_FRAGMENT_SHADER,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1920, 1080) },
      uAspect: { value: 1.0 },
      uPixelRatio: { value: 1.0 },
      uOpacity: { value: 1.0 },
    },
  })
}

/**
 * Creates a pre-allocated THREE.InstancedBufferGeometry for drawing up to maxSegments quad ribbons.
 *
 * @param maxSegments - Maximum number of polyline segments (default 4096).
 */
export function createRibbonQuadGeometry(maxSegments = 4096): THREE.InstancedBufferGeometry {
  const geometry = new THREE.InstancedBufferGeometry()

  // 4 corners of unit quad segment
  const corners = new Float32Array([
    0, -1,
    1, -1,
    0, 1,
    1, 1,
  ])
  geometry.setAttribute('aCorner', new THREE.BufferAttribute(corners, 2))
  geometry.setIndex([0, 1, 2, 2, 1, 3])

  // Instanced segment attributes
  geometry.setAttribute('instanceStart', new THREE.InstancedBufferAttribute(new Float32Array(maxSegments * 3), 3))
  geometry.setAttribute('instanceEnd', new THREE.InstancedBufferAttribute(new Float32Array(maxSegments * 3), 3))
  geometry.setAttribute('instanceStartColor', new THREE.InstancedBufferAttribute(new Float32Array(maxSegments * 4), 4))
  geometry.setAttribute('instanceEndColor', new THREE.InstancedBufferAttribute(new Float32Array(maxSegments * 4), 4))
  geometry.setAttribute('instanceStartSize', new THREE.InstancedBufferAttribute(new Float32Array(maxSegments), 1))
  geometry.setAttribute('instanceEndSize', new THREE.InstancedBufferAttribute(new Float32Array(maxSegments), 1))

  geometry.instanceCount = 0
  return geometry
}

/**
 * Creates a THREE.ShaderMaterial for rendering anti-aliased circular points.
 */
export function createDuperscopePointsMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: DUPERSCOPE_POINTS_VERTEX_SHADER,
    fragmentShader: DUPERSCOPE_POINTS_FRAGMENT_SHADER,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uAspect: { value: 1.0 },
      uPixelRatio: { value: 1.0 },
      uOpacity: { value: 1.0 },
    },
  })
}
