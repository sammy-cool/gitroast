'use client'

// ============================================================
// GITROAST — 3D Code Solar System (WebGL Three.js Canvas)
// ============================================================
/**
 * WHAT: Interactive 3D WebGL solar system simulator transforming a developer's GitHub
 *       repositories into an interactive universe with orbiting planets, black holes, and central star.
 * WHY: Delivers an unprecedented, jaw-dropping cosmic visualization of technical debt, active repos,
 *      and code health that is visually arresting and 100% unique in the global dev ecosystem.
 * WHERE & WHEN TO USE: In /universe/[username] interactive solar system client view.
 * USE CASES: 3D planetary exploration, click-to-inspect repos, interactive orbital simulation.
 * WHEN NOT TO USE: In server-side rendering (SSR) environments (guarded via client mount).
 */

import { useRef, useEffect } from 'react'
import * as THREE from 'three'

/**
 * Creates an offscreen procedural radial glow canvas texture.
 */
function createGlowTexture(colorStr) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, colorStr)
  gradient.addColorStop(0.3, colorStr)
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.15)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Creates a procedural striped/cratered planetary surface canvas texture.
 */
function createPlanetTexture(planetType, baseColorStr) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = baseColorStr
  ctx.fillRect(0, 0, 256, 128)

  if (planetType === 'gas_giant') {
    // Jupiter/Saturn style atmospheric bands
    for (let i = 0; i < 128; i += 6) {
      ctx.fillStyle = i % 12 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, i, 256, 4)
    }
  } else if (planetType === 'inferno') {
    // Magma cracks and fiery veins
    ctx.strokeStyle = '#FFEE58'
    ctx.lineWidth = 2
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * 256, Math.random() * 128)
      ctx.lineTo(Math.random() * 256, Math.random() * 128)
      ctx.stroke()
    }
  } else if (planetType === 'habitable') {
    // Ocean blue + green continents
    ctx.fillStyle = '#1B5E20'
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * 256, Math.random() * 128, 18 + Math.random() * 25, 0, Math.PI * 2)
      ctx.fill()
    }
    // Atmospheric white clouds
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 128, 60, 6)
    }
  } else if (planetType === 'frozen_ice') {
    // Glacier fissures and frozen frost
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 12; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * 256, Math.random() * 128)
      ctx.lineTo(Math.random() * 256, Math.random() * 128)
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function CodeSolarSystem({
  universeData,
  selectedPlanetId,
  onSelectPlanet,
  isCinematic = true,
  speedMultiplier = 1,
}) {
  const containerRef = useRef(null)

  // Interactive camera control state
  const stateRef = useRef({
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    spherical: { radius: 240, theta: Math.PI / 4, phi: Math.PI / 3.2 },
    targetLookAt: new THREE.Vector3(0, 0, 0),
    currentLookAt: new THREE.Vector3(0, 0, 0),
    planetAngles: {},
    planetMeshes: new Map(),
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container || !universeData) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // ── 1. Scene, Camera, Renderer ──────────────────────────────
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050508, 0.0009)

    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000)
    camera.position.set(0, 180, 240)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // ── 2. Lights ───────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x222233, 1.2)
    scene.add(ambientLight)

    const sunLight = new THREE.PointLight(0xffeedd, 3.5, 900, 1.2)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    // ── 3. Starfield (2,000 Cosmic Dust Particles) ──────────────
    const starCount = 2000
    const starGeo = new THREE.BufferGeometry()
    const starCoords = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 600 + Math.random() * 800
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      starCoords[i] = radius * Math.sin(phi) * Math.cos(theta)
      starCoords[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      starCoords[i + 2] = radius * Math.cos(phi)

      const color = new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 0.7, 0.8)
      starColors[i] = color.r
      starColors[i + 1] = color.g
      starColors[i + 2] = color.b
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // ── 4. Central Sun (The Developer) ──────────────────────────
    const starData = universeData.star
    const sunRadius = starData.radius || 18
    const sunGeo = new THREE.SphereGeometry(sunRadius, 32, 32)
    const sunMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(starData.starColor || '#FFB700'),
    })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sunMesh)

    // Sun Corona Halo Sprite
    const coronaTexture = createGlowTexture(starData.coronaColor || 'rgba(255,183,0,0.45)')
    if (coronaTexture) {
      const coronaMat = new THREE.SpriteMaterial({
        map: coronaTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
      const coronaSprite = new THREE.Sprite(coronaMat)
      coronaSprite.scale.set(sunRadius * 4.2, sunRadius * 4.2, 1)
      sunMesh.add(coronaSprite)
    }

    // ── 5. Planets & Orbital Rings ──────────────────────────────
    const planets = universeData.planets || []
    const planetMeshes = new Map()

    planets.forEach((p, idx) => {
      // Orbital Track Ring
      const orbitGeo = new THREE.BufferGeometry()
      const segments = 96
      const points = []
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(theta) * p.orbitDistance, 0, Math.sin(theta) * p.orbitDistance))
      }
      orbitGeo.setFromPoints(points)
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x334466,
        transparent: true,
        opacity: 0.22,
      })
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat)
      scene.add(orbitLine)

      // Planet Mesh
      const pRadius = p.sizeScale || 3.2
      const pGeo = new THREE.SphereGeometry(pRadius, 24, 24)
      const texture = createPlanetTexture(p.planetType, p.themeColor)

      let pMat
      if (p.planetType === 'black_hole') {
        pMat = new THREE.MeshBasicMaterial({ color: 0x010103 })
      } else {
        pMat = new THREE.MeshStandardMaterial({
          map: texture,
          color: new THREE.Color(p.themeColor),
          roughness: 0.65,
          metalness: 0.1,
        })
      }

      const pMesh = new THREE.Mesh(pGeo, pMat)
      pMesh.userData = { planet: p }
      scene.add(pMesh)
      planetMeshes.set(p.id, pMesh)

      // Gas Giant Saturn-like Ring
      if (p.hasRings) {
        const ringGeo = new THREE.RingGeometry(pRadius * 1.4, pRadius * 2.3, 32)
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        })
        const ringMesh = new THREE.Mesh(ringGeo, ringMat)
        ringMesh.rotation.x = Math.PI / 2.3
        pMesh.add(ringMesh)
      }

      // Black Hole Accretion Disk
      if (p.planetType === 'black_hole') {
        const diskGeo = new THREE.RingGeometry(pRadius * 1.5, pRadius * 3.4, 32)
        const diskMat = new THREE.MeshBasicMaterial({
          color: 0x8a2be2,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        })
        const diskMesh = new THREE.Mesh(diskGeo, diskMat)
        diskMesh.rotation.x = Math.PI / 2.1
        pMesh.add(diskMesh)
      }

      // Tiny moons
      if (p.moonsCount > 0) {
        for (let m = 0; m < p.moonsCount; m++) {
          const moonGeo = new THREE.SphereGeometry(pRadius * 0.28, 12, 12)
          const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 })
          const moonMesh = new THREE.Mesh(moonGeo, moonMat)
          moonMesh.userData = { moonDist: pRadius * 1.8 + m * 2.2, moonSpeed: 0.04 + m * 0.02, angle: m * 1.8 }
          pMesh.add(moonMesh)
        }
      }

      // Initialize initial random orbit angle
      if (!stateRef.current.planetAngles[p.id]) {
        stateRef.current.planetAngles[p.id] = (idx / planets.length) * Math.PI * 2
      }
    })

    stateRef.current.planetMeshes = planetMeshes

    // ── 6. Mouse, Drag, and Raycasting ──────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onPointerDown(e) {
      stateRef.current.isDragging = true
      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY }
    }

    function onPointerMove(e) {
      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.prevMousePos.x
        const deltaY = e.clientY - stateRef.current.prevMousePos.y

        stateRef.current.spherical.theta -= deltaX * 0.006
        stateRef.current.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.05, stateRef.current.spherical.phi - deltaY * 0.006))

        stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY }
      }

      // Raycast hover check
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(Array.from(planetMeshes.values()))
      renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
    }

    function onPointerUp(e) {
      const wasDragging = stateRef.current.isDragging
      stateRef.current.isDragging = false

      // Check click selection
      const deltaX = Math.abs(e.clientX - stateRef.current.prevMousePos.x)
      const deltaY = Math.abs(e.clientY - stateRef.current.prevMousePos.y)

      if (deltaX < 5 && deltaY < 5 && wasDragging) {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(Array.from(planetMeshes.values()))

        if (intersects.length > 0) {
          const clickedPlanet = intersects[0].object.userData.planet
          if (clickedPlanet && onSelectPlanet) {
            onSelectPlanet(clickedPlanet)
          }
        }
      }
    }

    function onWheel(e) {
      e.preventDefault()
      stateRef.current.spherical.radius = Math.max(45, Math.min(480, stateRef.current.spherical.radius + e.deltaY * 0.18))
    }

    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('wheel', onWheel, { passive: false })

    // Window Resize Handler
    function handleResize() {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // ── 7. Animation Loop ───────────────────────────────────────
    let animId
    function animate() {
      animId = requestAnimationFrame(animate)

      // Rotate Sun
      sunMesh.rotation.y += 0.003

      // Rotate Starfield slowly
      starField.rotation.y += 0.0002

      // Animate Planets Orbits & Rotations
      planets.forEach((p) => {
        const mesh = planetMeshes.get(p.id)
        if (!mesh) return

        // Update angle
        stateRef.current.planetAngles[p.id] += p.orbitSpeed * speedMultiplier
        const angle = stateRef.current.planetAngles[p.id]

        mesh.position.x = Math.cos(angle) * p.orbitDistance
        mesh.position.z = Math.sin(angle) * p.orbitDistance

        // Day/night spin
        mesh.rotation.y += p.rotationSpeed * speedMultiplier

        // Animate moons
        mesh.children.forEach((child) => {
          if (child.userData?.moonDist) {
            child.userData.angle += child.userData.moonSpeed * speedMultiplier
            child.position.x = Math.cos(child.userData.angle) * child.userData.moonDist
            child.position.z = Math.sin(child.userData.angle) * child.userData.moonDist
          }
        })
      })

      // Cinematic Auto-Orbit camera rotation when not user-dragging and not focused on planet
      if (isCinematic && !stateRef.current.isDragging && !selectedPlanetId) {
        stateRef.current.spherical.theta += 0.0018 * speedMultiplier
      }

      // Smooth Camera Positioning & Lerp
      let targetX, targetY, targetZ
      const sph = stateRef.current.spherical

      if (selectedPlanetId && planetMeshes.has(selectedPlanetId)) {
        // Focus on selected planet
        const selMesh = planetMeshes.get(selectedPlanetId)
        stateRef.current.targetLookAt.copy(selMesh.position)

        targetX = selMesh.position.x + 18
        targetY = selMesh.position.y + 12
        targetZ = selMesh.position.z + 24
      } else {
        // Orbit overview
        stateRef.current.targetLookAt.set(0, 0, 0)
        targetX = sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta)
        targetY = sph.radius * Math.cos(sph.phi)
        targetZ = sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta)
      }

      camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05)
      stateRef.current.currentLookAt.lerp(stateRef.current.targetLookAt, 0.05)
      camera.lookAt(stateRef.current.currentLookAt)

      renderer.render(scene, camera)
    }

    animate()

    // ── 8. Cleanup & Memory Safety ──────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('wheel', onWheel)

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      // Dispose Geometries and Materials
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      renderer.dispose()
    }
  }, [universeData, isCinematic, speedMultiplier, onSelectPlanet, selectedPlanetId])

  return (
    <div
      ref={containerRef}
      className="solar-system-canvas-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    />
  )
}
