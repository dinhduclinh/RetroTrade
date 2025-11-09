// <DOCUMENT filename="DisputeModal.tsx">
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
  "Vi phạm hợp đồng",
  "Không đúng mô tả",
  "Qúa hạn thuê",
  "Không nhận được hàng",
  "Khác",
];

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

      // === THAY BẰNG API UPLOAD THỰC TẾ CỦA BẠN ===
      try {
        const formData = new FormData();
        formData.append("file", file);
        // Ví dụ: dùng Cloudinary
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload?upload_preset=YOUR_PRESET`,
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

    await onSubmit({
      reason,
      description,
      evidenceUrls: urls,
    });

    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-red-600 text-lg font-semibold">
            Báo cáo tranh chấp đơn hàng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lý do */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do tranh chấp <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="">— Chọn lý do —</option>
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Mô tả rõ ràng vấn đề..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-28 border rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-500"
            />
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
                id={`evidence-${orderId}`}
                disabled={uploading || files.length >= 5}
              />
              <label
                htmlFor={`evidence-${orderId}`}
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
              >
                {uploading ? "Đang tải..." : "Nhấn để tải lên ảnh"}
              </label>

              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Bằng chứng ${i + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition"
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
          <Button variant="outline" onClick={() => handleClose(false)}>
            Hủy
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSubmit}
            disabled={uploading || !reason || !description.trim()}
          >
            {uploading ? "Đang xử lý..." : "Gửi tranh chấp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
