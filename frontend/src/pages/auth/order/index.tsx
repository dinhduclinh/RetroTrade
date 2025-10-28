import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { createOrderAction } from "@/store/order/orderActions";
import type { CartItem } from "@/services/auth/cartItem.api";
import { removeItemFromCartAction } from "@/store/cart/cartActions";
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

  // Lấy cartItems từ sessionStorage
  useEffect(() => {
    const itemsStr = sessionStorage.getItem("checkoutItems");
    if (!itemsStr) {
      router.push("/cart"); 
      return;
    }

    const items: CartItem[] = JSON.parse(itemsStr);

    // Kiểm tra rentalStartDate / rentalEndDate
    const invalidItem = items.find(
      (item) => !item.rentalStartDate || !item.rentalEndDate
    );
    if (invalidItem) {
      alert(
        `Sản phẩm "${invalidItem.title}" chưa có ngày thuê hợp lệ. Vui lòng chỉnh sửa trong giỏ hàng.`
      );
      router.push("/cart");
      return;
    }
    console.log("Cart items for checkout:", items); 
    setCartItems(items);
  }, []);

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

    

    const payload = {
      itemId: cartItems[0].itemId, 
      unitCount: cartItems[0].quantity,
      startAt: cartItems[0].rentalStartDate,
      endAt: cartItems[0].rentalEndDate,
      shippingAddress: shipping,
      paymentMethod: "Wallet",
      note,
    };

    console.log("Order payload:", payload);
    const res = await dispatch(createOrderAction(payload));
    if (res.success) {
      alert("Tạo đơn thành công!");
     await dispatch(removeItemFromCartAction(cartItems[0]._id));
    router.push(`/auth/order/${res.data.orderId}`);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="p-4 space-y-4 border rounded max-w-lg mx-auto">
      <h2 className="font-bold text-xl">Xác nhận thuê</h2>

      {/* Thông tin địa chỉ */}
      <div className="space-y-2">
        <label>Địa chỉ nhận hàng:</label>
        <input
          placeholder="Họ tên"
          value={shipping.fullName}
          onChange={(e) =>
            setShipping({ ...shipping, fullName: e.target.value })
          }
        />
        <input
          placeholder="Địa chỉ (số nhà, đường...)"
          value={shipping.street}
          onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
        />
        <input
          placeholder="Phường"
          value={shipping.ward}
          onChange={(e) => setShipping({ ...shipping, ward: e.target.value })}
        />
        <input
          placeholder="Tỉnh / Thành phố"
          value={shipping.province}
          onChange={(e) =>
            setShipping({ ...shipping, province: e.target.value })
          }
        />
        <input
          placeholder="Số điện thoại"
          value={shipping.phone}
          onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
        />
      </div>

      {/* Ghi chú */}
      <div>
        <label>Ghi chú:</label>
        <textarea
          placeholder="Ví dụ: Giao giờ hành chính"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Button */}
      <button
        className="bg-green-600 text-white py-2 px-4 rounded w-full"
        onClick={handleSubmit}
      >
        Đặt hàng ngay
      </button>
    </div>
  );
}
