"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { MapPin, Star, ShieldCheck, Truck, BadgeCheck, Clock3, ChevronLeft, ChevronRight, Search, Filter, X, Loader2 } from "lucide-react";
import { getPublicStoreByUserGuid } from "@/services/products/product.api";

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
  AvailableQuantity?: number;
  Owner?: {
    _id?: string;
    userGuid?: string;
    UserGuid?: string;
    DisplayName?: string;
    FullName?: string;
    AvatarUrl?: string;
  } | null;
}

interface Owner {
  _id: string;
  userGuid: string;
  email?: string;
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  reputationScore?: number;
  createdAt?: string;
}

const formatPrice = (price: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

const LIMIT = 20; // Consistent with API default

export default function OwnerStorePage() {
  const router = useRouter();
  const { userGuid } = router.query as { userGuid?: string };

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    category: "",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = useMemo(() => Math.ceil((total || 0) / LIMIT), [total]);
  const hasActiveFilters = useMemo(() => 
    searchQuery || filters.minPrice || filters.maxPrice || filters.category !== ""
  , [searchQuery, filters]);

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params: any = {
      page: currentPage,
      limit: LIMIT,
    };
    if (searchQuery) params.q = searchQuery;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.category) params.category = filters.category;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    return params;
  }, [currentPage, searchQuery, filters]);

  // Fetch store data
  const fetchStoreData = useCallback(async () => {
    if (!userGuid) {
      setError("Không có userGuid");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const queryParams = buildQueryParams();
      const res = await getPublicStoreByUserGuid(String(userGuid), queryParams);
      const { owner: fetchedOwner, items: fetchedItems, total: fetchedTotal } = res?.data || res || { owner: null, items: [], total: 0 };
      setOwner(fetchedOwner);
      setItems(fetchedItems);
      setTotal(fetchedTotal);
    } catch (e) {
      console.error("Failed to load owner store", e);
      setError("Không thể tải dữ liệu cửa hàng");
    } finally {
      setLoading(false);
    }
  }, [userGuid, buildQueryParams]);

  // Handle page change with smooth scroll
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilters({
      minPrice: "",
      maxPrice: "",
      category: "",
      sortBy: "newest",
    });
    setCurrentPage(1);
  };

  // Initial load and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStoreData();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchStoreData]);

  const ownerInfo = useMemo(() => owner, [owner]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải cửa hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !ownerInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Không tìm thấy chủ shop"}</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Back button */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {/* Owner header */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden ring-2 ring-white/50 shadow-md">
                {ownerInfo?.avatarUrl ? (
                  <img src={ownerInfo.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">👤</div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {ownerInfo.displayName || ownerInfo.fullName || "Chủ shop"}
                </h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">Shop ID: {userGuid}</span>
              </div>
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-gray-900">5.0</span>
                  <span className="text-gray-400">(giả lập)</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1">
                  <Clock3 className="w-4 h-4 text-green-500" />
                  <span>Hoạt động tích cực</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
                  <BadgeCheck className="w-4 h-4" /> Uy tín
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
                  <Truck className="w-4 h-4" /> Giao nhanh
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                  <ShieldCheck className="w-4 h-4" /> Bảo đảm
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="text-gray-600 text-sm">Sản phẩm</div>
                  <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="text-gray-600 text-sm">Còn hàng</div>
                  <div className="text-2xl font-bold text-gray-900">{
                    items.filter((it) => (it.AvailableQuantity ?? 0) > 0).length
                  }</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                  <div className="text-gray-600 text-sm">Danh mục</div>
                  <div className="text-2xl font-bold text-gray-900">{
                    new Set(items.map((it) => it.Category?.name).filter(Boolean)).size
                  }</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100">
                  <div className="text-gray-600 text-sm">Đánh giá</div>
                  <div className="text-2xl font-bold text-gray-900">5.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tìm kiếm sản phẩm..."
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                hasActiveFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-xs font-medium rounded-full">
                  {[searchQuery, filters.minPrice, filters.maxPrice, filters.category].filter(Boolean).length}
                </span>
              )}
            </button>
            
            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="popular">Phổ biến</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Bộ lọc</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Đặt lại
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá tối thiểu</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Từ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá tối đa</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Đến"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả danh mục</option>
                    {/* Add your categories here */}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product grid */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Sản phẩm đang bán</h2>
            <div className="text-sm text-gray-500">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Đang tải...</span>
                </div>
              ) : total > 0 ? (
                <span>Hiển thị {items.length} trên tổng số {total} sản phẩm</span>
              ) : (
                <span>Không có sản phẩm nào</span>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <p>Chưa có sản phẩm nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((it) => {
                const thumb = it.Images?.[0]?.Url;
                const href = `/products/details?id=${it._id}`;
                return (
                  <Link key={it._id} href={href} className="block group">
                    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                      <div className="relative w-full aspect-video bg-gray-50 group-hover:bg-gray-100 transition-colors">
                        {thumb ? (
                          <img src={thumb} alt={it.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {it.Title}
                        </h3>
                        <div className="flex items-baseline justify-between mb-2">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(it.BasePrice, it.Currency)}
                          </div>
                          <span className="text-xs text-gray-500">/{it.PriceUnit?.UnitName || "ngày"}</span>
                        </div>
                        {(it.City || it.District) && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-12 space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages} ({total} sản phẩm)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg border ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition`}
                >
                  Đầu tiên
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      } transition`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition`}
                >
                  Cuối cùng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}