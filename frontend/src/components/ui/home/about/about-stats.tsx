"use client"

import { useEffect, useRef, useState } from "react"

const stats = [
  {
    number: "10K+",
    label: "Sản phẩm đã đăng",
    icon: "📦",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: "5K+",
    label: "Người dùng tin cậy",
    icon: "👥",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    number: "98%",
    label: "Tỷ lệ hài lòng",
    icon: "⭐",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    number: "24/7",
    label: "Hỗ trợ khách hàng",
    icon: "💬",
    gradient: "from-green-500 to-emerald-500",
  },
]

export function AboutStats() {
  const sectionRef = useRef<HTMLElement>(null)
  const [animatedStats, setAnimatedStats] = useState<number[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate stats when section comes into view
            stats.forEach((stat, index) => {
              setTimeout(() => {
                const numericValue = parseInt(stat.number.replace(/[^\d]/g, ""))
                if (numericValue) {
                  animateNumber(numericValue, index)
                }
              }, index * 200)
            })
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

  const animateNumber = (target: number, index: number) => {
    let current = 0
    const increment = target / 50
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      setAnimatedStats((prev) => {
        const newStats = [...prev]
        newStats[index] = Math.floor(current)
        return newStats
      })
    }, 20)
  }

  return (
    <section ref={sectionRef} className="relative z-10 py-32 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full animate-spin" style={{ animationDuration: "20s" }} />
        <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white rounded-full animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rounded-full animate-pulse" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center text-white mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            RetroTrade trong{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              số liệu
            </span>
          </h2>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
            Những con số ấn tượng phản ánh sự tin tưởng và phát triển của cộng đồng
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className="absolute inset-0 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-yellow-300 group-hover:to-orange-300 transition-all duration-300">
                  {stat.number.includes("%") || stat.number.includes("/") 
                    ? stat.number 
                    : animatedStats[index] ? `${animatedStats[index]}K+` : "0K+"
                  }
                </div>
                <div className="text-indigo-100 font-medium">{stat.label}</div>
              </div>

              <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${stat.gradient} transition-all duration-500 mx-auto rounded-full mt-4`} />
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-yellow-300">🏆</span>
            <span className="text-white font-medium">Được tin tưởng bởi hàng nghìn người dùng</span>
          </div>
        </div>
      </div>
    </section>
  )
}
