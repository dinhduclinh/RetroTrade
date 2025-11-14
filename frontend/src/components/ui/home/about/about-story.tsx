"use client"

import { useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export function AboutStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef })

  const y = useTransform(scrollYProgress, [0, 1], [-20, 20])

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
    <section ref={sectionRef} className="relative z-10 py-32 px-4 overflow-hidden">
      {/* Enhanced background with animated particles */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 border-4 border-indigo-600 rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border-4 border-purple-600 rounded-full animate-bounce [animation-delay:1s]" />
        {/* Floating particles for subtle depth */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Enhanced image container with Framer Motion for parallax */}
          <motion.div
            className="relative h-[500px] rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div
              ref={imageRef}
              style={{ 
                y,
                height: "100%" 
              }}
              className="absolute inset-0 rounded-3xl"
            >
              <img
                src="/banners/about-1.jpg"
                alt="Our Story"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </motion.div>
            {/* Enhanced overlay card with glassmorphism and hover effect */}
            {/* <motion.div
              className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              viewport={{ once: true }}
            >
              <div className="text-white">
                <motion.div
                  className="text-4xl font-bold"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  2025
                </motion.div>
                <div className="text-lg">Năm thành lập</div>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Enhanced text section with staggered animations */}
          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } },
            }}
          >
            <motion.h2
              className="text-5xl md:text-6xl font-bold text-gray-900"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Câu chuyện của{" "}
              <motion.span
                className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                chúng tôi
              </motion.span>
            </motion.h2>

            <motion.p
              className="text-lg text-gray-700 leading-relaxed"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Retro Trade được thành lập vào năm 2025 với mong muốn tạo ra một không gian nơi mọi người có thể dễ dàng 
  chia sẻ, trao đổi và tái sử dụng những món đồ cũ. Chúng tôi tin rằng mỗi sản phẩm đều mang theo một câu chuyện 
  và hoàn toàn có thể tiếp tục được trân trọng bởi người mới.
            </motion.p>

            <motion.p
              className="text-lg text-gray-700 leading-relaxed"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
             Retro Trade hướng đến việc xây dựng một cộng đồng bền vững và thân thiện với môi trường. Việc trao đổi và sử dụng 
  lại đồ cũ không chỉ giúp tiết kiệm chi phí mà còn góp phần giảm thiểu rác thải, mang lại lợi ích thiết thực cho 
  cả người dùng lẫn môi trường sống của chúng ta.
            </motion.p>

            {/* Enhanced timeline with Framer Motion for staggered reveal and hover */}
            <div className="space-y-4 pt-6">
              {[
                {
                  icon: "from-indigo-500 to-purple-500",
                  number: 1,
                  title: "Ra mắt nền tảng",
                  desc: "Tháng 10/2025 - Khởi đầu hành trình",
                },
                {
                  icon: "from-purple-500 to-pink-500",
                  number: 2,
                  title: "Hình thành cộng đồng",
                  desc: "Sự lan tỏa tự nhiên từ những người đầu tiên đã tạo nên một cộng đồng chia sẻ thân thiện.",
                },
                {
                  icon: "from-pink-500 to-orange-500",
                  number: 3,
                  title: "Mở rộng toàn quốc",
                  desc: "Tháng 10/2025 - Phủ sóng 34 tỉnh thành",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4 items-start"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.icon} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {item.number}
                  </motion.div>
                  <div>
                    <div className="font-bold text-gray-900">{item.title}</div>
                    <div className="text-gray-600">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}