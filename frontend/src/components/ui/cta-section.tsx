"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="relative z-10 py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-4 left-4 text-6xl opacity-20">🌿</div>
          <div className="absolute bottom-4 right-4 text-6xl opacity-20">♻️</div>
          <div className="absolute top-1/2 right-8 text-4xl opacity-20">🌍</div>

          <h2 className="text-4xl font-bold mb-4">Bắt đầu giao dịch ngay</h2>
          <p className="text-xl mb-8 text-indigo-100">Tham gia cộng đồng RetroTrade của chúng tôi ngay hôm nay</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
              <Link href="/auth/register">Đăng ký ngay</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
              <Link href="#features">Tìm hiểu thêm</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
