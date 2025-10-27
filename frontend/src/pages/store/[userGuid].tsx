"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { MapPin, Star, ShieldCheck, Truck, BadgeCheck, Clock3 } from "lucide-react";
import { getAllItems } from "@/services/products/product.api";

interface Product {
  _id: string;
  Title: string;
  ShortDescription?: string;
  BasePrice: number;
  Currency: string;
  PriceUnit?: { UnitName: string } | null;
  Category?: { _id: string; name: string } | null;
  Images?: { Url: string }[];
  City?: string;
  District?: string;
  Owner?: {
    _id?: string;
    userGuid?: string;
    UserGuid?: string;
    DisplayName?: string;
    FullName?: string;
    AvatarUrl?: string;
  } | null;
}

const formatPrice = (price: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

export default function OwnerStorePage() {
  const router = useRouter();
  const { userGuid } = router.query as { userGuid?: string };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAllItems();
        const list: Product[] = (res?.data?.items || res?.items || []) as Product[];
        setItems(list);
      } catch (e) {
        console.error("Failed to load owner store", e);
        setError("Không thể tải dữ liệu cửa hàng");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const ownerItems = useMemo(() => {
    if (!userGuid) return [] as Product[];
    const uid = String(userGuid);
    return items.filter((it) => {
      const oid = (it?.Owner as any)?._id || (it?.Owner as any)?.userGuid || (it?.Owner as any)?.UserGuid;
      return oid && String(oid) === uid;
    });
  }, [items, userGuid]);

  const ownerInfo = useMemo(() => {
    return ownerItems[0]?.Owner || null;
  }, [ownerItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Đang tải...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">Quay lại</button>
        </div>

        {/* Owner header */}
        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
            {ownerInfo?.AvatarUrl ? (
              <img src={ownerInfo.AvatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
            )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {ownerInfo?.DisplayName || ownerInfo?.FullName || "Chủ shop"}
                </h1>
                <span className="text-sm text-gray-500">Shop ID: {userGuid}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-700 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">5.0</span>
                  <span className="text-gray-400">(giả lập)</span>
                </div>
                <div className="hidden md:block text-gray-300">|</div>
                <div className="flex items-center gap-1">
                  <Clock3 className="w-4 h-4 text-blue-500" />
                  <span>Hoạt động tích cực</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-gray-700">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Uy tín
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Giao nhanh
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Bảo đảm
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-gray-500">Sản phẩm</div>
                  <div className="text-gray-900 font-semibold">{ownerItems.length}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-gray-500">Còn hàng</div>
                  <div className="text-gray-900 font-semibold">{
                    ownerItems.filter((it) => (it as any)?.AvailableQuantity > 0).length
                  }</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-gray-500">Danh mục</div>
                  <div className="text-gray-900 font-semibold">{
                    new Set(ownerItems.map((it) => it.Category?.name).filter(Boolean)).size
                  }</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-gray-500">Đánh giá</div>
                  <div className="text-gray-900 font-semibold">5.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Sản phẩm đang bán</h2>
            <span className="text-sm text-gray-500">Tổng: {ownerItems.length}</span>
          </div>

          {ownerItems.length === 0 ? (
            <div className="text-gray-600">Chưa có sản phẩm.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {ownerItems.map((it) => {
                const thumb = it.Images?.[0]?.Url;
                const href = `/products/details?id=${it._id}`;
                return (
                  <Link key={it._id} href={href} className="block">
                    <div className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition cursor-pointer">
                      <div className="w-full aspect-video bg-gray-100">
                        {thumb ? (
                          <img src={thumb} alt={it.Title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {it.Title}
                        </div>
                        <div className="text-blue-600 font-semibold mt-1">
                          {formatPrice(it.BasePrice, it.Currency)}
                          <span className="text-xs text-gray-500">/{it.PriceUnit?.UnitName || "ngày"}</span>
                        </div>
                        {(it.City || it.District) && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{it.District || ""}{it.City ? `${it.District ? ", " : ""}${it.City}` : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
