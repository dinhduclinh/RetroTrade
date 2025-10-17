"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/common/button"

export function AboutHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })

    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    camera.position.z = 5

    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 1000
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x6366f1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Create main 3D shapes with glow effect
    const geometry1 = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    const geometry2 = new THREE.DodecahedronGeometry(1)
    const geometry3 = new THREE.IcosahedronGeometry(0.8)

    const material1 = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    })

    const material2 = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    })

    const material3 = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    })

    const torusKnot = new THREE.Mesh(geometry1, material1)
    const dodecahedron = new THREE.Mesh(geometry2, material2)
    const icosahedron = new THREE.Mesh(geometry3, material3)

    torusKnot.position.set(-2, 1, 0)
    dodecahedron.position.set(2, -1, 0)
    icosahedron.position.set(0, 1.5, -1)

    scene.add(torusKnot, dodecahedron, icosahedron)

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    const pointLight1 = new THREE.PointLight(0x6366f1, 2)
    const pointLight2 = new THREE.PointLight(0xf97316, 2)
    const pointLight3 = new THREE.PointLight(0x8b5cf6, 2)

    pointLight1.position.set(5, 5, 5)
    pointLight2.position.set(-5, -5, 5)
    pointLight3.position.set(0, 5, -5)

    scene.add(ambientLight, pointLight1, pointLight2, pointLight3)

    // Animation with mouse interaction
    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate shapes
      torusKnot.rotation.x += 0.01
      torusKnot.rotation.y += 0.01

      dodecahedron.rotation.x += 0.015
      dodecahedron.rotation.y += 0.015

      icosahedron.rotation.x += 0.02
      icosahedron.rotation.y += 0.02

      // Rotate particles
      particlesMesh.rotation.y += 0.001

      // Mouse interaction
      torusKnot.position.x = -2 + mousePosition.x * 0.5
      torusKnot.position.y = 1 + mousePosition.y * 0.5

      dodecahedron.position.x = 2 - mousePosition.x * 0.3
      dodecahedron.position.y = -1 - mousePosition.y * 0.3

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!canvas.parentElement) return
      const width = canvas.parentElement.clientWidth
      const height = canvas.parentElement.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
    }
  }, [mousePosition])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative z-10 py-32 px-4 overflow-hidden min-h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 animate-gradient-shift" />

      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              Về{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                Retro Trade
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Chúng tôi là nền tảng chia sẻ và cho thuê đồ cũ hàng đầu Việt Nam, kết nối cộng đồng để tạo ra một tương
              lai bền vững hơn.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl">
                  🌱
                </div>
                <div>
                  <div className="font-bold text-gray-900">Bền vững</div>
                  <div className="text-sm text-gray-600">Thân thiện môi trường</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                  🤝
                </div>
                <div>
                  <div className="font-bold text-gray-900">Cộng đồng</div>
                  <div className="text-sm text-gray-600">Kết nối mọi người</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Tìm hiểu thêm
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 hover:bg-white/50 backdrop-blur-sm hover:scale-105 transition-all bg-transparent"
              >
                Liên hệ
              </Button>
            </div>
          </div>

          <div className="relative h-[600px]">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
