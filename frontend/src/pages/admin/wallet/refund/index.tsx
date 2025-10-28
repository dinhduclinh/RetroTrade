"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card";

export default function RefundPage() {
  const refunds = [
    { id: 1, user: "Phạm Minh C", amount: 300000, status: "Chờ xử lý" },
    { id: 2, user: "Lê Hồng D", amount: 150000, status: "Đã hoàn tiền" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="text-green-600 w-6 h-6" />
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hoàn tiền</h1>
        </div>
        <Link href="/admin/wallet">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Button>
        </Link>
      </div>

      {/* Danh sách yêu cầu hoàn tiền */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu hoàn tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-700">
                <th className="p-3">Người dùng</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{r.user}</td>
                  <td className="p-3">{r.amount.toLocaleString()} VNĐ</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3 text-center">
                    <Button size="sm" variant="secondary">
                      Cập nhật
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
