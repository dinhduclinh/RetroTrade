"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/common/card"

const values = [
  {
    icon: "🌱",
    title: "Bền vững",
    description: "Cam kết bảo vệ môi trường và tạo ra tương lai xanh cho thế hệ sau",
    gradient: "from-green-400 to-emerald-600",
  },
  {
    icon: "🤝",
    title: "Cộng đồng",
    description: "Xây dựng mạng lưới kết nối và chia sẻ giữa mọi người",
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    icon: "💡",
    title: "Sáng tạo",
    description: "Khuyến khích tư duy mới và cách tiếp cận độc đáo",
    gradient: "from-yellow-400 to-orange-600",
  },
  {
    icon: "🔒",
    title: "Tin cậy",
    description: "Đảm bảo an toàn và minh bạch trong mọi giao dịch",
    gradient: "from-purple-400 to-pink-600",
  },
  {
    icon: "⚡",
    title: "Hiệu quả",
    description: "Tối ưu hóa quy trình để mang lại trải nghiệm tốt nhất",
    gradient: "from-cyan-400 to-blue-600",
  },
  {
    icon: "❤️",
    title: "Tận tâm",
    description: "Luôn lắng nghe và phục vụ khách hàng với trái tim",
    gradient: "from-red-400 to-rose-600",
  },
]

export function AboutValues() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".value-card")
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add("animate-fade-in-up")
              }, index * 100)
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

  return (
    <section ref={sectionRef} className="relative z-10 py-32 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Giá trị cốt lõi
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Những nguyên tắc định hướng mọi hành động và quyết định của chúng tôi
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <Card
              key={index}
              className="value-card opacity-0 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 overflow-hidden relative"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              />

              <CardContent className="p-8 text-center space-y-4 relative z-10">
                <div className="relative inline-block">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${value.gradient} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="relative text-7xl group-hover:scale-110 transition-transform duration-500">
                    {value.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>

                <div
                  className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${value.gradient} transition-all duration-500 mx-auto rounded-full`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
