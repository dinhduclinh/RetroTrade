import React from "react";
import AdminLayout from "./layout";
import { Sparkles, Crown } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl p-10">
        {/* Hiệu ứng ánh sáng mờ */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_50%)] pointer-events-none" />

        {/* Nội dung chính */}
        <div className="relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-10 h-10 text-yellow-300 animate-bounce drop-shadow-lg" />
            <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">
              Chào mừng đến với RetroTrade Admin
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-200 animate-pulse" />
          </div>

          <p className="text-lg text-indigo-100 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Đây là bảng điều khiển quản trị hệ thống — nơi bạn có thể theo dõi, quản lý
            người dùng, sản phẩm, giao dịch ví, và thống kê tổng thể.
          </p>

          <div className="mt-8">
            <button className="px-6 py-3 bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition transform">
              Bắt đầu quản lý ngay
            </button>
          </div>
        </div>

        {/* Hiệu ứng nền bay */}
        <div className="absolute w-[600px] h-[600px] bg-pink-400/30 blur-[120px] rounded-full -bottom-40 -right-40 animate-pulse" />
      </div>
    </AdminLayout>
  );
}
