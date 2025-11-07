"use client"

import { motion, Variants, Transition } from "framer-motion"
import Image from "next/image"

type BenefitItem = {
  title: string
  description: string
  icon: string
  color: string
}

const benefits: BenefitItem[] = [
  {
    title: "Tiết kiệm chi phí",
    description: "Giảm thiểu chi phí mua sắm bằng cách tận dụng đồ dùng còn tốt",
    icon: "💰",
    color: "from-emerald-500 to-teal-600"
  },
  {
    title: "Bảo vệ môi trường",
    description: "Góp phần giảm thiểu rác thải và bảo vệ tài nguyên thiên nhiên",
    icon: "🌱",
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "Trải nghiệm đa dạng",
    description: "Khám phá và trải nghiệm nhiều sản phẩm khác nhau",
    icon: "✨",
    color: "from-amber-400 to-orange-500"
  },
  {
    title: "Kết nối cộng đồng",
    description: "Giao lưu và chia sẻ với những người có cùng đam mê",
    icon: "👥",
    color: "from-blue-500 to-indigo-600"
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * 0.15,
    },
  }),
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      type: "spring",
      stiffness: 400,
      damping: 20,
    }
  }
};

export function StorySection() {
  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Enhanced background with multiple layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 to-purple-100/30" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Floating shapes for dynamism */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-emerald-200/30 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto relative">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 300 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-semibold shadow-lg"
          >
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            CÂU CHUYỆN CỦA CHÚNG TÔI
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-bold text-center mb-6 text-gray-900 leading-tight relative"
          >
            Hãy cùng nhau tạo nên
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-x"
              style={{ 
                backgroundSize: '200% 100%',
                animation: 'gradientShift 3s ease infinite',
              }}
            >
              Những câu chuyện ý nghĩa
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl text-center text-gray-600 max-w-4xl mx-auto leading-relaxed font-light"
          >
            Mỗi món đồ cũ đều mang trong mình một câu chuyện, hãy cùng chúng tôi viết tiếp những câu chuyện đó
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -60, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, rotate: 1 }}
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-white/30 group">
              <Image 
                src="/people-sharing-and-collaborating-at-desk.jpg" 
                alt="Cộng đồng RetroTrade" 
                width={700} 
                height={500}
                className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            {/* Decorative elements */}
            <motion.div 
              className="absolute -top-8 -left-8 w-40 h-40 bg-indigo-100/40 rounded-full -z-10 blur-xl"
              initial={{ scale: 0.8, opacity: 0.5 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            <motion.div 
              className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-100/40 rounded-full -z-10 blur-xl"
              initial={{ scale: 0.8, opacity: 0.5 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            {/* Quote bubble or accent */}
            <motion.div 
              className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full flex items-center justify-center text-2xl opacity-0 lg:opacity-100"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7, type: "spring" }}
            >
              💭
            </motion.div>
          </motion.div>

          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                custom={index}
                variants={itemVariants}
                whileHover="hover"
                className="relative p-8 rounded-3xl bg-white/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 group overflow-hidden"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-start gap-5">
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-3xl flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-400 group-hover:rotate-12`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 300 }}
                  >
                    {benefit.icon}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <motion.h3 
                      className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300"
                      initial={{ x: 20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.8 }}
                      viewport={{ once: true }}
                    >
                      {benefit.title}
                    </motion.h3>
                    <motion.p 
                      className="text-gray-600 leading-relaxed"
                      initial={{ x: 20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.9 }}
                      viewport={{ once: true }}
                    >
                      {benefit.description}
                    </motion.p>
                  </div>
                </div>
                {/* Hover accent line */}
                <motion.div 
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${benefit.color} w-0 group-hover:w-full transition-all duration-700`}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 100%;
        }
      `}</style>
    </section>
  )
}