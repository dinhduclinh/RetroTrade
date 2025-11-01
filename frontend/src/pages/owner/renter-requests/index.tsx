"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listOrders,
  confirmOrder,
  cancelOrder,
  startOrder,
  ownerComplete
} from "@/services/auth/order.api";
import type { Order } from "@/services/auth/order.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import { Badge } from "@/components/ui/common/badge";
import { Button } from "@/components/ui/common/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/common/dialog";

export default function OwnerRenterRequests() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");

  const router = useRouter();

  const tabs = [
    { key: "pending", label: "Yêu cầu đơn hàng" },
    { key: "confirmed", label: "Đã xác nhận" },
    { key: "progress", label: "Đang thuê" },
    { key: "returned", label: "Chờ xác nhận trả hàng" },
    { key: "completed", label: "Hoàn tất" },
    { key: "cancelled", label: "Đã hủy" },
    { key: "disputed", label: "Tranh chấp" },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const res = await listOrders();
      if (res.code === 200 && Array.isArray(res.data)) {
        const filtered = res.data.filter(
          (o) => o.orderStatus === selectedStatus
        );
        setOrders(filtered);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [selectedStatus]);

  const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy");

  const handleOpenRejectModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRejectReason("");
    setOpenRejectModal(true);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    progress: "bg-purple-500",
    returned: "bg-orange-500",
    completed: "bg-green-600",
    cancelled: "bg-red-600",
    disputed: "bg-gray-600",
  };

  const handleConfirm = async (orderId: string) => {
    const res = await confirmOrder(orderId);
    if (res.code === 200) {
      toast.success("✅ Đã xác nhận đơn hàng");
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } else {
      toast.error("Lỗi khi xác nhận đơn hàng");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    if (!selectedOrderId) return;

    const res = await cancelOrder(selectedOrderId, rejectReason);
    if (res.code === 200) {
      toast.success("❌ Đã từ chối đơn hàng");
      setOrders((prev) => prev.filter((o) => o._id !== selectedOrderId));
    } else {
      toast.error("Lỗi khi từ chối đơn hàng");
    }

    setOpenRejectModal(false);
  };
  const handleStartOrder = async (orderId: string) => {
    try {
      const res = await startOrder(orderId);
      if (res.code === 200) {
        toast.success("Đơn hàng đã bắt đầu thuê");
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        toast.error(res.message || "Không thể bắt đầu thuê");
      }
    } catch (err) {
      toast.error("Lỗi khi bắt đầu thuê");
    }
  };
 const handleConfirmReturn = async (orderId: string) => {
   try {
     const res = await ownerComplete(orderId, {
       conditionStatus: "Good",
       ownerNotes: "Hàng đã kiểm tra, không hư hại.",
     });

     if (res.code === 200) {
       toast.success(" Đã xác nhận trả hàng");
       setOrders((prev) => prev.filter((o) => o._id !== orderId));
     } else {
       toast.error(res.message || "Lỗi khi xác nhận trả hàng");
     }
   } catch (err) {
     toast.error("Không thể xác nhận trả hàng");
   }
 };




  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý đơn thuê hàng</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selectedStatus === tab.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-10 font-medium">Đang tải dữ liệu...</p>
      ) : orders.length === 0 ? (
        <p className="text-center py-10 text-gray-500">
          Không có đơn hàng trong trạng thái này.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="transition hover:shadow-lg">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 border-b border-blue-200">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <AlertCircle className="w-4 h-4" />
                  Mã đơn: <span className="font-mono">{order.orderGuid}</span>
                </div>
              </div>
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
                    Người thuê:{" "}
                    <span className="font-medium">
                      {order.renterId?.fullName}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Thời gian:{" "}
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

              <CardContent className="flex justify-end gap-3">
                {order.orderStatus === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                      onClick={() => handleOpenRejectModal(order._id)}
                    >
                      Từ chối
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#6677ee] hover:bg-blue-700 text-white font-medium shadow-sm"
                      onClick={() => handleConfirm(order._id)}
                    >
                      Xác nhận
                    </Button>
                  </>
                )}

                {order.orderStatus === "confirmed" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                    onClick={() => handleStartOrder(order._id)}
                  >
                    Bắt đầu thuê
                  </Button>
                )}

                {order.orderStatus === "returned" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                    onClick={() => handleConfirmReturn(order._id)}
                  >
                    Xác nhận trả hàng
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu thuê</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            placeholder="Nhập lý do từ chối..."
            className="w-full border rounded px-3 py-2 mt-2"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenRejectModal(false)}>
              Hủy
            </Button>
            <Button className="bg-[#6677ee]" onClick={handleConfirmReject}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
