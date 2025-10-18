"use client"

import { useEffect, useRef } from "react"

export function AboutStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current) return
      const scrolled = window.scrollY
      const rate = scrolled * 0.3
      imageRef.current.style.transform = `translateY(${rate}px)`
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative z-10 py-32 px-4 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 border-4 border-indigo-600 rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border-4 border-purple-600 rounded-full" />
      </div>

      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative h-[500px] rounded-3xl overflow-hidden">
            <div
              ref={imageRef}
              className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-3xl"
              style={{ height: "120%" }}
            >
              <img
                src="/sustainable-community-sharing-economy.jpg"
                alt="Our Story"
                className="w-full h-full object-cover mix-blend-overlay"
              />
            </div>
            <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
              <div className="text-white">
                <div className="text-4xl font-bold">2025</div>
                <div className="text-lg">Năm thành lập</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
              Câu chuyện của{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                chúng tôi
              </span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Retro Trade được thành lập vào năm 2023 với sứ mệnh tạo ra một nền tảng kết nối những người muốn chia sẻ
              và tái sử dụng đồ cũ. Chúng tôi tin rằng mỗi sản phẩm đều có giá trị và có thể mang lại lợi ích cho nhiều
              người khác nhau.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Với hơn 10,000 người dùng và 50,000 sản phẩm được chia sẻ, chúng tôi đang xây dựng một cộng đồng bền vững
              và thân thiện với môi trường. Mỗi giao dịch trên Retro Trade không chỉ giúp tiết kiệm chi phí mà còn góp
              phần giảm thiểu rác thải và bảo vệ hành tinh của chúng ta.
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-gray-900">Ra mắt nền tảng</div>
                  <div className="text-gray-600">Tháng 10/2025 - Khởi đầu hành trình</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-gray-900">10,000 người dùng</div>
                  <div className="text-gray-600">Tháng 10/2025 - Cộng đồng phát triển</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-gray-900">Mở rộng toàn quốc</div>
                  <div className="text-gray-600">Tháng 10/2025 - Phủ sóng 63 tỉnh thành</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
