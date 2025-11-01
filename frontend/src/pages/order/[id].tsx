"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getOrderDetails,
  confirmOrder,
  startOrder,
  renterReturn,
  ownerComplete,
  cancelOrder,
} from "@/services/auth/order.api";
import { format } from "date-fns";
import {
  Package,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react";
import type { Order } from "@/services/auth/order.api";
import Image from "next/image";
import { getCurrentTax } from "@/services/tax/tax.api";
interface TimelineStep {
  status: string;
  label: string;
  date?: string;
  active: boolean;
  current: boolean;
  cancelled?: boolean;
}

const getUnitName = (priceUnit: string | undefined): string => {
  if (!priceUnit) return "đơn vị";
  const map: Record<string, string> = {
    "1": "giờ",
    "2": "ngày",
    "3": "tuần",
    "4": "tháng",
  };
  return map[priceUnit] || "đơn vị";
};


const calculateRentalAmount = (order: Order): number => {
  const basePrice = order.itemSnapshot.basePrice ?? 0;
  const duration = order.rentalDuration ?? 0;
  const count = order.unitCount ?? 1;
  return basePrice * duration * count;
};

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => Promise<void>>(
    () => async () => {}
  );
  const [taxRate, setTaxRate] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await getOrderDetails(id as string);
      if (res.data) {
        setOrder(res.data);
        // Calculate tax rate from order data if available
        const rentalAmount = calculateRentalAmount(res.data);
        const serviceFee = res.data.serviceFee || 0;
        if (rentalAmount > 0 && serviceFee > 0) {
          // Calculate tax rate from serviceFee
          const calculatedTaxRate = Math.round((serviceFee / rentalAmount) * 100);
          setTaxRate(calculatedTaxRate);
        } else {
          // Fetch current tax rate as fallback
          try {
            const taxResponse = await getCurrentTax();
            if (taxResponse.success && taxResponse.data) {
              setTaxRate(taxResponse.data.taxRate);
            } else {
              setTaxRate(3); // Default fallback
            }
          } catch {
            setTaxRate(3); // Default fallback
          }
        }
      }
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    setPendingAction(() => action);
    setShowConfirm(true);
  };

  const executeAction = async () => {
    setActionLoading(true);
    try {
      await pendingAction();
      await loadOrder();
    } catch (error) {
      alert("Thao tác thất bại");
    } finally {
      setShowConfirm(false);
      setActionLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  const timelineSteps: TimelineStep[] = [
    {
      status: "pending",
      label: "Chờ xác nhận",
      active: true,
      current: order.orderStatus === "pending",
    },
    {
      status: "confirmed",
      label: "Đã xác nhận",
      active: ["confirmed", "progress", "completed"].includes(order.orderStatus),
      current: order.orderStatus === "confirmed",
    },
    {
      status: "progress",
      label: "Đang thuê",
      active: ["progress", "returned", "completed"].includes(order.orderStatus),
      current: order.orderStatus === "progress",
    },
    {
      status: "returned",
      label: "Đã trả",
      active: ["returned", "completed"].includes(order.orderStatus),
      current: order.orderStatus === "returned",
    },
    {
      status: "completed",
      label: "Hoàn tất",
      active: order.orderStatus === "completed",
      current: order.orderStatus === "completed",
    },
    {
      status: "cancelled",
      label: "Đã hủy",
      active: order.orderStatus === "cancelled",
      current: order.orderStatus === "cancelled",
    },
  ];

  const canConfirm = order.orderStatus === "pending";
  const canStart = order.orderStatus === "confirmed";
  const canReturn = order.orderStatus === "progress";
  const canComplete = order.orderStatus === "returned";
  const canCancel = ["pending", "confirmed"].includes(order.orderStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FileText className="w-8 h-8 text-emerald-600" />
                Đơn hàng #{order.orderGuid.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Tạo ngày:{" "}
                {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                ${
                  order.orderStatus === "completed"
                    ? "bg-green-100 text-green-700"
                    : order.orderStatus === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : order.orderStatus === "progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {order.orderStatus === "pending" && "Chờ xác nhận"}
                {order.orderStatus === "confirmed" && "Đã xác nhận"}
                {order.orderStatus === "progress" && "Đang thuê"}
                {order.orderStatus === "returned" && "Đã trả"}
                {order.orderStatus === "completed" && "Hoàn tất"}
                {order.orderStatus === "cancelled" && "Đã hủy"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Sản phẩm thuê
              </h2>
              <div className="flex gap-6 items-start">
                <div className="w-40 h-40 bg-gray-200 border-2 border-dashed rounded-xl overflow-hidden flex-shrink-0">
                  {order.itemSnapshot.images[0] ? (
                    <img
                      src={order.itemSnapshot.images[0]}
                      alt={order.itemSnapshot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-gray-400 m-auto" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-gray-800">
                    {order.itemSnapshot.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Số lượng: <strong>{order.unitCount} cái</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Giá thuê:{" "}
                    <strong>
                      {order.itemSnapshot.basePrice.toLocaleString("vi-VN")}₫/
                      {getUnitName(order.itemSnapshot.priceUnit)}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Cọc:{" "}
                    <strong>
                      {(
                        order.depositAmount ?? 0 / order.unitCount
                      ).toLocaleString("vi-VN")}
                      ₫/cái
                    </strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Thời gian thuê:{" "}
                    <strong>
                      {order.rentalDuration} {order.rentalUnit}
                    </strong>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {format(new Date(order.startAt), "dd/MM/yyyy HH:mm")} →{" "}
                    {format(new Date(order.endAt), "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 px-3 py-2 rounded-lg mt-6">
                <Image
                  src={order.ownerId.avatarUrl || ""}
                  alt={order.ownerId.fullName || "Chủ sở hữu"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {order.ownerId.fullName || "Chủ sở hữu"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {order.ownerId.email || "Không có email"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4">Hành trình đơn hàng</h2>

              <div className="space-y-4">
                {order.orderStatus === "cancelled" ? (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-700">
                      <XCircle className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-red-700">Đã hủy</p>

                      {order.updatedAt && (
                        <p className="text-xs text-gray-500">
                          {format(
                            new Date(order.updatedAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </p>
                      )}

                      {order.cancelReason && (
                        <div
                          className="mt-2 flex items-start gap-2 animate-fadeIn"
                          title={String(order.cancelReason)}
                        >
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                          <p className="text-xs text-amber-600 italic max-w-[250px] truncate">
                            Lý do: {order.cancelReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  timelineSteps
                    .filter((s) => s.status !== "cancelled")
                    .map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            step.current
                              ? "bg-emerald-600 text-white"
                              : step.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {step.active || step.current ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              step.current
                                ? "text-emerald-700"
                                : step.active
                                ? "text-gray-700"
                                : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.current && (
                            <p className="text-xs text-gray-500">
                              Đang xử lý...
                            </p>
                          )}
                        </div>
                        {idx < timelineSteps.length - 2 && (
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-red-600" />
                Địa chỉ nhận hàng
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{order.shippingAddress.fullName}</strong>
                </p>
                <p>
                  {order.shippingAddress.street}, {order.shippingAddress.ward},{" "}
                  {order.shippingAddress.province}
                </p>
                <p>SĐT: {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-xl p-6">
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                <CreditCard className="w-7 h-7" />
                Chi tiết thanh toán
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Tiền thuê</span>
                  <span className="font-medium">
                    {calculateRentalAmount(order).toLocaleString("vi-VN")}₫
                  </span>
                </div>

                <div className="flex justify-between text-cyan-200">
                  <span>
                    Phí dịch vụ
                    {taxRate !== null ? ` (${taxRate}%)` : ""}
                  </span>
                  <span>
                    {(order.serviceFee || 0).toLocaleString("vi-VN")}₫
                  </span>
                </div>

                <div className="flex justify-between text-amber-200">
                  <span>Tiền cọc (hoàn lại)</span>
                  <span>
                    {(order.depositAmount || 0).toLocaleString("vi-VN")}₫
                  </span>
                </div>

                <div className="border-t border-emerald-400 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng thanh toán</span>
                    <span className="text-2xl">
                      {order.totalAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                Trạng thái thanh toán
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Thanh toán</span>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    ${
                      order.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : order.paymentStatus === "not_paid"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {order.paymentStatus === "paid" && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Đã thanh toán
                    </>
                  )}
                  {order.paymentStatus === "not_paid" && (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Chưa thanh toán
                    </>
                  )}
                  {order.paymentStatus === "refunded" && "Đã hoàn tiền"}
                </span>
              </div>
            </div>

            {/* Hợp đồng */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Hợp đồng thuê
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Hợp đồng</span>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    ${
                      order.isContractSigned
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  {order.isContractSigned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Đã ký
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Chưa ký
                    </>
                  )}
                </span>
              </div>
              {!order.isContractSigned && (
                <button className="mt-3 w-full bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700 transition">
                  Ký hợp đồng ngay
                </button>
              )}
            </div>

            {/* Tiện ích */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <button className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-emerald-600 transition text-sm">
                <Download className="w-4 h-4" /> Tải hóa đơn
              </button>
              <button className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-emerald-600 transition text-sm">
                <Share2 className="w-4 h-4" /> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <h3 className="font-bold text-lg">Xác nhận hành động</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn thực hiện hành động này?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-xl font-medium"
              >
                Hủy
              </button>
              <button
                onClick={executeAction}
                disabled={actionLoading}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
