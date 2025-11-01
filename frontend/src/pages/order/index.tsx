"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { listOrders, renterReturn } from "@/services/auth/order.api";
import type { Order } from "@/services/auth/order.api";
import { RootState } from "@/store/redux_store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import { Badge } from "@/components/ui/common/badge";
import { Button } from "@/components/ui/common/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/common/dialog";
import { format } from "date-fns";
import { Sparkles, ArrowRight, Heart, Star, CheckCircle } from "lucide-react";
interface DecodedToken {
  id?: string;
  _id?: string;
  role?: string;
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const router = useRouter();

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  // Decode token
  let userRole: string | undefined;
  let userId: string | undefined;
  if (accessToken) {
    try {
      const decoded = jwtDecode<DecodedToken>(accessToken);
      userRole = decoded.role?.toLowerCase();
      userId = decoded.id || decoded._id;
    } catch (err) {
      console.error("❌ Decode error:", err);
    }
  }

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await listOrders();
      if (res.code === 200 && Array.isArray(res.data)) setOrders(res.data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleConfirmReturn = async () => {
    if (!selectedOrder) return;
    try {
      setProcessing(selectedOrder._id);
      const res = await renterReturn(
        selectedOrder._id,
        "Khách xác nhận đã trả hàng"
      );
      if (res.code === 200) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === selectedOrder._id ? { ...o, orderStatus: "returned" } : o
          )
        );
      } else {
        console.error(res.message);
      }
    } catch (err) {
      console.error("Return error:", err);
    } finally {
      setProcessing(null);
      setSelectedOrder(null);
      setOpenConfirm(false);
    }
  };

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
    returned: "bg-teal-500",
    completed: "bg-green-600",
    cancelled: "bg-red-600",
    disputed: "bg-orange-600",
  };

  const statusLabel: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    progress: "Đang thuê",
    returned: "Đã trả hàng",
    completed: "Hoàn tất",
    cancelled: "Đã huỷ",
    disputed: "Tranh chấp",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Danh sách đơn hàng của bạn</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card
            key={order._id}
            className="hover:shadow-lg transition cursor-pointer"
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
                    {statusLabel[order.orderStatus]}
                  </Badge>
                </div>
              </div>
              <div className="text-right font-semibold text-blue-600">
                {order.totalAmount.toLocaleString()} {order.currency}
              </div>
            </CardHeader>

            <CardContent className="flex justify-between items-center text-sm text-gray-500">
              <span>Mã đơn: {order.orderGuid}</span>

              {userRole === "renter" &&
                order.orderStatus === "progress" &&
                order.renterId?._id === userId && (
                  <Button
                    className="border border-[#6677ee] bg-white text-[#6677ee] hover:bg-blue-200"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setOpenConfirm(true);
                    }}
                    disabled={processing === order._id}
                  >
                    {processing === order._id ? "Đang gửi..." : "Trả hàng"}
                  </Button>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 🔽 Modal xác nhận */}
      <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận trả hàng</DialogTitle>
          </DialogHeader>
          <p>Bạn có chắc chắn muốn xác nhận đã trả hàng cho đơn này không?</p>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenConfirm(false)}>
              Hủy
            </Button>
            <Button className="bg-[#6677ee]" onClick={handleConfirmReturn} disabled={!!processing}>
              {processing ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
