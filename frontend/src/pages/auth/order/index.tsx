import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { createOrderAction } from "@/store/order/orderActions";
import { removeItemFromCartAction } from "@/store/cart/cartActions";
import type { CartItem } from "@/services/auth/cartItem.api";
import { format } from "date-fns";
import {
  Package,
  MapPin,
  Truck,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";


const calculateRentalDays = (item: CartItem): number => {
  if (!item.rentalStartDate || !item.rentalEndDate) return 0;
  const start = new Date(item.rentalStartDate);
  const end = new Date(item.rentalEndDate);
  const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  let unitCount: number;

  switch (item.priceUnit.toLowerCase()) {
    case "hour":
    case "giờ":
      unitCount = Math.ceil(totalHours);
      break;
    case "day":
    case "ngày":
      unitCount = Math.ceil(totalHours / 24);
      break;
    case "week":
    case "tuần":
      unitCount = Math.ceil(totalHours / (24 * 7));
      break;
    case "month":
    case "tháng":
      unitCount = Math.ceil(totalHours / (24 * 30));
      break;
    default:
      unitCount = Math.ceil(totalHours / 24);
  }
  return Math.max(1, unitCount);
};


const getRentalDurationText = (
  duration: number,
  priceUnit?: string
): string => {
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


export default function Checkout() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState({
    fullName: "",
    street: "",
    ward: "",
    province: "",
    phone: "",
  });
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDates, setEditingDates] = useState<{
    [key: string]: { start: string; end: string };
  }>({});
  // Bắt đầu chỉnh sửa
  const startEditing = (id: string, start?: string, end?: string) => {
    setEditingDates((prev) => ({
      ...prev,
      [id]: {
        start: start ? start.substring(0, 16) : "",
        end: end ? end.substring(0, 16) : "",
      },
    }));
  };

  const saveEditing = (id: string) => {
    const { start, end } = editingDates[id];
    if (!start || !end) {
      alert("Vui lòng chọn đầy đủ thời gian thuê");
      return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) {
      alert("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, rentalStartDate: start, rentalEndDate: end }
          : item
      )
    );

    setEditingDates((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };


  // Lấy từ sessionStorage
  useEffect(() => {
    const itemsStr = sessionStorage.getItem("checkoutItems");
    if (!itemsStr) {
      router.push("/auth/cartitem");
      return;
    }
    const items: CartItem[] = JSON.parse(itemsStr);
    const invalid = items.find((i) => !i.rentalStartDate || !i.rentalEndDate);
    if (invalid) {
      alert(`Sản phẩm "${invalid.title}" chưa có ngày thuê hợp lệ.`);
      router.push("/auth/cartitem");
      return;
    }
    setCartItems(items);
  }, [router]);

  // === TÍNH TOÁN CÓ THUẾ 10% ===
  const TAX_RATE = 0.1;

  const rentalTotal = cartItems.reduce((sum, item) => {
    const days = calculateRentalDays(item);
    return sum + item.basePrice * item.quantity * days;
  }, 0);

  const taxAmount = rentalTotal * TAX_RATE;
  const depositTotal = cartItems.reduce(
    (sum, item) => sum + item.depositAmount * item.quantity,
    0
  );
  const grandTotal = rentalTotal + taxAmount + depositTotal;

  const handleSubmit = async () => {
    if (
      !shipping.fullName ||
      !shipping.street ||
      !shipping.province ||
      !shipping.phone
    ) {
      alert("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    setIsSubmitting(true);
    try {
      console.log(
        "CHECKOUT SUBMIT - cartItems:",
        cartItems.map((item) => ({
          itemId: item.itemId,
          title: item.title,
          quantity: item.quantity,
          rentalStartDate: item.rentalStartDate,
          rentalEndDate: item.rentalEndDate,
          priceUnit: item.priceUnit,
        }))
      );
      const results = await Promise.all(
        cartItems.map((item) =>
          dispatch(
            createOrderAction({
              itemId: item.itemId,
              quantity: item.quantity,
              startAt: item.rentalStartDate,
              endAt: item.rentalEndDate,
              shippingAddress: shipping,
              paymentMethod: "Wallet",
              note,
            })
          )
        )
      );
      if (results.some((r: any) => !r.success)) {
        alert("Có lỗi khi tạo đơn hàng");
        return;
      }
      await Promise.all(
        cartItems
          .filter((item) => !item._id?.startsWith("temp-")) 
          .map((item) => dispatch(removeItemFromCartAction(item._id)))
      );

      alert("Thuê thành công!");
      sessionStorage.removeItem("checkoutItems");
      router.push("/auth/order");
    } catch {
      alert("Lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Truck className="w-9 h-9 text-emerald-600" />
            Xác nhận thuê đồ
          </h1>
          <p className="text-gray-600 mt-2">Kiểm tra kỹ trước khi thanh toán</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cột trái */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sản phẩm */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Sản phẩm thuê ({cartItems.length})
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const days = calculateRentalDays(item);
                  const durationText = getRentalDurationText(
                    days,
                    item.priceUnit
                  );
                  const itemTotal = item.basePrice * item.quantity * days;
                  const itemDeposit = item.depositAmount * item.quantity;

                  return (
                    <div
                      key={item._id}
                      className="flex gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                    >
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 flex-shrink-0 overflow-hidden">
                        {item.primaryImage ? (
                          <img
                            src={item.primaryImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {item.shortDescription}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                            {item.quantity} cái
                          </span>
                          <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                            {durationText}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {editingDates[item._id] ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                <input
                                  type="datetime-local"
                                  value={editingDates[item._id].start}
                                  onChange={(e) =>
                                    setEditingDates((prev) => ({
                                      ...prev,
                                      [item._id]: {
                                        ...prev[item._id],
                                        start: e.target.value,
                                      },
                                    }))
                                  }
                                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                                />
                                →
                                <input
                                  type="datetime-local"
                                  value={editingDates[item._id].end}
                                  onChange={(e) =>
                                    setEditingDates((prev) => ({
                                      ...prev,
                                      [item._id]: {
                                        ...prev[item._id],
                                        end: e.target.value,
                                      },
                                    }))
                                  }
                                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                                />
                              </div>
                              <div className="flex gap-2 ml-6">
                                <button
                                  onClick={() => saveEditing(item._id)}
                                  className="bg-emerald-600 text-white text-xs px-3 py-1 rounded hover:bg-emerald-700"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingDates((prev) => {
                                      const newState = { ...prev };
                                      delete newState[item._id];
                                      return newState;
                                    })
                                  }
                                  className="text-gray-500 text-xs hover:underline"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              {format(
                                new Date(item.rentalStartDate!),
                                "dd/MM"
                              )}{" "}
                              →{" "}
                              {format(
                                new Date(item.rentalEndDate!),
                                "dd/MM/yyyy"
                              )}
                              <button
                                onClick={() =>
                                  startEditing(
                                    item._id,
                                    item.rentalStartDate,
                                    item.rentalEndDate
                                  )
                                }
                                className="text-emerald-600 text-xs ml-2 hover:underline"
                              >
                                Chỉnh sửa
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-end pt-3 border-t border-gray-200">
                          <div>
                            <p className="text-lg font-bold text-emerald-600">
                              {itemTotal.toLocaleString("vi-VN")}₫
                            </p>
                            <p className="text-xs text-amber-600">
                              Cọc: {itemDeposit.toLocaleString("vi-VN")}₫
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div>
                              {item.basePrice.toLocaleString("vi-VN")}₫/
                              {item.priceUnit}
                            </div>
                            <div>
                              Cọc: {item.depositAmount.toLocaleString("vi-VN")}
                              ₫/cái
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-red-600" />
                Địa chỉ nhận hàng
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  placeholder="Họ và tên *"
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={shipping.fullName}
                  onChange={(e) =>
                    setShipping({ ...shipping, fullName: e.target.value })
                  }
                />
                <input
                  placeholder="Số điện thoại *"
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={shipping.phone}
                  onChange={(e) =>
                    setShipping({ ...shipping, phone: e.target.value })
                  }
                />
                <input
                  placeholder="Địa chỉ (số nhà, đường...) *"
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition sm:col-span-2"
                  value={shipping.street}
                  onChange={(e) =>
                    setShipping({ ...shipping, street: e.target.value })
                  }
                />
                <input
                  placeholder="Phường/Xã"
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={shipping.ward}
                  onChange={(e) =>
                    setShipping({ ...shipping, ward: e.target.value })
                  }
                />
                <input
                  placeholder="Tỉnh/Thành phố *"
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={shipping.province}
                  onChange={(e) =>
                    setShipping({ ...shipping, province: e.target.value })
                  }
                />
              </div>
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  placeholder="Ví dụ: Giao giờ hành chính..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
                <CreditCard className="w-7 h-7" />
                Thanh toán
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Tiền thuê</span>
                  <span>{rentalTotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-yellow-200">
                  <span>Phí dịch vụ (10%)</span>
                  <span>{taxAmount.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-amber-200">
                  <span>Tiền cọc</span>
                  <span>{depositTotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-yellow-200 text-xs">
                  <span>(Hoàn lại tiền cọc sau khi trả đồ)</span>
                </div>
                <div className="border-t border-emerald-400 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-2xl">
                      {grandTotal.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-6 w-full bg-white text-emerald-700 font-bold py-4 rounded-xl hover:bg-emerald-50 transition transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    {" "}
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>{" "}
                    Đang xử lý...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <CheckCircle2 className="w-6 h-6" /> Đặt thuê ngay{" "}
                  </>
                )}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-100">
                <AlertCircle className="w-4 h-4" />
                <span>Thanh toán an toàn qua Ví điện tử</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
