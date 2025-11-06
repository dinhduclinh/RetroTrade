"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/common/dialog";
import { Button } from "@/components/ui/common/button";
import { toast } from "sonner";
import { Eye, AlertCircle } from "lucide-react";

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onSubmit: (data: {
    reason: string;
    description: string;
    evidenceUrls: string[];
  }) => Promise<void>;
}

const REASON_OPTIONS = [
  "Hàng không đúng mô tả",
  "Hàng bị hư hỏng / mất linh kiện",
  "Không nhận được hàng",
  "Giao hàng trễ / sai địa chỉ",
  "Người thuê không trả đúng hạn",
  "Chủ nhà từ chối nhận lại hàng",
  "Khác (mô tả chi tiết bên dưới)",
] as const;

export default function DisputeModal({
  open,
  onOpenChange,
  orderId,
  onSubmit,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputId = `evidence-upload-${orderId || Math.random().toString(36)}`;

  const resetForm = () => {
    setReason("");
    setDescription("");
    setFiles([]);
    setPreviews([]);
    setUrls([]);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles = Array.from(selected).slice(0, 5 - files.length);
    if (newFiles.length === 0) {
      toast.error("Tối đa 5 ảnh.");
      return;
    }

    setUploading(true);
    const newPreviews: string[] = [];
    const newUrls: string[] = [];

    for (const file of newFiles) {
      const preview = URL.createObjectURL(file);
      newPreviews.push(preview);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload?upload_preset=Az9g9-NMll0_bBodQ1I87wkvX7M`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        newUrls.push(data.secure_url);
      } catch {
        toast.error("Lỗi tải ảnh lên");
      }
    }

    setPreviews((p) => [...p, ...newPreviews]);
    setFiles((f) => [...f, ...newFiles]);
    setUrls((u) => [...u, ...newUrls]);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setFiles((f) => f.filter((_, i) => i !== idx));
    setUrls((u) => u.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!reason) return toast.error("Vui lòng chọn lý do.");
    if (!description.trim()) return toast.error("Vui lòng nhập mô tả.");

    setSubmitting(true);
    try {
      await onSubmit({
        reason,
        description,
        evidenceUrls: urls,
      });
      handleClose(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-red-600 text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Báo cáo tranh chấp đơn hàng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Lý do */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do tranh chấp <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">— Chọn lý do —</option>
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {reason === "Khác (mô tả chi tiết bên dưới)" && (
              <p className="text-xs text-amber-600 mt-1 animate-fadeIn">
                Vui lòng mô tả chi tiết trong phần mô tả bên dưới
              </p>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Mô tả rõ ràng vấn đề (tối đa 1000 ký tự)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              className="w-full h-32 border rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {description.length}/1000
            </div>
          </div>

          {/* Bằng chứng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bằng chứng (ảnh){" "}
              <span className="text-gray-500 text-xs">(tối đa 5)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id={inputId}
                disabled={uploading || files.length >= 5}
              />
              <label
                htmlFor={inputId}
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {uploading ? "Đang tải lên..." : "Nhấn để chọn ảnh"}
              </label>

              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer"
                      onClick={() => window.open(src, "_blank")}
                    >
                      <img
                        src={src}
                        alt={`Bằng chứng ${i + 1}`}
                        className="w-full h-20 object-cover rounded border transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center rounded">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-600 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={submitting || uploading}
          >
            Hủy
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSubmit}
            disabled={uploading || submitting || !reason || !description.trim()}
          >
            {uploading || submitting ? "Đang gửi..." : "Gửi tranh chấp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
