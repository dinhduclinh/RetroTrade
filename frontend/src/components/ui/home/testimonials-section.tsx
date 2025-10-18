"use client"

import Image from "next/image"

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

export function TestimonialsSection() {
  return (
    <section className="relative z-10 py-20 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Suy Nghĩ Của Người Dùng Về Chúng Tôi</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
