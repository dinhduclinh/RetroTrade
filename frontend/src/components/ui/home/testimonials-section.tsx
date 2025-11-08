"use client"

import { motion, Variants, useInView } from "framer-motion"
import Image from "next/image"
import { useRef } from "react"

const testimonials = [
  {
    name: "Nguyễn Văn A",
    role: "Khách hàng",
    content: "Dịch vụ tuyệt vời, tiết kiệm được rất nhiều chi phí!",
    avatar: "/professional-woman-portrait.png",
    rating: 5,
  },
  {
    name: "Trần Thị B",
    role: "Người cho thuê",
    content: "Nền tảng dễ sử dụng, giao dịch nhanh chóng và an toàn.",
    avatar: "/professional-man-portrait.png",
    rating: 5,
  },
  {
    name: "Lê Văn C",
    role: "Khách hàng",
    content: "Rất hài lòng với chất lượng sản phẩm và dịch vụ.",
    avatar: "/young-professional-portrait.png",
    rating: 5,
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

const starVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="relative z-10 py-24 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
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
      {/* Floating quote bubbles */}
      <div className="absolute top-1/4 left-5 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/3 right-10 w-16 h-16 bg-purple-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-2/3 left-1/2 w-12 h-12 bg-yellow-200/30 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }} />

      <div ref={ref} className="container mx-auto relative">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl font-bold text-center mb-4 text-gray-900 relative bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600"
        >
          Suy Nghĩ Của Người Dùng Về Chúng Tôi
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-center mb-16 text-gray-600 max-w-2xl mx-auto leading-relaxed"
        >
          Những chia sẻ chân thành từ cộng đồng, truyền cảm hứng cho hành trình bền vững của chúng ta.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              className="relative bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 group overflow-hidden"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/50 shadow-lg group-hover:border-indigo-200 transition-colors duration-300"
                    />
                    {/* Glow effect on avatar */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.div>
                  <div>
                    <motion.h3 
                      className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300"
                      initial={{ x: 20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      {testimonial.name}
                    </motion.h3>
                    <motion.p 
                      className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300"
                      initial={{ x: 20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.1 }}
                      viewport={{ once: true }}
                    >
                      {testimonial.role}
                    </motion.p>
                  </div>
                </div>
                <motion.div 
                  className="flex gap-1 mb-6"
                  variants={starVariants}
                  initial="hidden"
                  whileInView="visible"
                  transition={{ staggerChildren: 0.1, delayChildren: index * 0.2 + 0.5 }}
                >
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.svg 
                      key={i} 
                      className="w-6 h-6 text-yellow-400 group-hover:text-yellow-500 transition-colors duration-300" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      variants={starVariants}
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                </motion.div>
                <motion.p 
                  className="text-gray-700 leading-relaxed relative z-10 italic group-hover:text-gray-800 transition-colors duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.8 }}
                  viewport={{ once: true }}
                >
                  "{testimonial.content}"
                </motion.p>
              </div>
              {/* Hover accent line at bottom */}
              <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 w-0 group-hover:w-full transition-all duration-700"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}