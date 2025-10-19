"use client";

import { useEffect, useState } from "react";
import {
  getAllItems,
} from "@/services/products/product.api";
import { Search, Filter, MapPin, Calendar, Eye, Package, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/ui/common/AddToCartButton";

interface Product {
  _id: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  basePrice: number;
  currency: string;
  depositAmount: number;
  createdAt: string;
  availableQuantity: number;
  quantity: number;
  viewCount: number;
  rentCount: number;
  category?: {
    _id: string;
    name: string;
  };
  condition?: {
    ConditionName: string;
  };
  priceUnit?: {
    UnitName: string;
  };
  tags?: { _id: string; name: string }[];
  city?: string;
  district?: string;
}

interface RawItem {
  _id: string;
  Title: string;
  ShortDescription: string;
  Images?: Array<{ Url: string }>;
  BasePrice: number;
  Currency: string;
  DepositAmount: number;
  CreatedAt: string;
  AvailableQuantity: number;
  Quantity: number;
  ViewCount: number;
  RentCount: number;
  Category?: { _id: string; name: string };
  Condition?: { ConditionName: string };
  PriceUnit?: { UnitName: string };
  Tags?: Array<{ TagId?: string; Tag: { _id: string; name: string } }>;
  City?: string;
  District?: string;
}

const normalizeItems = (rawItems: unknown[]): Product[] => {
  return rawItems.map((item) => {
    const rawItem = item as RawItem;
    return {
      _id: rawItem._id,
      title: rawItem.Title,
      shortDescription: rawItem.ShortDescription,
      thumbnail: rawItem.Images?.[0]?.Url || "/placeholder.jpg",
      basePrice: rawItem.BasePrice,
      currency: rawItem.Currency,
      depositAmount: rawItem.DepositAmount,
      createdAt: rawItem.CreatedAt,
      availableQuantity: rawItem.AvailableQuantity,
      quantity: rawItem.Quantity,
      viewCount: rawItem.ViewCount,
      rentCount: rawItem.RentCount,
      category: rawItem.Category ? { _id: rawItem.Category._id, name: rawItem.Category.name } : undefined,
      condition: rawItem.Condition ? { ConditionName: rawItem.Condition.ConditionName } : undefined,
      priceUnit: rawItem.PriceUnit ? { UnitName: rawItem.PriceUnit.UnitName } : undefined,
      tags: rawItem.Tags ? rawItem.Tags.map((t) => ({ _id: t.TagId || t.Tag._id, name: t.Tag.name })) : [],
      city: rawItem.City,
      district: rawItem.District,
    };
  });
};

const formatPrice = (price: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

export default function ProductPage() {
  const [allItems, setAllItems] = useState<Product[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const itemData = await getAllItems();

        const normalizedItems = normalizeItems(
          itemData?.data?.items || itemData?.items || []
        );

        setAllItems(normalizedItems);
        setItems(normalizedItems);
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetFilter = async () => {
    setItems(allItems);
  };

  const filteredItems = items.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-6">
      <div className="container mx-auto px-4">
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <h1 className="text-3xl font-bold">Sản phẩm mới nhất</h1>
            </div>
            {search && (
              <button onClick={() => setSearch("")} className="text-blue-500 hover:underline">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {item.availableQuantity === 0 && (
                      <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Hết hàng
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.shortDescription}
                    </p>
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                      {item.category && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {item.category.name}
                        </span>
                      )}
                      {item.condition && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {item.condition.ConditionName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="truncate">
                        {item.district}, {item.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Giá thuê</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(item.basePrice, item.currency)}
                            <span className="text-sm font-normal text-gray-600">
                              /{item.priceUnit?.UnitName || 'ngày'}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">Đặt cọc</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {formatPrice(item.depositAmount, item.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        <span>{item.viewCount} lượt xem</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package size={14} />
                        <span>{item.rentCount} lượt thuê</span>
                      </div>
                      <div>
                        <span className="font-semibold">
                          {item.availableQuantity}/{item.quantity}
                        </span>{" "}
                        còn lại
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/products/details?id=${item._id}`}
                        className="flex-1 text-center text-sm text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                      <AddToCartButton
                        itemId={item._id}
                        availableQuantity={item.availableQuantity}
                        size="sm"
                        variant="outline"
                        className="px-3"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-600 mb-6">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
                <button
                  onClick={resetFilter}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Xem tất cả
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}