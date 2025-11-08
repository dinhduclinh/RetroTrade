"use client";
import { Button } from "@/components/ui/common/button";
import { motion, type Variants } from "framer-motion";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { MessageCircle, ShoppingBag } from "lucide-react";

const buttonsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
};

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
        <motion.div className="space-y-6" initial="hidden" animate="visible">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Cho thuê đồ cũ
            <br />
            <span className="text-indigo-600">Tiết kiệm & Bền vững</span>
          </h1>

          <p className="text-lg text-gray-600">
            Nền tảng chia sẻ và cho thuê đồ cũ hàng đầu Việt Nam
          </p>

          {/* Buttons Container */}
          <motion.div 
            variants={buttonsContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto md:mx-0"
          >
            <motion.div 
              className="flex-1"
              variants={buttonVariants}
              whileHover="hover"
            >
              <Link href="/auth/messages" className="block w-full">
                <Button
                  size="lg"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-base font-medium whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Tư vấn ngay
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              className="flex-1"
              variants={buttonVariants}
              whileHover="hover"
            >
              <Link href="/products" className="block w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-6 text-base font-medium whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Xem sản phẩm
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

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