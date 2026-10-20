import * as THREE from 'three'
import type { FrameContext } from '../contracts/frame-context'
import type { RendererLike, VisualNode } from '../contracts/renderer-like'
import { createDynamicParam, type DynamicParam } from './expressions/dynamic-param'
import type { ExpressionEngine } from './expressions/expression-engine'

/**
 * 3D visual testbed node featuring an audio-reactive cyberpunk faceted crystal,
 * outer wireframe lattice, orbiting halo ring, and multi-point neon lighting.
 * Implements the VisualNode contract with dynamic geometry shape morphing.
 */
export class TestVisualNode implements VisualNode {
  readonly id: string
  bypassed = false
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
  private readonly outerWireframe: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
  private readonly wireMaterial: THREE.MeshBasicMaterial
  private readonly haloRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
  private renderer?: RendererLike
  private scaleParam: DynamicParam<number> | null = null
  private currentShape = 'Crystal'
  private isAudioReactive = true

  /**
   * Constructs the 3D scene, perspective camera, faceted geometry, and neon lighting rig.
   */
  constructor(id = 'test-visual-1') {
    this.id = id
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100)
    this.camera.position.z = 3

    // Create prominent faceted icosahedron crystal with cyberpunk neon styling
    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      flatShading: true,
      roughness: 0.15,
      metalness: 0.4,
      emissive: 0x003355,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.92,
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)

    // Glowing outer wireframe cage layered on the crystal
    const wireGeometry = new THREE.IcosahedronGeometry(1.02, 1)
    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    })
    this.outerWireframe = new THREE.Mesh(wireGeometry, this.wireMaterial)
    this.mesh.add(this.outerWireframe)

    // Orbiting cyberpunk halo ring
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.02, 16, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.75,
    })
    this.haloRing = new THREE.Mesh(ringGeometry, ringMaterial)
    this.haloRing.rotation.x = Math.PI / 2.5
    this.scene.add(this.haloRing)

    // Vibrant neon multi-point lighting
    const ambientLight = new THREE.AmbientLight(0x303060, 2.0)
    this.scene.add(ambientLight)

    const cyanPointLight = new THREE.PointLight(0x00f0ff, 8, 20)
    cyanPointLight.position.set(2, 3, 3)
    this.scene.add(cyanPointLight)

    const magentaPointLight = new THREE.PointLight(0xff007f, 10, 20)
    magentaPointLight.position.set(-3, -2, -2)
    this.scene.add(magentaPointLight)

    const amberFillLight = new THREE.PointLight(0xffb000, 5, 20)
    amberFillLight.position.set(0, -3, 3)
    this.scene.add(amberFillLight)
  }

  /**
   * Modifies the 3D geometry of the mesh and outer wireframe cage.
   * Supports 'Crystal' (Icosahedron), 'Cube' (Box), 'Torus', and 'Sphere'.
   *
   * @param shape - Shape identifier string.
   */
  setShape(shape: string): void {
    if (this.currentShape === shape) return
    this.currentShape = shape

    this.mesh.geometry.dispose()
    this.outerWireframe.geometry.dispose()

    let newGeo: THREE.BufferGeometry
    let newWireGeo: THREE.BufferGeometry

    switch (shape) {
      case 'Cube':
        newGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3)
        newWireGeo = new THREE.BoxGeometry(1.32, 1.32, 1.32)
        break
      case 'Torus':
        newGeo = new THREE.TorusGeometry(0.85, 0.35, 16, 40)
        newWireGeo = new THREE.TorusGeometry(0.87, 0.36, 16, 40)
        break
      case 'Sphere':
        newGeo = new THREE.SphereGeometry(1.1, 24, 24)
        newWireGeo = new THREE.SphereGeometry(1.12, 24, 24)
        break
      case 'Crystal':
      default:
        newGeo = new THREE.IcosahedronGeometry(1, 1)
        newWireGeo = new THREE.IcosahedronGeometry(1.02, 1)
        break
    }

    this.mesh.geometry = newGeo
    this.outerWireframe.geometry = newWireGeo
  }

  /**
   * Returns current active 3D geometry shape identifier.
   */
  getShape(): string {
    return this.currentShape
  }

  /**
   * Enables or disables dynamic audio spectrum modulation of scale and colors.
   */
  setAudioReactive(reactive: boolean): void {
    this.isAudioReactive = reactive
  }

  /**
   * Returns whether audio reactivity is currently active.
   */
  getAudioReactive(): boolean {
    return this.isAudioReactive
  }

  /**
   * Initializes the node with the active renderer context.
   *
   * @param renderer - Renderer instance implementing RendererLike.
   */
  init(renderer: RendererLike): void {
    this.renderer = renderer
  }

  /**
   * Updates camera aspect ratio when viewport dimensions change.
   *
   * @param width - Viewport width in pixels.
   * @param height - Viewport height in pixels.
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / (height || 1)
    this.camera.updateProjectionMatrix()
  }

  /**
   * Binds an optional dynamic mathematical expression to drive crystal scale modulation.
   *
   * @param expr - Numeric constant, formula string (e.g. "1.0 + $BASS * 1.5 + #BEAT(0.2)"), or null to reset.
   * @param engine - Active ExpressionEngine instance.
   */
  setScaleExpression(expr: string | number | null, engine?: ExpressionEngine): void {
    if (expr === null || expr === undefined || expr === '') {
      this.scaleParam = null
    } else if (engine) {
      this.scaleParam = createDynamicParam(expr, engine)
    }
  }

  /**
   * Animates rotation and modulates scale, emissive intensity, and halo rings based on FrameContext audio telemetry.
   *
   * @param ctx - Real-time FrameContext containing telemetry ($TIME, $BASS, $MID, $TREBLE, $BEAT, $RMS).
   */
  update(ctx: FrameContext): void {
    if (this.bypassed) return

    // Rotation driven by $TIME (matches test contracts)
    this.mesh.rotation.x = ctx.$TIME * 0.4
    this.mesh.rotation.y = ctx.$TIME * 0.6

    // Scale pulses with $BASS and instantaneous $BEAT flash, or dynamic expression if bound
    const isReactive = this.isAudioReactive
    const defaultScale = isReactive ? 1.0 + ctx.$BASS * 0.5 + ctx.$BEAT * 0.3 : 1.0
    const baseScale = this.scaleParam ? this.scaleParam.evaluate(ctx, defaultScale) : defaultScale
    this.mesh.scale.set(baseScale, baseScale, baseScale)

    if (isReactive) {
      // Color shifts with $MID and $TREBLE energy
      const hue = 0.5 + ctx.$MID * 0.3 // Shifts from cyan towards magenta
      const lightness = 0.5 + ctx.$TREBLE * 0.3
      this.mesh.material.color.setHSL(hue % 1.0, 1.0, Math.min(lightness, 0.9))

      // Emissive brilliance explodes on beats and transients
      this.mesh.material.emissiveIntensity = 0.6 + ctx.$BEAT * 2.2 + ctx.$RMS * 1.2

      // Outer wireframe hue reacts to high frequencies
      this.wireMaterial.color.setHSL((0.85 + ctx.$TREBLE * 0.3) % 1.0, 1.0, 0.6)
    } else {
      this.mesh.material.color.setHex(0x00f0ff)
      this.mesh.material.emissiveIntensity = 0.6
      this.wireMaterial.color.setHex(0x00ffff)
    }

    // Orbiting halo ring counter-rotates and scales with midrange energy
    if (this.haloRing) {
      this.haloRing.rotation.z = -ctx.$TIME * 0.3
      this.haloRing.rotation.x = Math.PI / 2.5 + Math.sin(ctx.$TIME * 0.5) * 0.2
      const ringScale = isReactive ? 1.0 + ctx.$MID * 0.4 + ctx.$BEAT * 0.25 : 1.0
      this.haloRing.scale.set(ringScale, ringScale, ringScale)
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Disposes 3D geometries and materials from GPU memory.
   */
  dispose(): void {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.outerWireframe.geometry.dispose()
    this.wireMaterial.dispose()
    this.haloRing.geometry.dispose()
    this.haloRing.material.dispose()
  }
}
