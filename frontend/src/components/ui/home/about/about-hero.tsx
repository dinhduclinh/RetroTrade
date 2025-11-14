"use client"

import { useEffect, useRef, useState } from "react"
import { motion, type Variants } from "framer-motion"
import * as THREE from "three"
import { Button } from "@/components/ui/common/button"
import Link from "next/link"
import { MessageCircle, ShoppingBag } from "lucide-react"

const buttonsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
};

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

    // Enhanced particles with varied sizes and colors
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 1500
    const posArray = new Float32Array(particlesCount * 3)
    const sizesArray = new Float32Array(particlesCount)
    const colorsArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 12
      posArray[i + 1] = (Math.random() - 0.5) * 12
      posArray[i + 2] = (Math.random() - 0.5) * 12

      sizesArray[i / 3] = Math.random() * 0.05 + 0.01

      // Gradient colors from indigo to pink
      const hue = Math.random() * 0.3 + 0.7 // Indigo-purple-pink range
      colorsArray[i] = 1 // R
      colorsArray[i + 1] = hue * 0.5 // G
      colorsArray[i + 2] = 1 // B
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizesArray, 1))
    const particlesMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.03,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Enhanced 3D shapes with better materials and glow
    const geometry1 = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    const geometry2 = new THREE.DodecahedronGeometry(1)
    const geometry3 = new THREE.IcosahedronGeometry(0.8)

    const material1 = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x6366f1,
      emissiveIntensity: 0.2,
    })

    const material2 = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.2,
    })

    const material3 = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0xf97316,
      emissiveIntensity: 0.2,
    })

    const torusKnot = new THREE.Mesh(geometry1, material1)
    const dodecahedron = new THREE.Mesh(geometry2, material2)
    const icosahedron = new THREE.Mesh(geometry3, material3)

    torusKnot.position.set(-2, 1, 0)
    dodecahedron.position.set(2, -1, 0)
    icosahedron.position.set(0, 1.5, -1)

    scene.add(torusKnot, dodecahedron, icosahedron)

    // Improved lighting with more dynamic sources
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    const pointLight1 = new THREE.PointLight(0x6366f1, 1.5, 100)
    const pointLight2 = new THREE.PointLight(0xf97316, 1.5, 100)
    const pointLight3 = new THREE.PointLight(0x8b5cf6, 1.5, 100)
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)

    pointLight1.position.set(5, 5, 5)
    pointLight2.position.set(-5, -5, 5)
    pointLight3.position.set(0, 5, -5)

    scene.add(ambientLight, pointLight1, pointLight2, pointLight3, hemisphereLight)

    // Animation loop with smoother interactions
    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate shapes with easing
      torusKnot.rotation.x += 0.008
      torusKnot.rotation.y += 0.01

      dodecahedron.rotation.x += 0.012
      dodecahedron.rotation.y += 0.015

      icosahedron.rotation.x += 0.018
      icosahedron.rotation.y += 0.02

      // Animate particles rotation and subtle float
      particlesMesh.rotation.y += 0.0005
      particlesMesh.rotation.x += 0.0003

      // Enhanced mouse interaction with damping
      const damping = 0.05
      torusKnot.position.x += (mousePosition.x * 1 - torusKnot.position.x) * damping
      torusKnot.position.y += (mousePosition.y * 1 - torusKnot.position.y) * damping

      dodecahedron.position.x += (-mousePosition.x * 0.8 - dodecahedron.position.x) * damping
      dodecahedron.position.y += (-mousePosition.y * 0.8 - dodecahedron.position.y) * damping

      // Rotate lights for dynamic glow
      pointLight1.position.x = Math.sin(Date.now() * 0.001) * 5
      pointLight2.position.y = Math.cos(Date.now() * 0.0008) * 5

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
      {/* Enhanced animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
        animate={{
          background: [
            "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 50%, #fce7f3 100%)",
            "linear-gradient(135deg, #f3e8ff 0%, #fce7f3 50%, #e0e7ff 100%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Improved blob animations with Framer Motion */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 10, 0],
          y: [0, -5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -10, 0],
          y: [0, 5, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 15, 0],
          y: [0, 10, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      <div className="container mx-auto relative z-10">
        <motion.div
          className="grid md:grid-cols-2 gap-12 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          <motion.div
            className="space-y-8"
            variants={{
              hidden: { opacity: 0, x: -50 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <motion.h1
              className="text-6xl md:text-7xl font-bold leading-tight"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Về{" "}
              <motion.span
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Retro Trade
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-700 leading-relaxed"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Chúng tôi tạo ra nền tảng này với hy vọng kết nối những người muốn chia sẻ và tái sử dụng đồ cũ, góp phần xây dựng một cộng đồng bền vững và thân thiện với môi trường.
            </motion.p>

            <motion.div
              className="grid grid-cols-2 gap-4"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <motion.div
                className="flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl">
                  🌱
                </div>
                <div>
                  <div className="font-bold text-gray-900">Bền vững</div>
                  <div className="text-sm text-gray-600">Thân thiện môi trường</div>
                </div>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                  🤝
                </div>
                <div>
                  <div className="font-bold text-gray-900">Cộng đồng</div>
                  <div className="text-sm text-gray-600">Kết nối mọi người</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto md:mx-0"
              variants={buttonsContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div 
                className="flex-1"
                variants={buttonVariants}
                whileHover="hover"
              >
                <Link href="/products" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-base font-medium whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Khám phá sản phẩm
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                className="flex-1"
                variants={buttonVariants}
                whileHover="hover"
              >
                <Link href="/auth/messages" className="block w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-6 text-base font-medium whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Liên hệ
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative h-[600px]"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}