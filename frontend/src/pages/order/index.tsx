"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listOrders } from "@/services/auth/order.api";
import type { Order } from "@/services/auth/order.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import { Badge } from "@/components/ui/common/badge";
import { format } from "date-fns";

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await listOrders();
      if (res.code === 200 && Array.isArray(res.data)) {
        setOrders(res.data);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading)
    return (
      <p className="text-center py-10 font-medium">Đang tải đơn hàng...</p>
    );
  if (orders.length === 0)
    return (
      <p className="text-center py-10 font-medium">Chưa có đơn hàng nào!</p>
    );

  const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy");

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    progress: "bg-purple-500",
    completed: "bg-green-600",
    cancelled: "bg-red-600",
    disputed: "bg-orange-600",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Danh sách đơn hàng của bạn</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card
            key={order._id}
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => router.push(`/order/${order._id}`)}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <img
                src={
                  order.itemSnapshot?.images?.[0] || order.itemId?.Images?.[0]
                }
                alt="item"
                className="w-20 h-20 object-cover rounded-md"
              />
              <div className="flex-1">
                <CardTitle>
                  {order.itemSnapshot?.title || order.itemId?.Title}
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Thời gian thuê:{" "}
                  <span className="font-medium">
                    {formatDate(order.startAt)} → {formatDate(order.endAt)}
                  </span>
                </div>
                <div className="mt-1">
                  <Badge className={statusColor[order.orderStatus]}>
                    {order.orderStatus}
                  </Badge>
                </div>
              </div>
              <div className="text-right font-semibold text-blue-600">
                {order.totalAmount.toLocaleString()} {order.currency}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-500">
              Mã đơn: {order.orderGuid}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
