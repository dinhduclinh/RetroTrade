// pages/order/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getOrderDetails, Order } from "@/services/auth/order.api";

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
   if (!id) return;

   const fetchOrder = async () => {
     try {
       const res = await getOrderDetails(id as string);
       if (res.code === 200 && res.data) {
         setOrder(res.data); // res.data chắc chắn không undefined
       } else {
         setError(res.message || "Không tìm thấy đơn hàng");
         setOrder(null); // gán null nếu không có dữ liệu
       }
     } catch (err: any) {
       setError(err.message || "Lỗi khi tải dữ liệu đơn hàng");
       setOrder(null);
     } finally {
       setLoading(false);
     }
   };

   fetchOrder();
 }, [id]);


  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  if (!order) return <p>Không tìm thấy đơn hàng</p>;

  return (
    <div className="p-4 max-w-lg mx-auto border rounded space-y-3">
      <h2 className="font-bold text-xl">Chi tiết đơn hàng</h2>
      <p>
        <strong>Mã đơn hàng:</strong> {order.orderGuid}
      </p>
      <p>
        <strong>Trạng thái:</strong> {order.orderStatus} / {order.paymentStatus}
      </p>
      <p>
        <strong>Người thuê:</strong> {order.renterId._id}
      </p>
      <p>
        <strong>Người cho thuê:</strong> {order.ownerId._id}
      </p>

      <div>
        <h3 className="font-semibold">Sản phẩm:</h3>
        <p>{order.itemSnapshot.title}</p>
        <p>Số lượng: {order.unitCount}</p>
        <p>
          Thời gian thuê: {new Date(order.startAt).toLocaleDateString()} -{" "}
          {new Date(order.endAt).toLocaleDateString()}
        </p>
        <p>
          Tổng tiền: {order.totalAmount.toLocaleString("vi-VN")}{" "}
          {order.currency}
        </p>
      </div>

      <div>
        <h3 className="font-semibold">Địa chỉ giao hàng:</h3>
        <p>{order.shippingAddress.fullName}</p>
        <p>{order.shippingAddress.street}</p>
        <p>
          {order.shippingAddress.ward}, {order.shippingAddress.province}
        </p>
        <p>SĐT: {order.shippingAddress.phone}</p>
      </div>
    </div>
  );
}
