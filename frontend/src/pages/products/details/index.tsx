"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import AddToCartButton from "@/components/ui/common/AddToCartButton";
import {
  getPublicItemById,
  getTopViewedItemsByOwner,
  getProductsByCategoryId,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
} from "@/services/products/product.api";
import { createConversation, getConversations, Conversation } from "@/services/messages/messages.api";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Bookmark,
  Zap,
  CheckCircle,
  Leaf,
  MapPin,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Truck,
} from "lucide-react";

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
  Owner?: {
    _id?: string;
    userGuid?: string;
    DisplayName?: string;
    FullName?: string;
    AvatarUrl?: string;
  } | null;
  City?: string;
  District?: string;
  AvailableQuantity?: number;
  Quantity?: number;
  CreatedAt?: string;
}

type FavoriteProductRef =
  | string
  | {
      _id?: string;
      id?: string;
    };

interface FavoriteEntry {
  _id?: string;
  productId?: FavoriteProductRef;
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
  const [selectedPlan, setSelectedPlan] = useState<
    "hour" | "day" | "week" | "month"
  >("day");
  const [durationUnits, setDurationUnits] = useState<string>(""); // number as string for input control
  const [dateError, setDateError] = useState<string>("");
  const [ownerTopItems, setOwnerTopItems] = useState<any[]>([]);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
<<<<<<< HEAD
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
=======
>>>>>>> linhddhe173104

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const productId = product?._id;

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
      } catch (err: unknown) {
        console.error("Failed to load product detail", err);
        setError("Không thể tải chi tiết sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Fetch featured items from same owner
  useEffect(() => {
    const run = async () => {
      const ownerId = (product?.Owner as any)?._id;
      if (!ownerId) return;
      try {
        const res = await getTopViewedItemsByOwner(ownerId, 6);
        const data = res?.data ?? res;
        const items = data?.data?.items || data?.items || [];
        const filtered = (items || [])
          .filter((it: any) => it?._id !== product?._id)
          .slice(0, 5);
        setOwnerTopItems(filtered);
      } catch (e) {
        console.warn("Failed to load owner's featured items", e);
      }
    };
    run();
  }, [product?.Owner]);

  // Fetch similar items by same category
  useEffect(() => {
    const run = async () => {
      const catId = (product?.Category as any)?._id;
      if (!catId) return;
      try {
        const res = await getProductsByCategoryId(catId, {
          page: 1,
          limit: 12,
        });
        const data = res?.data ?? res;
        const items = data?.data?.items || data?.items || [];
        const filtered = (items || [])
          .filter((it: any) => it?._id !== product?._id)
          .slice(0, 8);
        setSimilarItems(filtered);
      } catch (e) {
        console.warn("Failed to load similar items", e);
        setSimilarItems([]);
      }
    };
    run();
  }, [product?.Category]);

  const images = useMemo(
    () => product?.Images?.map((i) => i.Url).filter(Boolean) || [],
    [product]
  );

  const outOfStock = useMemo(
    () => (product?.AvailableQuantity ?? 0) <= 0,
    [product]
  );

  // Legacy simple multiples (will be replaced by unit-aware prices below)
  // const weeklyPriceLegacy = useMemo(
  //   () => (product ? product.BasePrice * 7 : 0),
  //   [product]
  // );
  // const monthlyPriceLegacy = useMemo(
  //   () => (product ? product.BasePrice * 30 : 0),
  //   [product]
  // );

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Normalize unit from backend to one of: 'hour' | 'day' | 'week' | 'month'
  const baseUnit = useMemo(() => {
    const raw = product?.PriceUnit?.UnitName?.toString().toLowerCase() || "day";
    if (raw.includes("giờ") || raw.includes("hour")) return "hour" as const;
    if (raw.includes("tuần") || raw.includes("week")) return "week" as const;
    if (raw.includes("tháng") || raw.includes("month")) return "month" as const;
    return "day" as const;
  }, [product]);

  // Available plans depending on product unit
  const availablePlans = useMemo<("hour" | "day" | "week" | "month")[]>(() => {
    if (baseUnit === "hour") return ["hour", "day", "week", "month"];
    if (baseUnit === "week") return ["week", "month"];
    if (baseUnit === "month") return ["month"]; // fallback if month-only products exist
    return ["day", "week", "month"];
  }, [baseUnit]);

  // Initialize default dates: from today to tomorrow
  useEffect(() => {
    setDateFrom((prev) => prev || todayStr);
    setDateTo((prev) => prev || tomorrowStr);
  }, [todayStr, tomorrowStr]);

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
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (start < today || end < today) {
      return 0;
    }
    if (end < start) {
      return 0;
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1
    );
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
  }, [
    selectedPlan,
    hourUnitPrice,
    dayUnitPrice,
    weekUnitPrice,
    monthUnitPrice,
  ]);

  const baseUnitPrice = useMemo(() => {
    if (baseUnit === "hour") return hourUnitPrice;
    if (baseUnit === "day") return dayUnitPrice;
    if (baseUnit === "week") return weekUnitPrice;
    return monthUnitPrice;
  }, [baseUnit, hourUnitPrice, dayUnitPrice, weekUnitPrice, monthUnitPrice]);

  const baseUnitLabel = useMemo(() => {
    return baseUnit === "hour"
      ? "mỗi giờ"
      : baseUnit === "day"
        ? "mỗi ngày"
        : baseUnit === "week"
          ? "mỗi tuần"
          : "mỗi tháng";
  }, [baseUnit]);

  const totalUnits = useMemo(() => {
    const manual = Number(durationUnits);
    return Number.isFinite(manual) && manual > 0 ? manual : unitsFromDates;
  }, [durationUnits, unitsFromDates]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const units = totalUnits || 0;
    const price = pricePerUnit || 0;
    return price * units;
  }, [pricePerUnit, totalUnits, product]);

  // Update total price display when dates or plan changes
  const displayTotalPrice = useMemo(() => {
    if (!product) return 0;

    // If dates are selected, calculate based on actual duration
    if (dateFrom && dateTo && !dateError) {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1);

      let calculatedUnits = 0;
      if (selectedPlan === "hour") calculatedUnits = days * 24;
      else if (selectedPlan === "day") calculatedUnits = days;
      else if (selectedPlan === "week") calculatedUnits = Math.ceil(days / 7);
      else calculatedUnits = Math.ceil(days / 30);

      return (pricePerUnit || 0) * calculatedUnits;
    }

    // If manual units are entered, use those
    if (durationUnits && Number(durationUnits) > 0) {
      return (pricePerUnit || 0) * Number(durationUnits);
    }

    return 0;
  }, [
    product,
    dateFrom,
    dateTo,
    dateError,
    selectedPlan,
    pricePerUnit,
    durationUnits,
  ]);

  const handlePrev = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleCompare = () => {
    toast.info("So sánh sản phẩm tương tự (đang phát triển)");
  };

  useEffect(() => {
    if (!product) {
      setIsFavorite(false);
      return;
    }
    if (!accessToken) {
      setIsFavorite(false);
    }
  }, [product, accessToken]);

  useEffect(() => {
    if (!productId || !accessToken) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    const fetchFavoriteStatus = async () => {
      try {
        const res = await getFavorites();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json().catch(() => null);
        const favorites =
          data?.data?.items || data?.data || data?.items || data || [];
        const favoritesArray = Array.isArray(favorites)
          ? (favorites as (FavoriteEntry | string)[])
          : [];
        const found = favoritesArray.some((favItem) => {
          if (typeof favItem === "string") {
            return favItem === productId;
          }
          const ref = favItem.productId;
          if (typeof ref === "string") {
            return ref === productId;
          }
          return (
            ref?._id === productId ||
            ref?.id === productId ||
            favItem._id === productId
          );
        });
        if (!cancelled) {
          setIsFavorite(found);
        }
      } catch (error) {
        console.warn("Failed to fetch favorite status", error);
      }
    };
    fetchFavoriteStatus();
    return () => {
      cancelled = true;
    };
  }, [productId, accessToken]);

  const handleToggleFavorite = async () => {
    if (!product) return;
    if (!accessToken) {
      toast.error("Vui lòng đăng nhập để thêm vào yêu thích.");
      router.push("/auth/login");
      return;
    }
    setFavoriteLoading(true);
    try {
      let res: Response;
      if (isFavorite) {
        res = await removeFromFavorites(product._id);
      } else {
        res = await addToFavorites(product._id);
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.message || `Lỗi! Mã trạng thái: ${res.status}`;
        if (res.status === 400) {
          if (!isFavorite && message.includes("đã được yêu thích")) {
            setIsFavorite(true);
            toast.success("Đã thêm vào yêu thích!");
            return;
          }
          if (isFavorite && message.includes("chưa được yêu thích")) {
            setIsFavorite(false);
            toast.success("Đã xóa khỏi yêu thích!");
            return;
          }
        }
        if (res.status === 401 || res.status === 403) {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          router.push("/auth/login");
          return;
        }
        throw new Error(message);
      }
      if (isFavorite) {
        setIsFavorite(false);
        toast.success("Đã xóa khỏi yêu thích!");
      } else {
        setIsFavorite(true);
        toast.success("Đã thêm vào yêu thích!");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Lỗi khi cập nhật yêu thích.";
      toast.error(message);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRentNow = () => {
    if (!product) return;

    if (!dateFrom || !dateTo) {
      toast.error("Vui lòng chọn thời gian thuê");
      return;
    }

    if (dateError) {
      toast.error(dateError);
      return;
    }

    const checkoutItem = {
      _id: "temp-" + product._id,
      itemId: product._id,
      title: product.Title,
      basePrice: product.BasePrice,
      depositAmount: product.DepositAmount || 0,
      quantity: 1,
      priceUnit: product.PriceUnit?.UnitName || "ngày",
      rentalStartDate: dateFrom,
      rentalEndDate: dateTo,
      primaryImage: product.Images?.[0]?.Url || "",
      shortDescription: product.ShortDescription || "",
    };

    sessionStorage.setItem("checkoutItems", JSON.stringify([checkoutItem]));

    toast.success("Đang chuyển đến trang thanh toán...");
    router.push("/auth/order");
  };


  useEffect(() => {
    const today = new Date(todayStr);
    const start = dateFrom ? new Date(dateFrom) : null;
    const end = dateTo ? new Date(dateTo) : null;
    let err = "";
    if (start && start < today) err = "Không thể chọn ngày trong quá khứ";
    if (!err && end && end < today) err = "Không thể chọn ngày trong quá khứ";
    if (!err && start && end && end < start)
      err = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
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
          <p className="text-red-500 mb-4">
            {error || "Không tìm thấy sản phẩm"}
          </p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <span
            className="hover:underline cursor-pointer"
            onClick={() => router.push("/")}
          >
            Home
          </span>
          <span className="mx-2">/</span>
          <span
            className="hover:underline cursor-pointer"
            onClick={() => router.push("/products")}
          >
            Product
          </span>
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
                <img
                  src={images[selectedImageIndex]}
                  alt={product.Title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                  >
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
                    className={`aspect-square rounded-lg overflow-hidden border ${idx === selectedImageIndex
                        ? "border-blue-600"
                        : "border-gray-200"
                      }`}
                  >
                    <img
                      src={src}
                      alt={`thumb-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Summary */}
          <section>
            <div className="space-y-5 md:space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {product.Title}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`inline-flex items-center justify-center rounded-full border p-2 transition-colors ${
                    isFavorite
                      ? "border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  } ${favoriteLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                  aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                  <Bookmark
                    className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {product.ShortDescription && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.ShortDescription}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm mt-2">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-gray-500">(24 đánh giá)</span>
              </div>

              <div className="rounded-2xl border bg-blue-50/60 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Giá thuê</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <div className="text-3xl font-extrabold text-blue-600">
                        {formatPrice(baseUnitPrice, product.Currency)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {baseUnitLabel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Đặt cọc</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">
                      {formatPrice(product.DepositAmount, product.Currency)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCompare}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                >
                  So sánh sản phẩm
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="w-full">
                    <AddToCartButton
                      itemId={product._id}
                      availableQuantity={product.AvailableQuantity ?? 0}
                      size="md"
                      variant="outline"
                      showText
                      className="w-full py-3"
                    />
                  </div>
                  <button
                    onClick={handleRentNow}
                    disabled={outOfStock}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${outOfStock
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    <Zap className="w-5 h-5" /> Thuê ngay
                  </button>
                </div>

                <div className="rounded-xl bg-white p-4 space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">RetroTrade</span> cam kết: nhận sản phẩm đúng mô tả hoặc hoàn tiền. Thông tin thanh toán của bạn được bảo mật tuyệt đối.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                    <Leaf className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">
                        RetroTrade
                      </span>{" "}
                      - Nền tảng cho thuê đồ vì một trái đất xanh hơn!
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </section>
        </div>

        {/* Seller info section (based on provided design) */}
        <div className="mt-8">
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">Thông tin người bán</h3>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden">
                {product.Owner?.AvatarUrl ? (
                  <img
                    src={product.Owner.AvatarUrl}
                    alt={
                      product.Owner?.DisplayName ||
                      product.Owner?.FullName ||
                      "avatar"
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">
                      {product.Owner?.DisplayName ||
                        product.Owner?.FullName ||
                        "Người dùng"}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã xác minh
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    (0 đánh giá) • 0 sản phẩm • 0 đã bán
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={async () => {
                        const ownerId =
                          (product as any)?.Owner?._id ||
                          (product as any)?.Owner?.userGuid ||
                          (product as any)?.Owner?.UserGuid;
                        if (!ownerId) {
                          toast.error("Không tìm thấy thông tin người bán");
                          return;
                        }

                        if (!accessToken) {
                          toast.error(
                            "Vui lòng đăng nhập để sử dụng tính năng chat"
                          );
                          router.push("/auth/login");
                          return;
                        }

                        try {
                          // Load conversations first
                          const conversationsRes = await getConversations();
                          if (conversationsRes.ok) {
                            const conversationsData =
                              await conversationsRes.json();
                            const conversations = conversationsData.data || [];

                            // Find existing conversation with this owner
                            const existingConversation = conversations.find((conv: Conversation) => {
                              const userId1 = String(conv.userId1._id || conv.userId1);
                              const userId2 = String(conv.userId2._id || conv.userId2);
                              const ownerIdStr = String(ownerId);
                              return userId1 === ownerIdStr || userId2 === ownerIdStr;
                            });

                            if (existingConversation) {
                              // Navigate to messages page with conversation ID
                              router.push(
                                `/auth/messages?conversationId=${existingConversation._id}`
                              );
                            } else {
                              // Create new conversation
                              const createRes = await createConversation(
                                ownerId
                              );
                              if (createRes.ok) {
                                const createData = await createRes.json();
                                const newConversation =
                                  createData.data || createData;
                                // Navigate to messages page with new conversation ID
                                router.push(
                                  `/auth/messages?conversationId=${newConversation._id}`
                                );
                                toast.success("Đã tạo cuộc trò chuyện mới");
                              } else {
                                const errorData = await createRes.json();
                                toast.error(
                                  errorData.message ||
                                    "Không thể tạo cuộc trò chuyện"
                                );
                              }
                            }
                          } else {
                            toast.error(
                              "Không thể tải danh sách cuộc trò chuyện"
                            );
                          }
                        } catch (error) {
                          console.error("Error opening chat:", error);
                          toast.error("Có lỗi xảy ra khi mở chat");
                        }
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                    >
                      Chat ngay
                    </button>
                    <button
                      onClick={() => {
                        const ownerGuid =
                          product?.Owner?.userGuid || product?.Owner?._id;
                        if (ownerGuid) {
                          router.push(`/store/${ownerGuid}`);
                        } else {
                          toast.error("Không tìm thấy thông tin cửa hàng");
                        }
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border text-gray-700 hover:bg-gray-50"
                    >
                      Xem shop
                    </button>
                  </div>
                </div>
                <div className="md:col-span-7">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-sm">Đáng tin cậy</div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-sm">
                        Thành viên từ{" "}
                        {product.CreatedAt
                          ? new Date(product.CreatedAt).getFullYear()
                          : "-"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div className="text-sm">Phản hồi nhanh</div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="text-sm">Giao hàng nhanh</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 10-col grid: left 7 info+desc, right 3 featured */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-10 gap-8">
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Thông tin sản phẩm</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Tình trạng:</span>
                  <span className="font-medium">
                    {product.Condition?.ConditionName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Khu vực:</span>
                  <span className="font-medium">
                    {product.District || ""}
                    {product.City ? `, ${product.City}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kho (sản phẩm):</span>
                  <span className="font-medium">
                    {typeof product.Quantity === "number"
                      ? product.Quantity
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Có sẵn (sản phẩm):</span>
                  <span className="font-medium">
                    {typeof product.AvailableQuantity === "number"
                      ? product.AvailableQuantity
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ngày đăng:</span>
                  <span className="font-medium">
                    {product.CreatedAt
                      ? new Date(product.CreatedAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Mô tả sản phẩm</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.Description ||
                  product.ShortDescription ||
                  "Chưa có mô tả."}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Sản phẩm tương tự</h3>
              {similarItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarItems.map((it: any) => {
                    const thumb = it?.Images?.[0]?.Url;
                    const href = `/products/details?id=${it._id}`;
                    return (
                      <Link key={it._id} href={href} className="block">
                        <div className="rounded-xl border bg-white overflow-hidden cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
                          <div className="w-full aspect-video bg-gray-100">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={it.Title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {it.Title}
                            </div>
                            <div className="text-orange-600 font-semibold mt-1">
                              {formatPrice(it.BasePrice, it.Currency)}
                            </div>
                            {(it.City || it.District) && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>
                                  {it.District || ""}
                                  {it.City
                                    ? `${it.District ? ", " : ""}${it.City}`
                                    : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Chưa có sản phẩm tương tự
                </div>
              )}
            </div>
          </section>

          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Sản phẩm nổi bật</h3>
              <div className="space-y-4">
                {(ownerTopItems || []).map((it) => {
                  const thumb = it?.Images?.[0]?.Url;
                  const href = `/products/details?id=${it._id}`;
                  return (
                    <Link key={it._id} href={href} className="block">
                      <div className="rounded-xl border bg-white overflow-hidden cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
                        <div className="w-full aspect-video bg-gray-100">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={it.Title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {it.Title}
                          </div>
                          <div className="text-orange-600 font-semibold mt-1">
                            {formatPrice(it.BasePrice, it.Currency)}
                          </div>
                          {(it.City || it.District) && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>
                                {it.District || ""}
                                {it.City
                                  ? `${it.District ? ", " : ""}${it.City}`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {ownerTopItems.length === 0 && (
                  <div className="text-sm text-gray-500">
                    Chưa có sản phẩm nổi bật
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
