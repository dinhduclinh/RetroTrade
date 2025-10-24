"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllItems, getAllCategories, getFeaturedItems, getSearchTags } from "@/services/products/product.api";
import { vietnamProvinces } from "@/lib/vietnam-locations";
import {
  Search,
  Filter,
  MapPin,
  Eye,
  Package,
  X,
  ShoppingCart,
  Zap,
  Star,
} from "lucide-react";
import AddToCartButton from "@/components/ui/common/AddToCartButton";

interface Category {
  _id: string;
  name: string;
  parentCategoryId?: string | null;
  isActive?: boolean;
}

interface TagItem {
  _id: string;
  name: string;
  count?: number;
}

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

const toIdString = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;
  if (typeof v === "object" && typeof v.toString === "function")
    return v.toString();
  try {
    return String(v);
  } catch {
    return "";
  }
};

const normalizeItems = (rawItems: any[]): Product[] => {
  return rawItems.map((item) => ({
    _id: toIdString(item._id),
    title: item.Title,
    shortDescription: item.ShortDescription,
    thumbnail: item.Images?.[0]?.Url || "/placeholder.jpg",
    basePrice: item.BasePrice,
    currency: item.Currency,
    depositAmount: item.DepositAmount,
    createdAt: item.CreatedAt,
    availableQuantity: item.AvailableQuantity,
    quantity: item.Quantity,
    viewCount: item.ViewCount,
    rentCount: item.RentCount,
    category: item.Category
      ? { _id: toIdString(item.Category._id), name: item.Category.name }
      : undefined,
    condition: item.Condition
      ? { ConditionName: item.Condition.ConditionName }
      : undefined,
    priceUnit: item.PriceUnit
      ? { UnitName: item.PriceUnit.UnitName }
      : undefined,
    tags: Array.isArray(item.Tags)
      ? (item.Tags
          .map((t: any) => {
            const id = toIdString(t.TagId || t.Tag?._id || t._id || t.id);
            const name = t.Tag?.name || t.TagName || t.Name || t.name;
            if (!id || !name) return null;
            return { _id: id, name };
          })
          .filter(Boolean) as { _id: string; name: string }[])
      : [],
    city: item.City,
    district: item.District,
  }));
};

const formatPrice = (price: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

export default function ProductPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [allItems, setAllItems] = useState<Product[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState(5000000); // slider max default: 5,000,000
  const [featuredItems, setFeaturedItems] = useState<Product[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [itemData, cateData, featuredRes, tagsRes] = await Promise.all([
          getAllItems(),
          getAllCategories(),
          getFeaturedItems({ page: 1, limit: 12 }),
          getSearchTags(),
        ]);

        const normalizedItems = normalizeItems(
          itemData?.data?.items || itemData?.items || []
        );
        const normalizedCates = cateData?.data || cateData || [];
        const processedCates: Category[] = (normalizedCates as any[]).map(
          (c: any) => ({
            _id: toIdString(c._id || c.id),
            name: c.name,
            parentCategoryId:
              c.parentCategoryId === "" || c.parentCategoryId == null
                ? null
                : toIdString(c.parentCategoryId),
            isActive: c.isActive,
          })
        );

        setAllItems(normalizedItems);
        setItems(normalizedItems);
        setCategories(processedCates);

        const normalizedFeatured = normalizeItems(
          featuredRes?.data?.items || featuredRes?.items || []
        );
        setFeaturedItems(normalizedFeatured);

        const tagList: TagItem[] = (tagsRes?.data?.tags || []).map((t: any) => ({
          _id: toIdString(t._id),
          name: t.name,
          count: t.count,
        }));
        setTags(tagList);
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...allItems];

    // Filter by selected category
    if (selectedCategory) {
      const selected = categories.find((c) => c._id === selectedCategory);
      if (selected) {
        const isRoot = (selected.parentCategoryId ?? null) === null;
        if (isRoot) {
          const allowed = new Set<string>([
            selectedCategory,
            ...getDescendantIds(selectedCategory),
          ]);
          filtered = filtered.filter(
            (item) => item.category && allowed.has(item.category._id)
          );
        } else {
          filtered = filtered.filter(
            (item) => item.category && item.category._id === selectedCategory
          );
        }
      }
    }

    // Filter by max price (VND/day)
    filtered = filtered.filter((item) => item.basePrice <= maxPrice);

    // Filter by search (ONLY title)
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by selected province (city)
    if (selectedProvince) {
      const sp = selectedProvince.toLowerCase();
      filtered = filtered.filter((p) => (p.city || "").toLowerCase() === sp);
    }

    // Filter by selected tags
    if (selectedTagIds.size > 0) {
      filtered = filtered.filter((item) => {
        const itemTagIds = new Set((item.tags || []).map((t) => toIdString(t._id)));
        for (const id of selectedTagIds) {
          if (itemTagIds.has(id)) return true;
        }
        return false;
      });
    }

    setItems(filtered);
  }, [
    selectedCategory,
    maxPrice,
    search,
    selectedTagIds,
    selectedProvince,
    allItems,
  ]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const getChildren = (parentId: string | null) =>
    categories.filter((c) => (c.parentCategoryId ?? null) === parentId);

  const getDescendantIds = (categoryId: string): string[] => {
    const direct = getChildren(categoryId);
    const all: string[] = [];
    for (const c of direct) {
      all.push(c._id);
      all.push(...getDescendantIds(c._id));
    }
    return all;
  };

  const renderChildTree = (parentId: string, level = 0) => {
    const children = getChildren(parentId);
    if (!children.length) return null;
    return (
      <div className="space-y-1">
        {children.map((child) => (
          <div key={child._id}>
            <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
              <input
                id={`cat-${child._id}`}
                type="radio"
                name="category"
                checked={selectedCategory === child._id}
                onChange={() => handleCategorySelect(child._id)}
                className="border-gray-300"
              />
              <label
                htmlFor={`cat-${child._id}`}
                className="text-sm text-gray-700 cursor-pointer"
                style={{ paddingLeft: level * 8 }}
              >
                {child.name}
              </label>
            </div>
            {renderChildTree(child._id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  const toggleRoot = (rootId: string) => {
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });
  };

  const handleAddToCart = (product: Product) => {
    // Implement add to cart logic here (e.g., dispatch to Redux store)
    console.log("Added to cart:", product.title);
    // For now, just log or show toast
  };

  const handleRentNow = (productId: string) => {
    router.push(`/products/details?id=${productId}`);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

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
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-72 hidden lg:block">
            {/* Unified Filter Panel */}
            <div className="bg-white shadow rounded-2xl p-4 sticky top-6">
              <h3 className="font-semibold mb-4">Bộ lọc</h3>

              {/* Categories - Click-to-expand inline */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-gray-700">Danh mục</h4>
                {/* All products default option */}
                <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === null}
                    onChange={() => setSelectedCategory(null)}
                    className="border-gray-300"
                  />
                  <span className="text-sm text-gray-700 font-medium">Tất cả sản phẩm</span>
                </div>
                <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
                  {getChildren(null).map((root) => (
                    <div key={root._id} className="">
                      <div
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleRoot(root._id)}
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === root._id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleCategorySelect(root._id)}
                          className="border-gray-300"
                        />
                        <span className="text-sm text-gray-700 font-medium flex-1">
                          {root.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {expandedRoots.has(root._id) ? "−" : "+"}
                        </span>
                      </div>
                      {expandedRoots.has(root._id) &&
                        getChildren(root._id).length > 0 && (
                          <div className="pl-6 py-1">
                            {renderChildTree(root._id)}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price - Slider */
              }
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">
                  Giá thuê (VND)
                </h4>
                <input
                  type="range"
                  min={0}
                  max={5000000}
                  step={50000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0</span>
                  <span>{new Intl.NumberFormat("vi-VN").format(5000000)}</span>
                </div>
                <div className="text-right text-sm text-gray-700 mt-1">
                  Tối đa: {new Intl.NumberFormat("vi-VN").format(maxPrice)}đ
                </div>
              </div>

              {/* Location (Province/City) */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Nơi cho thuê</h4>
                  {selectedProvince && (
                    <button
                      onClick={() => setSelectedProvince("")}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {(showAllProvinces ? vietnamProvinces : vietnamProvinces.slice(0, 6)).map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="province"
                        checked={selectedProvince === p}
                        onChange={() => setSelectedProvince(p)}
                        className="accent-blue-600"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                  {vietnamProvinces.length > 6 && (
                    <button
                      onClick={() => setShowAllProvinces((v) => !v)}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      {showAllProvinces ? "Thu gọn" : "Xem thêm"}
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Tag phổ biến</h4>
                  {selectedTagIds.size > 0 && (
                    <button
                      onClick={() => setSelectedTagIds(new Set())}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => {
                    const active = selectedTagIds.has(t._id);
                    return (
                      <span
                        key={t._id}
                        onClick={() => {
                          setSelectedTagIds((prev) => {
                            const next = new Set<string>();
                            if (!prev.has(t._id)) next.add(t._id); // single-select like blog
                            return next;
                          });
                        }}
                        className={`text-xs px-3 py-1 rounded-full cursor-pointer ${
                          active
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                        }`}
                      >
                        #{t.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              
            </div>
          </aside>

          {/* Main Content */}
          <main
            className={`flex-1 transition-all duration-500 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Sản phẩm cho thuê</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/products/myfavorite")}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span>Danh sách yêu thích</span>
                </button>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-blue-500 hover:underline"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm hoặc địa chỉ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                
              </div>
            </div>

            {featuredItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> Sản phẩm nổi bật
                </h2>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 min-w-full">
                    {featuredItems.map((item) => (
                      <div
                        key={item._id}
                        className="min-w-[220px] max-w-[220px] bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
                        onClick={() => handleRentNow(item._id)}
                      >
                        <div className="h-32 bg-gray-200">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-semibold line-clamp-2 mb-1">{item.title}</div>
                          <div className="text-xs text-gray-600 mb-2 truncate">{item.category?.name}</div>
                          <div className="text-blue-600 text-sm font-bold">
                            {formatPrice(item.basePrice, item.currency)}
                            <span className="text-xs text-gray-500">/{item.priceUnit?.UnitName || "ngày"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <div
                    key={item._id}
                    onClick={() => handleRentNow(item._id)}
                    role="button"
                    tabIndex={0}
                    className="group h-full flex flex-col cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden opacity-0 translate-y-2"
                    style={{
                      transitionDelay: `${index * 50}ms`,
                      opacity: mounted ? 1 : 0,
                      transform: mounted
                        ? "translateY(0)"
                        : "translateY(0.5rem)",
                    }}
                  >
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                      />
                      {item.availableQuantity === 0 && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Hết hàng
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 min-h-[3.5rem]">
                        {item.title}
                      </h3>
                      {/* Mô tả ngắn đã được bỏ theo yêu cầu */}
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 min-h-[2rem]">
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
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3 min-h-[1.5rem]">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate">
                          {item.district}, {item.city}
                        </span>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 mb-3 min-h-[4.5rem]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              Giá thuê
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatPrice(item.basePrice, item.currency)}
                              <span className="text-sm font-normal text-gray-600">
                                /{item.priceUnit?.UnitName || "ngày"}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">
                              Đặt cọc
                            </p>
                            <p className="text-sm font-semibold text-gray-700">
                              {formatPrice(item.depositAmount, item.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100 min-h-[2rem]">
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
                      <div className="mt-auto flex gap-2">
                        <div onClick={(e) => e.stopPropagation()} className="flex-1">
                          <AddToCartButton
                            itemId={item._id}
                            availableQuantity={item.availableQuantity}
                            size="sm"
                            variant="outline"
                            showText
                            className="w-full"
                          />
                        </div>
                        <button
                          onClick={() => handleRentNow(item._id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Zap size={16} />
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory(null);
                      setMaxPrice(5000000);
                      setSelectedTagIds(new Set());
                      setSelectedProvince("");
                    }}
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
    </div>
  );
}
