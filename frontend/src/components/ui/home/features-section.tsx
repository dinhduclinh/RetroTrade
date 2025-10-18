"use client"

const features = [
  {
    title: "Cho thuê đồ cũ",
    description: "Tiết kiệm chi phí, bảo vệ môi trường",
    icon: "📦",
  },
  {
    title: "Mua bán đồ cũ",
    description: "Giao dịch an toàn, nhanh chóng",
    icon: "💰",
  },
  {
    title: "Chia sẻ câu chuyện",
    description: "Kết nối cộng đồng yêu môi trường",
    icon: "💬",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative z-10 py-20 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Tính Năng Chính</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-indigo-600 text-white p-8 rounded-2xl hover:scale-105 transition-transform duration-300 shadow-lg"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-indigo-100">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
