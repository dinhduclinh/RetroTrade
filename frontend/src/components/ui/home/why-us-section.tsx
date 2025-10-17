"use client"

const reasons = [
  {
    title: "Giao dịch an toàn",
    description: "Bảo mật thông tin tuyệt đối",
    icon: "🔒",
  },
  {
    title: "Giá cả hợp lý",
    description: "Tiết kiệm đến 70%",
    icon: "💵",
  },
  {
    title: "Hỗ trợ 24/7",
    description: "Luôn sẵn sàng hỗ trợ bạn",
    icon: "💬",
  },
]

export function WhyUsSection() {
  return (
    <section className="relative z-10 py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Tại Sao Chọn Chúng Tôi</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
            >
              <div className="text-5xl mb-4">{reason.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">{reason.title}</h3>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
