"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  getRatingsByItem,
  createRating,
} from "@/services/products/product.api";
import { Star } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import {jwtDecode} from "jwt-decode";
import { toast } from "sonner";

interface Rating {
  _id: string;
  orderId: string;
  itemId: string;
  renterId: { _id: string; fullName: string; avatarUrl?: string };
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

interface Order {
  _id: string;
  itemId: string;
  renterId: { _id: string; fullName: string };
  orderStatus: string;
}

interface Props {
  itemId: string;
  orders: Order[];
}

interface JwtPayload {
  _id: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  role?: string;
  exp: number;
  iat: number;
}

const RatingSection: React.FC<Props> = ({ itemId, orders }) => {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<Rating[]>([]);
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (accessToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(accessToken);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, [accessToken]);

  // Lấy đánh giá
  const fetchRatings = async () => {
    try {
      const res = await getRatingsByItem(itemId);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRatings(data);
      setFilteredRatings(data);
    } catch (err) {
      console.error("Lỗi lấy đánh giá:", err);
      setRatings([]);
      setFilteredRatings([]);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [itemId]);

  // Kiểm tra user có thể đánh giá
const canReview = useMemo(() => {
  if (!currentUser) return false;

  const eligibleOrder = orders.find(
    (order) =>
      order.itemId === itemId &&
      order.orderStatus.toLowerCase() === "completed" && 
      order.renterId._id.toString() === currentUser._id.toString()
  );

  if (!eligibleOrder) return false;

  const hasRated = ratings.some(
    (r) =>
      r.itemId === itemId &&
      r.renterId._id.toString() === currentUser._id.toString()
  );

  return !hasRated;
}, [orders, ratings, itemId, currentUser]);


  const reviewableOrderId = useMemo(() => {
    if (!currentUser) return null;
    const order = orders.find(
      (o) =>
        o.itemId === itemId &&
        o.orderStatus === "completed" &&
        o.renterId._id === currentUser._id
    );
    return order?._id || null;
  }, [orders, itemId, currentUser]);


  const handleFilter = (star: number | null) => {
    setFilterStar(star);
    if (star === null) {
      setFilteredRatings(ratings);
    } else {
      setFilteredRatings(ratings.filter((r) => r.rating === star));
    }
  };

  // Gửi đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReview || !reviewableOrderId) {
    toast.error("Bạn không đủ điều kiện để đánh giá sản phẩm này.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("orderId", reviewableOrderId);
      formData.append("itemId", itemId);
      formData.append("renterId", currentUser!._id);
      formData.append("rating", rating.toString());
      formData.append("comment", comment);
     if (images) {
       Array.from(images)
         .slice(0, 5)
         .forEach((file) => formData.append("images", file));
     }

      const res = await createRating(formData);
      const message = res?.data?.message || "Đánh giá thành công!";
       toast.success(message); 

      // Refresh đánh giá
      await fetchRatings();

      // Reset form
      setComment("");
      setImages(null);
      setRating(5);
    } catch (err: any) {
      console.error("Lỗi gửi đánh giá:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi khi gửi đánh giá"
      );
    } finally {
      setLoading(false);
    }
  };

  // Trung bình sao
  const averageRating =
    ratings.length > 0
      ? (
          ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        ).toFixed(1)
      : "0.0";

  const countByStar = [5, 4, 3, 2, 1].map(
    (star) => ratings.filter((r) => r.rating === star).length
  );

  return (
    <div className="mt-6 border-t pt-4">
      <h2 className="text-xl font-semibold mb-4">Đánh giá sản phẩm</h2>

      {/* Thống kê tổng */}
      <div className="bg-white border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-4xl font-bold text-yellow-500">{averageRating}</p>
          <div className="flex justify-center md:justify-start mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                className={
                  i < Math.round(Number(averageRating))
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {ratings.length} lượt đánh giá
          </p>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-3 md:mt-0">
          <button
            onClick={() => handleFilter(null)}
            className={`px-3 py-1 border rounded-md text-sm ${
              filterStar === null ? "bg-green-600 text-white" : ""
            }`}
          >
            Tất cả ({ratings.length})
          </button>
          {[5, 4, 3, 2, 1].map((star, i) => (
            <button
              key={i}
              onClick={() => handleFilter(star)}
              className={`px-3 py-1 border rounded-md text-sm flex items-center gap-1 ${
                filterStar === star ? "bg-yellow-500 text-white" : ""
              }`}
            >
              {star}{" "}
              <Star size={14} className="text-yellow-400 fill-yellow-400" /> (
              {countByStar[i]})
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách đánh giá */}
      {filteredRatings.length === 0 ? (
        <p className="text-gray-500">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {filteredRatings.map((r) => (
            <div
              key={r._id}
              className="border rounded-lg p-3 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <img
                  src={r.renterId?.avatarUrl || "/user.png"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-medium">{r.renterId?.fullName}</span>
              </div>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < r.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <p className="text-gray-700 mt-2">{r.comment}</p>
              {r.images && r.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
              <small className="text-gray-400 block mt-1">
                {new Date(r.createdAt).toLocaleString("vi-VN")}
              </small>
            </div>
          ))}
        </div>
      )}

      {/* Form đánh giá */}
      {canReview && currentUser && (
        <form onSubmit={handleSubmit} className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2">Viết đánh giá của bạn</h3>
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                onClick={() => setRating(i + 1)}
                className={`cursor-pointer ${
                  i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <textarea
            className="w-full border rounded-md p-2 focus:outline-none"
            rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <input
            type="file"
            multiple
            accept="image/*"
            className="mt-2 block"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 5) {
                toast.error("Bạn chỉ có thể đăng tối đa 5 ảnh.");
                e.target.value = ""; 
                setImages(null);
              } else {
                setImages(e.target.files);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      )}

      {!canReview && currentUser && (
        <p className="mt-4 text-sm text-gray-500">
          Bạn chỉ có thể đánh giá sản phẩm sau khi hoàn thành đơn hàng và chưa
          từng đánh giá trước đó.
        </p>
      )}
    </div>
  );
};

export default RatingSection;
