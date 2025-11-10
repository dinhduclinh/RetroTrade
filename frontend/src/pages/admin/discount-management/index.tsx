"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/common/button";
import { Input } from "@/components/ui/common/input";
import { Label } from "@/components/ui/common/label";
import { Textarea } from "@/components/ui/common/textarea";
// (not using Radix Select here; native select is sufficient)
import { AlertCircle, Plus, CheckCircle, X, Info } from "lucide-react";
import { createDiscount, deactivateDiscount, activateDiscount, listDiscounts, setDiscountPublic, updateDiscount, type CreateDiscountRequest, type UpdateDiscountRequest, type Discount } from "@/services/products/discount/discount.api";

export default function DiscountManagementPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
    isVisible: boolean;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const [form, setForm] = useState<CreateDiscountRequest>({
    type: "percent",
    value: 10,
    maxDiscountAmount: 0,
    minOrderAmount: 0,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    usageLimit: 0,
    notes: "",
    codeLength: 10,
    codePrefix: "",
    isPublic: false,
  });

  // Helpers for VNĐ formatting
  const formatVND = (value: number | undefined): string => {
    const n = Number.isFinite(value as number) ? Number(value) : 0;
    return n.toLocaleString("vi-VN");
  };
  const parseVND = (text: string): number => {
    const digits = text.replace(/[^0-9]/g, "");
    if (!digits) return 0;
    return Math.max(0, Math.floor(Number(digits)));
  };

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message, isVisible: true });
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, isVisible: false } : null);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  };

  // legacy confirm helper (no longer used after inline toggles)

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await listDiscounts(page, 20);
      if (res.status === "success" && res.data) {
        setItems(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        const errorMsg = res.message || "Không thể tải danh sách mã giảm giá";
        setError(errorMsg);
        showNotification("error", errorMsg);
      }
    } catch (e) {
      const err = e as Error;
      // Check if it's a network/CORS error
      let errorMsg: string;
      if (err.message.includes("Failed to fetch") || err.message.includes("Network or CORS")) {
        errorMsg = "Không thể kết nối đến server. Vui lòng kiểm tra xem backend server có đang chạy không (http://localhost:9999)";
      } else {
        errorMsg = err.message || "Lỗi khi tải danh sách mã giảm giá";
      }
      setError(errorMsg);
      showNotification("error", errorMsg);
      console.warn("Error loading discounts (backend may not be running):", err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    try {
      setError(null);
      const payload: CreateDiscountRequest = {
        ...form,
        value: Number(form.value) || 0,
        maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        codePrefix: (form.codePrefix || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
        isPublic: form.isPublic,
      };
      const res = await createDiscount(payload);
      if (res.status === "success") {
        setIsCreateDialogOpen(false);
        showNotification("success", "Tạo mã giảm giá thành công!");
        await load();
      } else {
        const errorMsg = res.message || "Không thể tạo mã giảm giá";
        setError(errorMsg);
        showNotification("error", errorMsg);
      }
    } catch (e) {
      const err = e as Error;
      let errorMsg: string;
      if (err.message.includes("Failed to fetch") || err.message.includes("Network or CORS")) {
        errorMsg = "Không thể kết nối đến server. Vui lòng kiểm tra xem backend server có đang chạy không.";
      } else {
        errorMsg = err.message || "Lỗi khi tạo mã giảm giá";
      }
      setError(errorMsg);
      showNotification("error", errorMsg);
      console.warn("Error creating discount:", err.message);
    }
  }

  const updateStatus = async (discount: Discount, nextActive: boolean) => {
    if (discount.active === nextActive) return;
    try {
      setError(null);
      if (!nextActive) {
        const res = await deactivateDiscount(discount._id);
        if (res.status === "success") {
          showNotification("success", `Đã tắt trạng thái cho mã ${discount.code}`);
          await load();
        } else {
          const msg = res.message || "Không thể tắt trạng thái";
          setError(msg);
          showNotification("error", msg);
        }
      } else {
        const res = await activateDiscount(discount._id);
        if (res.status === "success") {
          showNotification("success", `Đã bật trạng thái cho mã ${discount.code}`);
          await load();
        } else {
          const msg = res.message || "Không thể bật trạng thái";
          setError(msg);
          showNotification("error", msg);
        }
      }
    } catch (e) {
      const err = e as Error;
      const msg = err.message || "Lỗi khi đổi trạng thái";
      setError(msg);
      showNotification("error", msg);
    }
  };

  const updateScope = async (discount: Discount, nextPublic: boolean) => {
    if ((discount.isPublic ?? false) === nextPublic) return;
    try {
      setError(null);
      if (!nextPublic) {
        const res = await updateDiscount(discount._id, { isPublic: false });
        if (res.status === "success") {
          showNotification("success", `Đã chuyển phạm vi mã ${discount.code} sang riêng tư`);
          await load();
        } else {
          const msg = res.message || "Không thể chuyển về riêng tư";
          setError(msg);
          showNotification("error", msg);
        }
      } else {
        const res = await setDiscountPublic(discount._id);
        if (res.status === "success") {
          showNotification("success", `Đã chuyển phạm vi mã ${discount.code} sang công khai`);
          await load();
        } else {
          const msg = res.message || "Không thể đặt công khai";
          setError(msg);
          showNotification("error", msg);
        }
      }
    } catch (e) {
      const err = e as Error;
      const msg = err.message || "Lỗi khi chuyển phạm vi";
      setError(msg);
      showNotification("error", msg);
    }
  };

  function handleEdit(discount: Discount) {
    setEditingDiscount(discount);
    setForm({
      type: discount.type,
      value: discount.value,
      maxDiscountAmount: discount.maxDiscountAmount || 0,
      minOrderAmount: discount.minOrderAmount || 0,
      startAt: new Date(discount.startAt).toISOString().slice(0, 16),
      endAt: new Date(discount.endAt).toISOString().slice(0, 16),
      usageLimit: discount.usageLimit || 0,
      notes: discount.notes || "",
      codeLength: discount.code?.length || 10,
      codePrefix: "",
      isPublic: discount.isPublic ?? false,
    });
    setIsEditDialogOpen(true);
  }

  async function handleUpdate() {
    if (!editingDiscount) return;
    try {
      setError(null);
      const payload: UpdateDiscountRequest = {
        type: form.type,
        value: Number(form.value) || 0,
        maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        startAt: form.startAt,
        endAt: form.endAt,
        usageLimit: Number(form.usageLimit) || 0,
        notes: form.notes,
        isPublic: form.isPublic,
      };
      const res = await updateDiscount(editingDiscount._id, payload);
      if (res.status === "success") {
        setIsEditDialogOpen(false);
        setEditingDiscount(null);
        showNotification("success", "Cập nhật mã giảm giá thành công!");
        await load();
      } else {
        const errorMsg = res.message || "Không thể cập nhật mã giảm giá";
        setError(errorMsg);
        showNotification("error", errorMsg);
      }
    } catch (e) {
      const err = e as Error;
      let errorMsg: string;
      if (err.message.includes("Failed to fetch") || err.message.includes("Network or CORS")) {
        errorMsg = "Không thể kết nối đến server. Vui lòng kiểm tra xem backend server có đang chạy không.";
      } else {
        errorMsg = err.message || "Lỗi khi cập nhật mã giảm giá";
      }
      setError(errorMsg);
      showNotification("error", errorMsg);
      console.warn("Error updating discount:", err.message);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quản lý mã giảm giá</h2>
        <p className="text-gray-600">Tạo, xem danh sách và vô hiệu hóa mã giảm giá</p>
      </div>


      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Tạo mã giảm giá
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Giá trị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Đã dùng / Giới hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phạm vi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Không có mã giảm giá nào</td>
                  </tr>
                ) : (
                  items.map((d) => {
                    const start = new Date(d.startAt);
                    const end = new Date(d.endAt);
                    return (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{d.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{d.type === "percent" ? "Phần trăm" : "Cố định"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{d.type === "percent" ? `${d.value}%` : d.value.toLocaleString("vi-VN")} {d.type === "fixed" ? "₫" : ""}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{(d.usedCount || 0)} / {(d.usageLimit || 0) === 0 ? "∞" : d.usageLimit}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{start.toLocaleString("vi-VN")} - {end.toLocaleString("vi-VN")}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <select
                            value={d.active ? "active" : "inactive"}
                            onChange={(e) => updateStatus(d, e.target.value === "active")}
                            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                              d.active
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-700"
                            }`}
                          >
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <select
                            value={d.isPublic ? "public" : "private"}
                            onChange={(e) => updateScope(d, e.target.value === "public")}
                            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                              d.isPublic
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-purple-50 border-purple-200 text-purple-700"
                            }`}
                          >
                            <option value="public">Công khai</option>
                            <option value="private">Riêng tư</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(d)}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              Chỉnh sửa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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

      {/* Create Pop-up Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Tạo mã giảm giá</h2>
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
             <div>
               <Label>Loại</Label>
               <select
                 value={form.type}
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                   const nextType = e.target.value as "percent" | "fixed";
                   setForm((prev) => ({
                     ...prev,
                     type: nextType,
                     // Chuẩn hóa lại giá trị khi chuyển loại
                     value:
                       nextType === "fixed"
                         ? Math.max(0, Math.floor(Number(prev.value) || 0))
                         : Math.min(100, Math.max(0, Number(prev.value) || 0)),
                   }));
                 }}
                 className="bg-white border border-gray-300 text-gray-900 w-full rounded-md h-10 px-3"
               >
                 <option value="percent">Phần trăm</option>
                 <option value="fixed">Cố định</option>
               </select>
             </div>
             <div>
               <Label>
                 Giá trị {form.type === "percent" ? "(%)" : "(₫)"}
               </Label>
               {form.type === "percent" ? (
                 <Input
                   type="number"
                   value={form.value}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                     const raw = Number(e.target.value);
                     const clamped = Math.min(100, Math.max(0, isFinite(raw) ? raw : 0));
                     setForm({ ...form, value: clamped });
                   }}
                   className="bg-white border-gray-300 text-gray-900"
                 />
               ) : (
                 <Input
                   type="text"
                   value={formatVND(form.value)}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                     const vnd = parseVND(e.target.value);
                     setForm({ ...form, value: vnd });
                   }}
                   className="bg-white border-gray-300 text-gray-900"
                 />
               )}
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Giảm tối đa (₫)</Label>
                <Input
                  type="text"
                  value={formatVND(form.maxDiscountAmount || 0)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, maxDiscountAmount: parseVND(e.target.value) })
                  }
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label>Đơn tối thiểu (₫)</Label>
                <Input
                  type="text"
                  value={formatVND(form.minOrderAmount || 0)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, minOrderAmount: parseVND(e.target.value) })
                  }
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div>
              <Label>Phạm vi áp dụng</Label>
              <select
                value={form.isPublic ? "public" : "private"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((prev) => ({
                    ...prev,
                    isPublic: e.target.value === "public",
                  }))
                }
                className="bg-white border border-gray-300 text-gray-900 w-full rounded-md h-10 px-3"
              >
                <option value="private">Riêng tư (gán người dùng)</option>
                <option value="public">Công khai (mọi khách hàng)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Mã công khai sẽ hiển thị với tất cả khách hàng và không thể gán cho cá nhân cụ thể.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bắt đầu</Label>
                 <Input type="datetime-local" value={form.startAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, startAt: e.target.value })} className="bg-white border-gray-300 text-gray-900" />
              </div>
              <div>
                <Label>Kết thúc</Label>
                 <Input type="datetime-local" value={form.endAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, endAt: e.target.value })} className="bg-white border-gray-300 text-gray-900" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Giới hạn sử dụng (0 = không giới hạn)</Label>
                 <Input type="number" value={form.usageLimit || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, usageLimit: Number(e.target.value) })} className="bg-white border-gray-300 text-gray-900" />
              </div>
              <div>
                <Label>Độ dài mã (mặc định 10)</Label>
                 <Input type="number" value={form.codeLength || 10} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, codeLength: Number(e.target.value) })} className="bg-white border-gray-300 text-gray-900" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tiền tố mã (tùy chọn)</Label>
                <Input
                  type="text"
                  placeholder="Ví dụ: WINTER2025"
                  value={form.codePrefix || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, codePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })
                  }
                  className="bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ cho phép chữ cái/ số, tự chuyển thành UPPERCASE.</p>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Xem trước:</span>{" "}
                  <span className="font-mono">{(form.codePrefix || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, Math.max(0, (form.codeLength || 10)))}
                    {" "+ ("#".repeat(Math.max(0, (form.codeLength || 10) - Math.min(((form.codePrefix||"").length), (form.codeLength||10)))))}</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Ghi chú</Label>
             <Textarea value={form.notes || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} className="bg-white border-gray-300 text-gray-900" />
            </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-gray-600 hover:text-gray-900">Hủy</Button>
                <Button onClick={handleCreate} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">Tạo</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pop-up Modal */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa mã giảm giá: {editingDiscount?.code}</h2>
              <button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingDiscount(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Mã giảm giá:</span> {editingDiscount?.code}
              </p>
              <p className="text-xs text-gray-500 mt-1">Mã giảm giá không thể thay đổi</p>
              {editingDiscount?.isPublic && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-700 font-medium">
                    ⚠️ Discount công khai không thể gán với người dùng. Discount công khai có thể được sử dụng bởi tất cả người dùng.
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label>Loại</Label>
              <select
                value={form.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const nextType = e.target.value as "percent" | "fixed";
                  setForm((prev) => ({
                    ...prev,
                    type: nextType,
                    value:
                      nextType === "fixed"
                        ? Math.max(0, Math.floor(Number(prev.value) || 0))
                        : Math.min(100, Math.max(0, Number(prev.value) || 0)),
                  }));
                }}
                className="bg-white border border-gray-300 text-gray-900 w-full rounded-md h-10 px-3"
              >
                <option value="percent">Phần trăm</option>
                <option value="fixed">Cố định</option>
              </select>
            </div>
            <div>
              <Label>Phạm vi áp dụng</Label>
              <select
                value={form.isPublic ? "public" : "private"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((prev) => ({
                    ...prev,
                    isPublic: e.target.value === "public",
                  }))
                }
                className="bg-white border border-gray-300 text-gray-900 w-full rounded-md h-10 px-3"
              >
                <option value="private">Riêng tư (gán người dùng)</option>
                <option value="public">Công khai (mọi khách hàng)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Thay đổi phạm vi sẽ áp dụng ngay cho mã giảm giá này.
              </p>
            </div>
            <div>
              <Label>
                Giá trị {form.type === "percent" ? "(%)" : "(₫)"}
              </Label>
              {form.type === "percent" ? (
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const raw = Number(e.target.value);
                    const clamped = Math.min(100, Math.max(0, isFinite(raw) ? raw : 0));
                    setForm({ ...form, value: clamped });
                  }}
                  className="bg-white border-gray-300 text-gray-900"
                />
              ) : (
                <Input
                  type="text"
                  value={formatVND(form.value)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const vnd = parseVND(e.target.value);
                    setForm({ ...form, value: vnd });
                  }}
                  className="bg-white border-gray-300 text-gray-900"
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Giá trị giảm tối đa (₫)</Label>
                <Input
                  type="text"
                  value={formatVND(form.maxDiscountAmount || 0)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, maxDiscountAmount: parseVND(e.target.value) })
                  }
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label>Giá trị đơn hàng tối thiểu (₫)</Label>
                <Input
                  type="text"
                  value={formatVND(form.minOrderAmount || 0)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, minOrderAmount: parseVND(e.target.value) })
                  }
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bắt đầu</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, startAt: e.target.value })} className="bg-white border-gray-300 text-gray-900" />
              </div>
              <div>
                <Label>Kết thúc</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, endAt: e.target.value })} className="bg-white border-gray-300 text-gray-900" />
              </div>
            </div>
            <div>
              <Label>Giới hạn sử dụng ( Nếu 0 thì không giới hạn)</Label>
              <Input type="number" value={form.usageLimit || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, usageLimit: Number(e.target.value) })} className="bg-white border-gray-300 text-gray-900" />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea value={form.notes || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} className="bg-white border-gray-300 text-gray-900" />
            </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={() => { setIsEditDialogOpen(false); setEditingDiscount(null); }} className="text-gray-600 hover:text-gray-900">Hủy</Button>
                <Button onClick={handleUpdate} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">Cập nhật</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Pop-up */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[10000] transition-all duration-300 ease-in-out ${
            notification.isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div
            className={`min-w-[320px] max-w-md rounded-lg shadow-2xl border-2 p-4 flex items-start gap-3 ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : notification.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">{notification.message}</p>
            </div>
            <button
              onClick={() => {
                setNotification(prev => prev ? { ...prev, isVisible: false } : null);
                setTimeout(() => setNotification(null), 300);
              }}
              className={`flex-shrink-0 ml-2 p-1 rounded hover:bg-black/10 transition-colors ${
                notification.type === "success"
                  ? "text-green-700 hover:bg-green-100"
                  : notification.type === "error"
                  ? "text-red-700 hover:bg-red-100"
                  : "text-blue-700 hover:bg-blue-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog Pop-up */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
                <p className="text-sm text-gray-600">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog(null);
                }}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


