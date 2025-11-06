"use client"

import { motion, Variants } from "framer-motion"

const reasons = [
  {
    title: "Giao dịch an toàn",
    description: "Bảo mật thông tin tuyệt đối",
    icon: "🔒",
    color: "from-indigo-500 to-purple-600"
  },
  {
    title: "Giá cả hợp lý",
    description: "Tiết kiệm đến 70%",
    icon: "💵",
    color: "from-emerald-500 to-teal-600"
  },
  {
    title: "Hỗ trợ 24/7",
    description: "Luôn sẵn sàng hỗ trợ bạn",
    icon: "💬",
    color: "from-amber-400 to-orange-500"
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
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
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.15,
    },
  }),
  hover: {
    scale: 1.05,
    y: -10,
    transition: {
      duration: 0.4,
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

export function WhyUsSection() {
  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-br from-gray-50 via-white to-indigo-50 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-emerald-200/30 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto relative">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-5xl md:text-6xl font-bold text-center mb-6 text-gray-900 relative bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600"
        >
          Tại Sao Chọn Chúng Tôi
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-xl text-center mb-16 text-gray-600 max-w-3xl mx-auto leading-relaxed font-light"
        >
          Khám phá những lý do khiến hàng ngàn người dùng tin tưởng và lựa chọn nền tảng của chúng tôi.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={itemVariants}
              whileHover="hover"
              className="relative bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 group overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div 
                  className={`text-6xl mb-6 mx-auto w-20 h-20 bg-gradient-to-br ${reason.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-400`}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 300 }}
                >
                  {reason.icon}
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold mb-4 text-gray-900 text-center group-hover:text-gray-800 transition-colors duration-300"
                  initial={{ y: 10, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  viewport={{ once: true }}
                >
                  {reason.title}
                </motion.h3>
                <motion.p 
                  className="text-gray-600 text-center leading-relaxed group-hover:text-gray-700 transition-colors duration-300"
                  initial={{ y: 10, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                  viewport={{ once: true }}
                >
                  {reason.description}
                </motion.p>
              </div>
              {/* Hover accent line */}
              <motion.div 
                className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${reason.color} w-0 group-hover:w-full transition-all duration-700`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}