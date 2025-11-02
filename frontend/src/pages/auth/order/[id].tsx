// pages/order/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getOrderDetails, Order } from "@/services/auth/order.api";
import { getCurrentTax } from "@/services/tax/tax.api";
import { format } from "date-fns";
import {
  Package,
  MapPin,
  Calendar,
  CreditCard,
  User,
  FileText,
  Loader2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Home,
  ShoppingBag,
  Eye,
  ChevronRight,
  Store,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/common/button";
import Link from "next/link";

// Helper function to calculate rental duration
const calculateRentalDuration = (
  startDate: string,
  endDate: string,
  priceUnit?: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());

  switch (priceUnit?.toLowerCase()) {
    case "giờ":
    case "hour":
    case "hours":
      return Math.ceil(diffTime / (1000 * 60 * 60)) || 1;
    case "ngày":
    case "day":
    case "days":
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    case "tuần":
    case "week":
    case "weeks":
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) || 1;
    case "tháng":
    case "month":
    case "months":
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) || 1;
    default:
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }
};

const getRentalDurationText = (duration: number, priceUnit?: string): string => {
  const unit = priceUnit?.toLowerCase();
  switch (unit) {
    case "giờ":
    case "hour":
    case "hours":
      return `${duration} giờ`;
    case "ngày":
    case "day":
    case "days":
      return `${duration} ngày`;
    case "tuần":
    case "week":
    case "weeks":
      return `${duration} tuần`;
    case "tháng":
    case "month":
    case "months":
      return `${duration} tháng`;
    default:
      return `${duration} ngày`;
  }
};

// Format price helper
const formatPrice = (price: number, currency: string) => {
  if (currency === "VND" || !currency) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

// Helper functions to convert status to Vietnamese
const getOrderStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    progress: "Đang thuê",
    returned: "Đã trả hàng",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    disputed: "Tranh chấp",
  };
  return statusMap[status.toLowerCase()] || status;
};

const getPaymentStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Chờ thanh toán",
    not_paid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    refunded: "Đã hoàn tiền",
    partial: "Thanh toán một phần",
  };
  return statusMap[status.toLowerCase()] || status;
};

// Get status badge color
const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "progress":
    case "active":
    case "in_progress":
      return "bg-green-100 text-green-800 border-green-200";
    case "returned":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "disputed":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "not_paid":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "refunded":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "partial":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(3); // Default 3%

 useEffect(() => {
   if (!id) return;

   const fetchOrder = async () => {
     try {
       const res = await getOrderDetails(id as string);
       if (res.code === 200 && res.data) {
         setOrder(res.data); 
       } else {
         setError(res.message || "Không tìm thấy đơn hàng");
         setOrder(null); 
       }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Lỗi khi tải dữ liệu đơn hàng"
        );
       setOrder(null);
     } finally {
       setLoading(false);
     }
   };

   fetchOrder();
 }, [id]);

  // Fetch tax rate
  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const response = await getCurrentTax();
        if (response.success && response.data) {
          setTaxRate(response.data.taxRate);
        }
      } catch (error) {
        console.error("Error fetching tax rate:", error);
      }
    };
    fetchTaxRate();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    // Breadcrumb data for error state
    const breadcrumbs = [
      { label: "Trang chủ", href: "/home", icon: Home },
      { label: "Giỏ hàng", href: "/auth/cartitem", icon: ShoppingBag },
      { label: "Xác nhận thuê", href: "/auth/order", icon: Truck },
      { label: "Chi tiết đơn hàng", href: `/auth/order/${id}`, icon: Eye },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => {
                const IconComponent = breadcrumb.icon;
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <div
                    key={breadcrumb.href}
                    className="flex items-center space-x-2"
                  >
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}

                    {isLast ? (
                      <span className="flex items-center space-x-1 text-gray-900 font-medium">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{breadcrumb.label}</span>
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{breadcrumb.label}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-600 mb-6">{error || "Đơn hàng không tồn tại hoặc đã bị xóa"}</p>
            <Link href="/order">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Xem danh sách đơn hàng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rentalDuration = calculateRentalDuration(
    order.startAt,
    order.endAt,
    order.itemSnapshot.priceUnit
  );
  const durationText = getRentalDurationText(
    rentalDuration,
    order.itemSnapshot.priceUnit
  );

  // Calculate pricing breakdown
  const rentalTotal = order.itemSnapshot.basePrice * order.unitCount * rentalDuration;
  const taxAmount = order.serviceFee || (rentalTotal * taxRate) / 100;
  const depositAmount = order.depositAmount || 0;
  const grandTotal = order.totalAmount;

  // Breadcrumb data
  const breadcrumbs = [
    { label: "Trang chủ", href: "/home", icon: Home },
    { label: "Giỏ hàng", href: "/auth/cartitem", icon: ShoppingBag },
    { label: "Xác nhận thuê", href: "/auth/order", icon: Truck },
    { label: "Chi tiết đơn hàng", href: `/auth/order/${id}`, icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => {
              const IconComponent = breadcrumb.icon;
              const isLast = index === breadcrumbs.length - 1;

  return (
                <div
                  key={breadcrumb.href}
                  className="flex items-center space-x-2"
                >
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}

                  {isLast ? (
                    <span className="flex items-center space-x-1 text-gray-900 font-medium">
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{breadcrumb.label}</span>
                    </span>
                  ) : (
                    <Link
                      href={breadcrumb.href}
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{breadcrumb.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 flex items-center justify-center gap-4">
              <FileText className="w-12 h-12 text-emerald-600" />
              Chi tiết đơn hàng
            </h1>
            <p className="text-lg text-gray-600 mt-3">
              Mã đơn hàng: <span className="font-mono font-semibold">{order.orderGuid}</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status & Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-wrap gap-3 mb-6">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadgeColor(
                    order.orderStatus
                  )}`}
                >
                  Trạng thái đơn hàng: {getOrderStatusLabel(order.orderStatus)}
                </span>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadgeColor(
                    order.paymentStatus
                  )}`}
                >
                  Thanh toán: {getPaymentStatusLabel(order.paymentStatus)}
                </span>
              </div>

              {/* Product Info */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  Thông tin sản phẩm
                </h2>
                <div className="flex gap-6">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex-shrink-0 overflow-hidden">
                    {order.itemSnapshot.images?.[0] ? (
                      <img
                        src={order.itemSnapshot.images[0]}
                        alt={order.itemSnapshot.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-14 h-14" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {order.itemSnapshot.title}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {order.unitCount} cái
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                        {durationText}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-base text-gray-700">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      {format(new Date(order.startAt), "dd/MM/yyyy HH:mm")} →{" "}
                      {format(new Date(order.endAt), "dd/MM/yyyy HH:mm")}
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Giá thuê:</span>
                        <p className="text-xl font-bold text-emerald-600">
                          {formatPrice(rentalTotal, order.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-red-600" />
                Địa chỉ giao hàng
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-800 font-medium">
                    {order.shippingAddress.fullName}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">
                    {order.shippingAddress.street}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">
                    {order.shippingAddress.ward}
                    {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
                    {`, ${order.shippingAddress.province}`}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">{order.shippingAddress.phone}</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                Thông tin người tham gia
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Người thuê */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      {order.renterId.avatarUrl ? (
                        <Image
                          src={order.renterId.avatarUrl}
                          alt={order.renterId.fullName}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-200 border-2 border-blue-300 flex items-center justify-center">
                          <User className="w-8 h-8 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-1">Người thuê</h3>
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full w-fit">
                        <User className="w-3 h-3" />
                        <span>Người mua</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Họ và tên</p>
                        <p className="text-base font-semibold text-gray-800">{order.renterId.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-700 break-all">{order.renterId.email}</p>
                      </div>
                    </div>
                  </div>
      </div>

                {/* Người cho thuê */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      {order.ownerId.avatarUrl ? (
                        <Image
                          src={order.ownerId.avatarUrl}
                          alt={order.ownerId.fullName}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center">
                          <Store className="w-8 h-8 text-emerald-600" />
                        </div>
                      )}
                    </div>
      <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-1">Người cho thuê</h3>
                      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full w-fit">
                        <Store className="w-3 h-3" />
                        <span>Chủ cửa hàng</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-emerald-200">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <User className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Họ và tên</p>
                        <p className="text-base font-semibold text-gray-800">{order.ownerId.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Mail className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-700 break-all">{order.ownerId.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-emerald-200">
                    <Link href={`/store/${order.ownerId.userGuid || order.ownerId._id}`}>
                      <Button
                        variant="outline"
                        className="w-full text-emerald-600 border-emerald-300 hover:bg-emerald-100 font-medium"
                      >
                        <Store className="w-4 h-4 mr-2" />
                        Xem cửa hàng
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-xl p-8 sticky top-24">
              <h2 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                Tóm tắt thanh toán
              </h2>
              <div className="space-y-4 text-base">
                <div className="flex justify-between">
                  <span>Tiền thuê</span>
                  <span>{formatPrice(rentalTotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-yellow-200">
                  <span>Phí dịch vụ ({taxRate}%)</span>
                  <span>{formatPrice(taxAmount, order.currency)}</span>
                </div>
                <div className="flex justify-between text-amber-200">
                  <span>Tiền cọc</span>
                  <span>{formatPrice(depositAmount, order.currency)}</span>
                </div>
                <div className="flex justify-between text-yellow-200 text-xs">
                  <span>(Hoàn lại tiền cọc sau khi trả đồ)</span>
                </div>
                <div className="border-t border-emerald-400 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-2xl">
                      {formatPrice(grandTotal, order.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-emerald-400 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Truck className="w-4 h-4" />
                  <span>Phương thức: {order.paymentMethod}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ngày tạo: {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-100 bg-white/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                <span>Thanh toán an toàn qua {order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
