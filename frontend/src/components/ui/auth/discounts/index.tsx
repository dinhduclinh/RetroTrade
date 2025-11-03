"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { Button } from "@/components/ui/common/button";
import { AlertCircle, Copy, Tag } from "lucide-react";
import { listAvailableDiscounts, type Discount } from "@/services/products/discount/discount.api";

export default function MyDiscountsPage() {
  const { accessToken } = useSelector((s: RootState) => s.auth);
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // removed test apply states
  const [tab, setTab] = useState<"all" | "active" | "expiring" | "private">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "percent" | "fixed">("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listAvailableDiscounts(page, 20);
      if (res.status === "success" && res.data) {
        setItems(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        setError(res.message || "Không thể tải danh sách mã của bạn");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!accessToken) return;
    load();
  }, [accessToken, load]);

  const handleCopy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); } catch {}
  };

  // removed validate handler

  const filteredItems = useMemo(() => {
    const now = new Date();
    let list = items;
    if (tab === "active") {
      list = list.filter((d) => new Date(d.startAt) <= now && new Date(d.endAt) >= now && d.active);
    } else if (tab === "expiring") {
      list = list.filter((d) => {
        const end = new Date(d.endAt);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return d.active && diffDays > 0 && diffDays <= 7;
      });
    } else if (tab === "private") {
      list = list.filter((d) => d.isPublic === false);
    }
    if (typeFilter !== "all") {
      list = list.filter((d) => d.type === typeFilter);
    }
    return list;
  }, [items, tab, typeFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mã giảm giá của tôi</h2>
        <p className="text-gray-600">Xem và sao chép mã giảm giá bạn được phép sử dụng</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* removed: test apply section */}

      {/* Tabs & Filters */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "active", label: "Đang hiệu lực" },
              { key: "expiring", label: "Sắp hết hạn" },
              { key: "private", label: "Riêng tư" },
            ] as Array<{ key: "all" | "active" | "expiring" | "private"; label: string }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm border ${tab === t.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Lọc:</span>
          <select
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value as ("all" | "percent" | "fixed"))}
            className="h-9 px-3 rounded-md border border-gray-300 text-sm bg-white text-gray-900"
          >
            <option value="all">Tất cả loại</option>
            <option value="percent">Phần trăm</option>
            <option value="fixed">Cố định</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {/* Grid of coupon cards */}
            {filteredItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">Không có mã phù hợp</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {filteredItems.map((d) => {
                  const now = new Date();
                  const start = new Date(d.startAt);
                  const end = new Date(d.endAt);
                  const isActiveWindow = start <= now && end >= now && d.active;
                  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpiring = isActiveWindow && diffDays > 0 && diffDays <= 7;
                  const usageBadge = d.usageLimit ? `${d.usedCount || 0}/${d.usageLimit}` : "∞";
                  return (
                    <div key={d._id} className="flex border rounded-xl overflow-hidden">
                      {/* Left strip */}
                      <div className={`w-28 p-4 flex flex-col items-center justify-center ${d.type === "percent" ? "bg-orange-50" : "bg-blue-50"} border-r` }>
                        <div className="text-3xl font-extrabold text-gray-900">
                          {d.type === "percent" ? `${d.value}%` : `${d.value.toLocaleString("vi-VN")}`}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{d.type === "percent" ? "Giảm" : "₫ giảm"}</div>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border text-gray-700 bg-white">
                          {d.isPublic ? "Công khai" : "Chỉ bạn"}
                        </div>
                      </div>
                      {/* Main content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-gray-500" /> {d.code}
                              {isExpiring && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Sắp hết hạn</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {(d.minOrderAmount || 0) > 0 ? `ĐH tối thiểu ${d.minOrderAmount?.toLocaleString("vi-VN")} ₫` : "Không yêu cầu đơn tối thiểu"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{start.toLocaleDateString("vi-VN")} - {end.toLocaleDateString("vi-VN")}</div>
                            {d.usageLimit ? (
                              <div className="mt-2">
                                <div className="h-1.5 w-40 bg-gray-100 rounded">
                                  <div className="h-1.5 bg-indigo-500 rounded" style={{ width: `${Math.min(100, Math.round(((d.usedCount || 0) / d.usageLimit) * 100))}%` }} />
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">Đã dùng: {usageBadge}</div>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(d.code)}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Sao chép
                            </Button>
                            <Button
                              disabled={!isActiveWindow}
                              className={`${isActiveWindow ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-300 cursor-not-allowed"} text-white`}
                              onClick={() => handleCopy(d.code)}
                            >
                              Dùng ngay
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">Trang {page} / {totalPages}</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">Trước</Button>
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">Sau</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


