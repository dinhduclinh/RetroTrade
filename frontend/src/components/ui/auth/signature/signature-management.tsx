"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/common/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/common/dialog";
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSignature,
  saveSignature,
  deleteSignature,
} from "@/services/auth/auth.api";
import SignaturePad from "./signature-pad";

interface SignatureManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string | null) => void;
}

export function SignatureManagement({
  isOpen,
  onClose,
  onSuccess,
}: SignatureManagementProps) {
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm modal
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pendingSignatureUrl, setPendingSignatureUrl] = useState<string | null>(
    null
  );

  // Fetch chữ ký hiện tại khi mở modal
  useEffect(() => {
    if (isOpen) {
      fetchCurrentSignature();
    }
  }, [isOpen]);

  const fetchCurrentSignature = async () => {
    try {
      setIsLoading(true);
      const response = await getSignature();
      if (response.ok) {
        const data = await response.json();
        setCurrentSignatureUrl(data.signatureUrl || null);
      } else {
        setCurrentSignatureUrl(null);
      }
    } catch (error) {
      console.error("Error fetching signature:", error);
      toast.error("Không thể tải chữ ký hiện tại");
      setCurrentSignatureUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSignature = (newUrl: string) => {
    setPendingSignatureUrl(newUrl);
    setShowConfirmSave(true);
  };

  // XÁC NHẬN LƯU
  const confirmSaveSignature = async () => {
    if (!pendingSignatureUrl) return;

    try {
      setIsSaving(true);
      const response = await saveSignature(pendingSignatureUrl);
      if (response.ok) {
        const data = await response.json();
        setCurrentSignatureUrl(data.signatureUrl);
        toast.success("Chữ ký số đã được cập nhật thành công!");
        onSuccess(data.signatureUrl);
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("[DEBUG] Save error:", error);
      toast.error("Lỗi khi cập nhật chữ ký: " + (error as Error).message);
    } finally {
      setIsSaving(false);
      setPendingSignatureUrl(null);
      setShowConfirmSave(false);
    }
  };

  const cancelSaveSignature = () => {
    setPendingSignatureUrl(null);
    setShowConfirmSave(false);
  };

  const handleDeleteSignature = () => {
    setShowConfirmDelete(true);
  };

  const confirmDeleteSignature = async () => {
    try {
      const response = await deleteSignature();
      if (response.ok) {
        setCurrentSignatureUrl(null);
        toast.success("Chữ ký số đã được xóa!");
        onSuccess(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Xóa thất bại");
      }
    } catch (error) {
      console.error("[DEBUG] Delete error:", error);
      toast.error("Lỗi khi xóa chữ ký: " + (error as Error).message);
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const cancelDeleteSignature = () => {
    setShowConfirmDelete(false);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tải chữ ký...</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p>Đang tải chữ ký hiện tại...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Main Signature Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentSignatureUrl ? "Cập nhật chữ ký số" : "Tạo chữ ký số"}
            </DialogTitle>
            <DialogDescription>
              Vẽ chữ ký điện tử của bạn để sử dụng trong hợp đồng và xác minh.
              {currentSignatureUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Chữ ký hiện tại:</p>
                  <Image
                    src={currentSignatureUrl}
                    alt="Chữ ký hiện tại"
                    width={128}
                    height={64}
                    className="border border-gray-300 rounded mb-2 mx-auto block"
                  />
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SignaturePad
              onSave={handleSaveSignature}
              onClear={() => {
                console.log("[DEBUG] Signature cleared");
              }}
              className="mx-auto"
              disabled={showConfirmSave || showConfirmDelete || isSaving}
            />
          </div>
          <DialogFooter>
            {currentSignatureUrl && (
              <Button
                variant="destructive"
                onClick={handleDeleteSignature}
                disabled={isSaving || showConfirmSave}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa chữ ký hiện tại
              </Button>
            )}
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Save Modal*/}
      <Dialog
        open={showConfirmSave && !isSaving}
        onOpenChange={setShowConfirmSave}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận cập nhật chữ ký</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn cập nhật chữ ký số này?
              {pendingSignatureUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">
                    Preview chữ ký mới:
                  </p>
                  <Image
                    src={pendingSignatureUrl}
                    alt="Preview chữ ký mới"
                    width={128}
                    height={64}
                    className="border border-gray-300 rounded mb-2 mx-auto block"
                  />
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelSaveSignature}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmSaveSignature}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                "Đang cập nhật..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Xác nhận cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Xác nhận xóa chữ ký</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa chữ ký số hiện tại? Thao tác này sẽ xóa
              vĩnh viễn và bạn sẽ cần tạo lại chữ ký mới.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteSignature}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSignature}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
