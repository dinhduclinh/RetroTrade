"use client";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 py-20 px-4">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Cột bên trái */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Cho thuê đồ cũ
            <br />
            <span className="text-indigo-600">Tiết kiệm & Bền vững</span>
          </h1>

          <p className="text-lg text-gray-600">
            Nền tảng chia sẻ và cho thuê đồ cũ hàng đầu Việt Nam
          </p>

          {/* Thanh tìm kiếm + nút bắt đầu ngay */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm đồ bạn muốn thuê..."
                className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button
              size="lg"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto px-8 py-7 text-base font-medium whitespace-nowrap"
            >
              Bắt đầu ngay
            </Button>
          </div>
        </div>

        {/* Cột bên phải: Hình minh họa */}
        <div className="relative">
          <img
            src="/v.gif"
            alt="Hero illustration"
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}
