"use client"

import { motion } from "framer-motion" 

const features = [
  {
    title: "Cho thuê đồ cũ",
    description: "Tiết kiệm chi phí tối đa khi thuê các sản phẩm chất lượng với mức giá hợp lý. Bảo vệ môi trường bằng cách tái sử dụng đồ dùng.",
    icon: "📦",
    color: "from-blue-500 to-indigo-600",
    hoverColor: "hover:from-blue-600 hover:to-indigo-700"
  },
  {
    title: "Mua bán đồ cũ",
    description: "Giao dịch nhanh chóng, an toàn với hệ thống đánh giá minh bạch. Tìm kiếm đồ cũ chất lượng với mức giá phải chăng.",
    icon: "💰",
    color: "from-emerald-500 to-teal-600",
    hoverColor: "hover:from-emerald-600 hover:to-teal-700"
  },
  {
    title: "Chia sẻ cộng đồng",
    description: "Kết nối với cộng đồng cùng đam mê bảo vệ môi trường. Chia sẻ kinh nghiệm và câu chuyện tái chế, tái sử dụng.",
    icon: "💬",
    color: "from-amber-500 to-orange-600",
    hoverColor: "hover:from-amber-600 hover:to-orange-700"
  },
]

import { Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: i * 0.1,
    },
  }),
  hover: { 
    scale: 1.05, 
    rotate: 1,
    transition: { duration: 0.2 }
  },
}

export function FeaturesSection() {
  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Pattern background */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '30px',
          }}
        />
      </div>
      <div className="container mx-auto relative">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium"
          >
            VÌ MỘT TƯƠNG LAI XANH
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900 relative"
          >
            Giải Pháp <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Xanh</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-center text-gray-600 max-w-3xl mx-auto"
          >
            Khám phá những tính năng giúp bạn dễ dàng tái sử dụng, tiết kiệm chi phí và cùng chung tay bảo vệ môi trường.
          </motion.p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              whileHover="hover"
              className={`group relative bg-white/90 backdrop-blur-sm border border-white/20 p-8 rounded-3xl transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden ${feature.hoverColor}`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative z-10">
                <motion.div 
                  className={`text-6xl mb-6 mx-auto w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-lg transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-white transition-colors duration-300 text-center relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 leading-relaxed text-center transition-colors duration-300 mb-6 relative z-10">
                  {feature.description}
                </p>
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}