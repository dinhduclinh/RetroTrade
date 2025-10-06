"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft } from "lucide-react"
import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function Custom404() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    camera.position.z = 5

    // Create 404 particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 200
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.8,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Create rotating torus
    const torusGeometry = new THREE.TorusGeometry(2, 0.3, 16, 100)
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })
    const torus = new THREE.Mesh(torusGeometry, torusMaterial)
    scene.add(torus)

    // Animation
    let mouseX = 0
    let mouseY = 0

    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1
    })

    const animate = () => {
      requestAnimationFrame(animate)

      particlesMesh.rotation.y += 0.001
      particlesMesh.rotation.x += 0.0005

      torus.rotation.x += 0.01
      torus.rotation.y += 0.005

      camera.position.x = mouseX * 0.5
      camera.position.y = mouseY * 0.5

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Animated background blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))] animate-pulse" />
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 group">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500 rounded-3xl" />

            <div className="relative z-10 text-center space-y-8">
              {/* 404 Number with gradient */}
              <div className="space-y-4">
                <h1 className="text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-float">
                  404
                </h1>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full" />
              </div>

              {/* Message */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Trang không tìm thấy</h2>
                <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                  Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
                </p>
                <p className="text-gray-400 text-sm">
                  Trang này có thể đang được phát triển hoặc chưa được thiết lập.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/">
                  <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 px-8 py-6 text-base">
                    <Home className="w-5 h-5" />
                    Về trang chủ
                  </Button>
                </Link>

                <Button
                  onClick={() => window.history.back()}
                  className="backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 px-8 py-6 text-base"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Quay lại
                </Button>
              </div>

              {/* Decorative elements */}
              <div className="flex items-center justify-center gap-8 pt-8 opacity-50">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center animate-float">
                  <Search className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating particles */}
          <div className="absolute top-20 left-10 w-3 h-3 bg-purple-400/50 rounded-full animate-float" />
          <div className="absolute top-40 right-20 w-2 h-2 bg-pink-400/50 rounded-full animate-float animation-delay-2000" />
          <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-indigo-400/50 rounded-full animate-float animation-delay-4000" />
        </div>
      </div>
    </div>
  )
}
