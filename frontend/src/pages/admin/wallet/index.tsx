import React from "react";
import { Card, CardContent } from "@/components/ui/common/card";
import { Button } from "@/components/ui/common/button";
import { Wallet, RotateCcw, CreditCard } from "lucide-react";
import Link from "next/link";

export default function WalletDashboard() {
  const cardItems = [
    {
      title: "Quản lý rút tiền",
      description: "Duyệt và xử lý các yêu cầu rút tiền của người dùng.",
      icon: <Wallet className="w-6 h-6 text-blue-600" />,
      link: "/admin/wallet/withdraw",
      color: "from-blue-50 to-blue-100",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Quản lý hoàn tiền",
      description: "Theo dõi và quản lý các yêu cầu hoàn tiền từ người thuê.",
      icon: <RotateCcw className="w-6 h-6 text-green-600" />,
      link: "/admin/wallet/refund",
      color: "from-green-50 to-green-100",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Quản lý giao dịch",
      description: "Xem và thống kê toàn bộ lịch sử giao dịch của hệ thống.",
      icon: <CreditCard className="w-6 h-6 text-purple-600" />,
      link: "/admin/wallet/transaction",
      color: "from-purple-50 to-purple-100",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wallet className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Quản lý ví</h1>
      </div>

      {/* Grid 3 card */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cardItems.map((item) => (
          <Card
            key={item.title}
            className={`bg-gradient-to-br ${item.color} border border-gray-200 shadow-sm hover:shadow-md transition-transform hover:-translate-y-1`}
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {item.icon}
                  <h2 className="text-lg font-semibold text-gray-800">{item.title}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              </div>

              <div className="mt-auto">
                <Link href={item.link}>
                  <Button className={`w-full text-white ${item.buttonColor}`}>
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
