import React from "react";
import OwnerLayout from "./layout";
import { Package } from "lucide-react";

export default function OwnerDashboard() {
  return (
    <OwnerLayout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Package className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Chào mừng đến với Owner Panel
            </h1>
          </div>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Đây là bảng điều khiển quản lý của chủ sở hữu — nơi bạn có thể quản lý
            sản phẩm, theo dõi yêu cầu thuê hàng và quản lý tài khoản của mình.
          </p>

          <div className="mt-8">
            <p className="text-gray-500">Sử dụng menu bên trái để điều hướng</p>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}

