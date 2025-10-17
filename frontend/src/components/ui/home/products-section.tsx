"use client"

import { Button } from "@/components/ui/common/button"
import Image from "next/image"
import { useState } from "react"

const products = [
  {
    name: "Laptop Dell XPS 13",
    price: "500.000đ/ngày",
    image: "/modern-laptop-computer.jpg",
  },
  {
    name: "Canon EOS R6",
    price: "800.000đ/ngày",
    image: "/professional-camera.png",
  },
  {
    name: "Wacom Drawing Tablet",
    price: "300.000đ/ngày",
    image: "/drawing-tablet-with-stylus.jpg",
  },
]

export function ProductsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="relative z-10 py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Sản Phẩm Nổi Bật</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="relative overflow-hidden h-64">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={256}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    hoveredIndex === index ? "scale-110 rotate-2" : "scale-100"
                  }`}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900">{product.name}</h3>
                <p className="text-2xl font-bold text-indigo-600 mb-4">{product.price}</p>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Xem chi tiết</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
