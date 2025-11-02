import React from "react";
import AdminLayout from "./layout";
import { Crown } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-10 h-10 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">
              Chào mừng đến với RetroTrade Admin
            </h1>
          </div>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Đây là bảng điều khiển quản trị hệ thống — nơi bạn có thể theo dõi,
            quản lý người dùng, sản phẩm, giao dịch ví, và thống kê tổng thể.
          </p>

          <div className="mt-8">
            <p className="text-gray-500">Sử dụng menu bên trái để điều hướng</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
