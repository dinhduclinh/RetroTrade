"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/common/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/common/dialog";
import { Input } from "@/components/ui/common/input";
import { Label } from "@/components/ui/common/label";
import { Textarea } from "@/components/ui/common/textarea";
// (not using Radix Select here; native select is sufficient)
import { AlertCircle, Plus, XCircle, CheckCircle } from "lucide-react";
import { createDiscount, deactivateDiscount, activateDiscount, listDiscounts, assignUsersToDiscount, setDiscountPublic, type CreateDiscountRequest, type Discount } from "@/services/products/discount/discount.api";

export default function DiscountManagementPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Discount | null>(null);
  const [assignForm, setAssignForm] = useState<{ userIds: string; perUserLimit: number; effectiveFrom?: string; effectiveTo?: string }>({ userIds: "", perUserLimit: 1 });

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

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await listDiscounts(page, 20);
      if (res.status === "success" && res.data) {
        setItems(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      } else {
        setError(res.message || "Không thể tải danh sách mã giảm giá");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi tải danh sách mã giảm giá");
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
      };
      const res = await createDiscount(payload);
      if (res.status === "success") {
        setIsCreateDialogOpen(false);
        await load();
      } else {
        setError(res.message || "Không thể tạo mã giảm giá");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi tạo mã giảm giá");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Vô hiệu hóa mã giảm giá này?")) return;
    try {
      setError(null);
      const res = await deactivateDiscount(id);
      if (res.status === "success") {
        await load();
      } else {
        setError(res.message || "Không thể vô hiệu hóa");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi vô hiệu hóa");
    }
  }

  async function handleActivate(id: string) {
    try {
      setError(null);
      const res = await activateDiscount(id);
      if (res.status === "success") {
        await load();
      } else {
        setError(res.message || "Không thể kích hoạt lại");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi kích hoạt lại");
    }
  }

  async function handleAssign() {
    if (!assignTarget) return;
    try {
      setError(null);
      const userIds = assignForm.userIds
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: { userIds: string[]; perUserLimit?: number; effectiveFrom?: string; effectiveTo?: string } = {
        userIds,
        perUserLimit: Number(assignForm.perUserLimit) || 1,
      };
      if (assignForm.effectiveFrom) payload.effectiveFrom = new Date(assignForm.effectiveFrom).toISOString();
      if (assignForm.effectiveTo) payload.effectiveTo = new Date(assignForm.effectiveTo).toISOString();

      const res = await assignUsersToDiscount(assignTarget._id, payload);
      if (res.status === "success") {
        setAssignOpen(false);
        setAssignTarget(null);
        setAssignForm({ userIds: "", perUserLimit: 1 });
        await load();
      } else {
        setError(res.message || "Không thể gán người dùng");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi gán người dùng");
    }
  }

  async function handleSetPublic(id: string) {
    try {
      setError(null);
      const res = await setDiscountPublic(id);
      if (res.status === "success") {
        await load();
      } else {
        setError(res.message || "Không thể đặt công khai");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Lỗi khi đặt công khai");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quản lý mã giảm giá</h2>
        <p className="text-gray-600">Tạo, xem danh sách và vô hiệu hóa mã giảm giá</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Tạo mã giảm giá
        </Button>
      </div>

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
                    const now = new Date();
                    const start = new Date(d.startAt);
                    const end = new Date(d.endAt);
                    const isActiveWindow = start <= now && end >= now;
                    return (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{d.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{d.type === "percent" ? "Phần trăm" : "Cố định"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{d.type === "percent" ? `${d.value}%` : d.value.toLocaleString("vi-VN")} {d.type === "fixed" ? "₫" : ""}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{(d.usedCount || 0)} / {(d.usageLimit || 0) === 0 ? "∞" : d.usageLimit}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{start.toLocaleString("vi-VN")} - {end.toLocaleString("vi-VN")}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {d.active && isActiveWindow ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" /> Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" /> Không hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {d.isPublic ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              Công khai
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              Riêng tư (gán người dùng)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {d.active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(d._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Vô hiệu hóa
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(d._id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Kích hoạt lại
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setAssignTarget(d); setAssignForm({ userIds: "", perUserLimit: 1 }); setAssignOpen(true); }}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            Gán người dùng
                          </Button>
                          {!d.isPublic && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPublic(d._id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Đặt công khai
                            </Button>
                          )}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Tạo mã giảm giá</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-gray-600 hover:text-gray-900">Hủy</Button>
              <Button onClick={handleCreate} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">Tạo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Gán người dùng cho mã {assignTarget?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Danh sách User ID (phân tách bởi dấu phẩy, khoảng trắng hoặc dấu chấm phẩy)</Label>
              <Textarea
                value={assignForm.userIds}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAssignForm({ ...assignForm, userIds: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Số lần dùng tối đa mỗi người (0 = không giới hạn)</Label>
                <Input
                  type="number"
                  value={assignForm.perUserLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignForm({ ...assignForm, perUserLimit: Number(e.target.value) })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label>Từ ngày (tùy chọn)</Label>
                <Input
                  type="datetime-local"
                  value={assignForm.effectiveFrom || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Đến ngày (tùy chọn)</Label>
                <Input
                  type="datetime-local"
                  value={assignForm.effectiveTo || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignForm({ ...assignForm, effectiveTo: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAssignOpen(false)} className="text-gray-600 hover:text-gray-900">Hủy</Button>
              <Button onClick={handleAssign} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">Gán</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


