import { useEffect, useRef } from "react"
import * as THREE from "three"

import { cn } from "@/lib/utils"

type LegalOrbitSceneProps = {
  className?: string
}

export function LegalOrbitScene({ className }: LegalOrbitSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x15110d, 0.035)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
    camera.position.set(0, 1.05, 9.5)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const constellation = new THREE.Group()
    scene.add(constellation)

    scene.add(new THREE.AmbientLight(0xf6ead6, 1.35))

    const keyLight = new THREE.DirectionalLight(0xffe2a7, 2.9)
    keyLight.position.set(4.5, 5.5, 4)
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(0x4fb9d5, 10, 18)
    rimLight.position.set(-4.2, 1.8, 3.5)
    scene.add(rimLight)

    const sealLight = new THREE.PointLight(0xd6a850, 8, 15)
    sealLight.position.set(2.5, -2.2, 3.4)
    scene.add(sealLight)

    const paperMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf4e7ce,
      metalness: 0.02,
      roughness: 0.58,
      clearcoat: 0.35,
      clearcoatRoughness: 0.52,
    })
    const darkPaperMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2118,
      metalness: 0.14,
      roughness: 0.44,
    })
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd6a850,
      emissive: 0x5f3e10,
      emissiveIntensity: 0.18,
      metalness: 0.72,
      roughness: 0.28,
    })
    const tealMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x65c7b8,
      emissive: 0x123f3d,
      emissiveIntensity: 0.26,
      metalness: 0.24,
      roughness: 0.34,
    })
    const blueMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x456b9c,
      emissive: 0x07192e,
      emissiveIntensity: 0.3,
      metalness: 0.38,
      roughness: 0.31,
    })

    const fileGroup = new THREE.Group()
    fileGroup.rotation.set(-0.2, -0.42, 0.08)
    constellation.add(fileGroup)

    const sheetGeometry = new THREE.BoxGeometry(2.45, 3.28, 0.065, 5, 5, 1)
    const coverGeometry = new THREE.BoxGeometry(2.56, 3.38, 0.09, 5, 5, 1)

    const sheetBack = new THREE.Mesh(coverGeometry, darkPaperMaterial)
    sheetBack.position.set(0.18, -0.15, -0.18)
    sheetBack.rotation.z = -0.055
    fileGroup.add(sheetBack)

    const sheetMiddle = new THREE.Mesh(sheetGeometry, paperMaterial)
    sheetMiddle.position.set(0.03, -0.04, -0.04)
    sheetMiddle.rotation.z = 0.025
    fileGroup.add(sheetMiddle)

    const sheetFront = new THREE.Mesh(sheetGeometry, paperMaterial)
    sheetFront.position.set(-0.12, 0.1, 0.12)
    sheetFront.rotation.z = 0.09
    fileGroup.add(sheetFront)

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2b2017,
      transparent: true,
      opacity: 0.34,
    })

    for (let index = 0; index < 7; index += 1) {
      const y = 0.98 - index * 0.32
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.85, y, 0.19),
        new THREE.Vector3(0.92 - (index % 3) * 0.15, y, 0.19),
      ])
      fileGroup.add(new THREE.Line(lineGeometry, lineMaterial))
    }

    const seal = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 16, 80), goldMaterial)
    seal.position.set(-0.48, -0.88, 0.25)
    seal.rotation.set(0.22, 0.08, 0.12)
    fileGroup.add(seal)

    const sealCore = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.045, 56), goldMaterial)
    sealCore.position.copy(seal.position)
    sealCore.rotation.set(Math.PI / 2 + 0.22, 0.08, 0.12)
    fileGroup.add(sealCore)

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xd6a850,
      transparent: true,
      opacity: 0.32,
    })
    const ringBlueMaterial = new THREE.LineBasicMaterial({
      color: 0x69bdd0,
      transparent: true,
      opacity: 0.27,
    })

    const ringA = new THREE.Line(
      new THREE.TorusGeometry(3.15, 0.006, 8, 160),
      ringMaterial
    )
    ringA.scale.y = 0.42
    ringA.rotation.set(0.72, 0.18, -0.18)
    constellation.add(ringA)

    const ringB = new THREE.Line(
      new THREE.TorusGeometry(2.65, 0.006, 8, 160),
      ringBlueMaterial
    )
    ringB.scale.y = 0.58
    ringB.rotation.set(-0.55, 0.78, 0.36)
    constellation.add(ringB)

    const ringC = new THREE.Line(
      new THREE.TorusGeometry(3.85, 0.004, 8, 180),
      ringBlueMaterial
    )
    ringC.scale.y = 0.24
    ringC.rotation.set(0.18, -0.4, 0.72)
    constellation.add(ringC)

    const nodeGeometry = new THREE.SphereGeometry(0.085, 24, 16)
    const largeNodeGeometry = new THREE.SphereGeometry(0.13, 28, 18)
    const nodePositions = [
      new THREE.Vector3(-2.8, 1.65, 0.62),
      new THREE.Vector3(2.65, 1.05, -0.12),
      new THREE.Vector3(2.1, -1.85, 0.5),
      new THREE.Vector3(-2.45, -1.35, -0.42),
      new THREE.Vector3(0.1, 2.52, -0.72),
      new THREE.Vector3(0.95, -2.45, 0.18),
    ]

    nodePositions.forEach((position, index) => {
      const mesh = new THREE.Mesh(
        index % 2 === 0 ? largeNodeGeometry : nodeGeometry,
        index % 3 === 0 ? goldMaterial : index % 3 === 1 ? tealMaterial : blueMaterial
      )
      mesh.position.copy(position)
      constellation.add(mesh)
    })

    const connectorMaterial = new THREE.LineBasicMaterial({
      color: 0xd8c39a,
      transparent: true,
      opacity: 0.22,
    })
    const connectorPoints: THREE.Vector3[] = []
    nodePositions.forEach((position) => {
      connectorPoints.push(position, new THREE.Vector3(-0.12, 0.1, 0.18))
    })
    const connectorGeometry = new THREE.BufferGeometry().setFromPoints(connectorPoints)
    const connectors = new THREE.LineSegments(connectorGeometry, connectorMaterial)
    constellation.add(connectors)

    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = 140
    const positions = new Float32Array(particleCount * 3)
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 3.4 + Math.random() * 3.6
      const angle = Math.random() * Math.PI * 2
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = (Math.random() - 0.5) * 4.8
      positions[index * 3 + 2] = Math.sin(angle) * radius * 0.44 - 1
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xf0d29c,
        size: 0.022,
        transparent: true,
        opacity: 0.55,
      })
    )
    constellation.add(particles)

    let pointerX = 0
    let pointerY = 0
    let scrollOffset = 0
    let frameId = 0
    const clock = new THREE.Clock()

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }

    const handleScroll = () => {
      scrollOffset = window.scrollY * 0.00038
    }

    const animate = () => {
      const elapsed = clock.getElapsedTime()
      const slow = reduceMotion.matches ? 0 : 1

      constellation.rotation.y =
        Math.sin(elapsed * 0.18) * 0.08 + pointerX * 0.08 + scrollOffset
      constellation.rotation.x = -0.04 + pointerY * 0.045 - scrollOffset * 0.35
      fileGroup.position.y = Math.sin(elapsed * 0.7) * 0.08 * slow
      ringA.rotation.z = -0.18 + elapsed * 0.075 * slow
      ringB.rotation.z = 0.36 - elapsed * 0.055 * slow
      ringC.rotation.z = 0.72 + elapsed * 0.04 * slow
      particles.rotation.y = elapsed * 0.025 * slow

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()
    handleScroll()
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("scroll", handleScroll, { passive: true })
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("scroll", handleScroll)
      renderer.dispose()
      mount.removeChild(renderer.domElement)

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose())
          } else {
            material.dispose()
          }
        }
      })
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    />
  )
}
