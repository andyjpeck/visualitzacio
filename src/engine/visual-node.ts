import * as THREE from 'three'
import type { FrameContext } from '../contracts/frame-context'
import type { RendererLike, VisualNode } from '../contracts/renderer-like'

export class TestVisualNode implements VisualNode {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshStandardMaterial>
  private renderer?: RendererLike

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100)
    this.camera.position.z = 3

    // Create icosahedron with neon cyberpunk styling
    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x202030, 1.5)
    this.scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xff007f, 3, 10)
    pointLight.position.set(2, 3, 2)
    this.scene.add(pointLight)
  }

  init(renderer: RendererLike): void {
    this.renderer = renderer
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / (height || 1)
    this.camera.updateProjectionMatrix()
  }

  update(ctx: FrameContext): void {
    // Rotation driven by $TIME
    this.mesh.rotation.x = ctx.$TIME * 0.4
    this.mesh.rotation.y = ctx.$TIME * 0.6

    // Scale pulses with $BASS and instantaneous $BEAT flash
    const baseScale = 1.0 + ctx.$BASS * 0.5 + ctx.$BEAT * 0.3
    this.mesh.scale.set(baseScale, baseScale, baseScale)

    // Color shifts with $MID and $TREBLE energy
    const hue = 0.5 + ctx.$MID * 0.3 // Shifts from cyan towards magenta
    const lightness = 0.5 + ctx.$TREBLE * 0.3
    this.mesh.material.color.setHSL(hue % 1.0, 1.0, Math.min(lightness, 0.9))

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}
