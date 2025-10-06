"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)

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
    <section ref={sectionRef} className="relative z-10 py-20 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Cho thuê đồ cũ
              <br />
              <span className="text-indigo-600">Tiết kiệm & Bền vững</span>
            </h1>
            <p className="text-lg text-gray-600">Nền tảng chia sẻ và cho thuê đồ cũ hàng đầu Việt Nam</p>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Bắt đầu ngay
            </Button>
          </div>

          <div className="relative">
            <img src="/person-working-at-desk-with-technology-icons-float.jpg" alt="Hero illustration" className="w-full h-auto rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
