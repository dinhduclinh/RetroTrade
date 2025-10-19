"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/router";
import {
  getPublicItemById,
} from "@/services/products/product.api";
import { Calendar, ChevronLeft, ChevronRight, Star, ShoppingCart, Zap, Bookmark } from "lucide-react";

interface ProductDetailDto {
  _id: string;
  Title: string;
  ShortDescription?: string;
  Description?: string;
  BasePrice: number;
  Currency: string;
  DepositAmount: number;
  PriceUnit?: { UnitName: string } | null;
  Condition?: { ConditionName: string } | null;
  Category?: { _id: string; name: string } | null;
  Images?: { Url: string }[];
  Owner?: { DisplayName?: string; FullName?: string; AvatarUrl?: string } | null;
  City?: string;
  District?: string;
  AvailableQuantity?: number;
  Quantity?: number;
  CreatedAt?: string;
}

const formatPrice = (price: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"hour" | "day" | "week" | "month">("day");
  const [durationUnits, setDurationUnits] = useState<string>(""); // number as string for input control
  const [dateError, setDateError] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPublicItemById(id);
        // BE returns { success, message, data }
        const data = res?.data ?? res; // fallback if instance returns json body directly
        const detail: ProductDetailDto = data?.data || data;
        setProduct(detail);
        setSelectedImageIndex(0);
      } catch (e: any) {
        console.error("Failed to load product detail", e);
        setError("Không thể tải chi tiết sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const images = useMemo(() => product?.Images?.map((i) => i.Url).filter(Boolean) || [], [product]);

  const outOfStock = useMemo(() => (product?.AvailableQuantity ?? 0) <= 0, [product]);

  // Legacy simple multiples (will be replaced by unit-aware prices below)
  const weeklyPriceLegacy = useMemo(() => (product ? product.BasePrice * 7 : 0), [product]);
  const monthlyPriceLegacy = useMemo(() => (product ? product.BasePrice * 30 : 0), [product]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Normalize unit from backend to one of: 'hour' | 'day' | 'week' | 'month'
  const baseUnit = useMemo(() => {
    const raw = product?.PriceUnit?.UnitName?.toString().toLowerCase() || "day";
    if (raw.includes("giờ") || raw.includes("hour")) return "hour" as const;
    if (raw.includes("tuần") || raw.includes("week")) return "week" as const;
    if (raw.includes("tháng") || raw.includes("month")) return "month" as const;
    return "day" as const;
  }, [product]);

  // Available plans depending on product unit
  const availablePlans = useMemo<("hour"|"day"|"week"|"month")[]>(() => {
    if (baseUnit === "hour") return ["hour", "day", "week", "month"];
    if (baseUnit === "week") return ["week", "month"];
    if (baseUnit === "month") return ["month"]; // fallback if month-only products exist
    return ["day", "week", "month"];
  }, [baseUnit]);

  // Default selected plan to base unit when product changes
  useEffect(() => {
    setSelectedPlan(baseUnit);
  }, [baseUnit]);

  const unitsFromDates = useMemo(() => {
    if (!dateFrom || !dateTo) return 0;
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const today = new Date(todayStr);
    // clear time
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    if (start < today || end < today) {
      return 0;
    }
    if (end < start) {
      return 0;
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1);
    if (selectedPlan === "hour") return days * 24;
    if (selectedPlan === "day") return days;
    if (selectedPlan === "week") return Math.ceil(days / 7);
    return Math.ceil(days / 30);
  }, [dateFrom, dateTo, selectedPlan, todayStr]);

  // Derive price per unit based on the base unit from backend
  const hourUnitPrice = useMemo(() => {
    if (!product) return 0;
    if (baseUnit === "hour") return product.BasePrice;
    if (baseUnit === "day") return product.BasePrice / 24;
    if (baseUnit === "week") return product.BasePrice / (7 * 24);
    return product.BasePrice / (30 * 24); // month -> per-hour approx
  }, [product, baseUnit]);

  const dayUnitPrice = useMemo(() => {
    if (!product) return 0;
    if (baseUnit === "day") return product.BasePrice;
    if (baseUnit === "hour") return hourUnitPrice * 24;
    if (baseUnit === "week") return product.BasePrice / 7; // approximate per-day from per-week
    return product.BasePrice / 30; // base month -> per-day approx
  }, [product, baseUnit, hourUnitPrice]);

  const weekUnitPrice = useMemo(() => {
    if (!product) return 0;
    if (baseUnit === "week") return product.BasePrice;
    if (baseUnit === "hour") return hourUnitPrice * 24 * 7;
    if (baseUnit === "day") return product.BasePrice * 7;
    return product.BasePrice / 4; // base month -> per-week approx (4 weeks)
  }, [product, baseUnit, hourUnitPrice]);

  const monthUnitPrice = useMemo(() => {
    if (!product) return 0;
    if (baseUnit === "month") return product.BasePrice;
    if (baseUnit === "hour") return hourUnitPrice * 24 * 30;
    if (baseUnit === "day") return product.BasePrice * 30;
    return product.BasePrice * 4; // week -> month approx
  }, [product, baseUnit, hourUnitPrice]);

  const pricePerUnit = useMemo(() => {
    if (selectedPlan === "hour") return hourUnitPrice;
    if (selectedPlan === "day") return dayUnitPrice;
    if (selectedPlan === "week") return weekUnitPrice;
    return monthUnitPrice;
  }, [selectedPlan, hourUnitPrice, dayUnitPrice, weekUnitPrice, monthUnitPrice]);

  const totalUnits = useMemo(() => {
    const manual = Number(durationUnits);
    return Number.isFinite(manual) && manual > 0 ? manual : unitsFromDates;
  }, [durationUnits, unitsFromDates]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    return (pricePerUnit || 0) * (totalUnits || 0);
  }, [pricePerUnit, totalUnits, product]);

  const handlePrev = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleAddToCart = () => {
    // TODO: integrate cart
    if (product) {
      if ((product.AvailableQuantity ?? 0) <= 0) {
        toast.error("Sản phẩm không có sẵn để thêm vào giỏ hàng");
        return;
      }
      console.log("Add to cart", product.Title);
      toast.success("Đã thêm vào giỏ");
    }
  };

  const handleRentNow = () => {
    // TODO: navigate to checkout or open rent modal
    if (product && totalUnits > 0 && !dateError) {
      console.log("Rent now", product._id, dateFrom, dateTo);
      toast.info("Thuê ngay");
    }
  };

  // Validate dates on change
  useEffect(() => {
    const today = new Date(todayStr);
    const start = dateFrom ? new Date(dateFrom) : null;
    const end = dateTo ? new Date(dateTo) : null;
    let err = "";
    if (start && start < today) err = "Không thể chọn ngày trong quá khứ";
    if (!err && end && end < today) err = "Không thể chọn ngày trong quá khứ";
    if (!err && start && end && end < start) err = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
    setDateError(err);
  }, [dateFrom, dateTo, todayStr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải chi tiết...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Không tìm thấy sản phẩm"}</p>
          <button onClick={() => router.push("/products")} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <span className="hover:underline cursor-pointer" onClick={() => router.push("/")}>Home</span>
          <span className="mx-2">/</span>
          <span className="hover:underline cursor-pointer" onClick={() => router.push("/products")}>Product</span>
          {product.Category?.name && (
            <>
              <span className="mx-2">/</span>
              <span className="text-gray-600">{product.Category?.name}</span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.Title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <section>
            <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
              {images.length > 0 ? (
                <img src={images[selectedImageIndex]} alt={product.Title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow">
                    <ChevronLeft />
                  </button>
                  <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow">
                    <ChevronRight />
                  </button>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border ${idx === selectedImageIndex ? "border-blue-600" : "border-gray-200"}`}
                  >
                    <img src={src} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Summary / Actions */}
          <section>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{product.Title}</h1>
              <button className="text-gray-600 hover:text-blue-600" title="Yêu thích">
                <Bookmark className="w-7 h-7" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm mt-2">
              <div className="flex items-center text-yellow-500"><Star className="w-4 h-4 fill-yellow-500" /><Star className="w-4 h-4 fill-yellow-500" /><Star className="w-4 h-4 fill-yellow-500" /><Star className="w-4 h-4 fill-yellow-500" /><Star className="w-4 h-4" /></div>
              <span className="text-gray-500">(24 đánh giá)</span>
            </div>

            <div className="mt-3">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                <span>Đặt cọc:</span>
                <span>{formatPrice(product.DepositAmount, product.Currency)}</span>
              </div>
            </div>

            {/* Pricing plans (selectable) */}
            <div className={`grid gap-3 mt-4 ${availablePlans.length === 4 ? 'grid-cols-4' : availablePlans.length === 3 ? 'grid-cols-3' : availablePlans.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {availablePlans.map((plan) => {
                const active = selectedPlan === plan;
                const price = plan === 'hour' ? hourUnitPrice : plan === 'day' ? dayUnitPrice : plan === 'week' ? weekUnitPrice : monthUnitPrice;
                const label = plan === 'hour' ? 'mỗi giờ' : plan === 'day' ? 'mỗi ngày' : plan === 'week' ? 'mỗi tuần' : 'mỗi tháng';
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`border rounded-xl p-3 text-center transition-colors ${active ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className={`text-lg ${active ? 'font-bold' : 'font-semibold'}`}>{formatPrice(price, product.Currency)}</div>
                    <div className="text-xs">{label}</div>
                  </button>
                );
              })}
            </div>

            {/* Dates */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Từ ngày</label>
                <div className="relative">
                  <input type="date" min={todayStr} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border rounded-lg p-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Đến ngày</label>
                <div className="relative">
                  <input type="date" min={todayStr} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border rounded-lg p-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              {dateError && <p className="text-sm text-red-500">{dateError}</p>}
              <div>
                <label className="text-sm text-gray-600 block mb-1">Số {selectedPlan === 'hour' ? 'giờ' : selectedPlan === 'day' ? 'ngày' : selectedPlan === 'week' ? 'tuần' : 'tháng'} (tùy chọn)</label>
                <input
                  type="number"
                  min={1}
                  placeholder={unitsFromDates ? unitsFromDates.toString() : '1'}
                  value={durationUnits}
                  onChange={(e) => setDurationUnits(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <p className="mt-2 text-sm text-gray-700">
                  Tổng tiền: <span className="font-semibold text-blue-600">{formatPrice(totalPrice, product.Currency)}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-3">
              <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">
                So sánh sản phẩm tương tự
              </button>
              {outOfStock ? (
                <button disabled className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 text-white cursor-not-allowed`}>
                  Hết hàng
                </button>
              ) : (
                <button disabled={totalUnits <= 0 || !!dateError} onClick={handleRentNow} className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${totalUnits <= 0 || !!dateError ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  <Zap className="w-5 h-5" /> Thuê ngay
                </button>
              )}
              <button onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200">
                <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ
              </button>
            </div>

            {/* Owner card */}
            <div className="mt-6 bg-white border rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">Thông tin chủ sở hữu</h3>
                <button className="text-sm text-blue-600 hover:underline">Liên hệ với chủ sở hữu</button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  {product.Owner?.AvatarUrl ? (
                    <img src={product.Owner.AvatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{product.Owner?.DisplayName || product.Owner?.FullName || "Người dùng"}</div>
                  <div className="text-xs text-gray-500">Xác minh • Thường trả lời trong vòng 2 giờ</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Description + Specs */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-3">Miêu tả Sản phẩm</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.Description || product.ShortDescription || "Chưa có mô tả."}
            </p>
          </section>

          <aside>
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Thông tin sản phẩm</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between"><span>Tình trạng:</span><span className="font-medium">{product.Condition?.ConditionName || "-"}</span></div>
                <div className="flex justify-between"><span>Khu vực:</span><span className="font-medium">{product.District || ""}{product.City ? `, ${product.City}` : ""}</span></div>
                <div className="flex justify-between"><span>Kho (sản phẩm):</span><span className="font-medium">{typeof product.Quantity === 'number' ? product.Quantity : '-'}</span></div>
                <div className="flex justify-between"><span>Có sẵn (sản phẩm):</span><span className="font-medium">{typeof product.AvailableQuantity === 'number' ? product.AvailableQuantity : '-'}</span></div>
                <div className="flex justify-between">
                  <span>Ngày đăng:</span>
                  <span className="font-medium">{product.CreatedAt ? new Date(product.CreatedAt).toLocaleDateString("vi-VN") : '-'}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
