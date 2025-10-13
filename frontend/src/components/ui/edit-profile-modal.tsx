"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
import { updateUserProfile } from "@/services/auth/user.api"
import { toast } from "sonner"
import type { UserProfile } from "@iService"

interface EditProfileModalProps {
  userProfile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
}

export function EditProfileModal({ userProfile, open, onOpenChange, onProfileUpdate }: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: userProfile.fullName,
    displayName: userProfile.displayName || userProfile.fullName,
    bio: userProfile.bio || "",
    phone: userProfile.phone || "",
  })

  // Update form when userProfile changes
  useEffect(() => {
    setFormData({
      fullName: userProfile.fullName,
      displayName: userProfile.displayName || userProfile.fullName,
      bio: userProfile.bio || "",
      phone: userProfile.phone || "",
    });
  }, [userProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true)
    try {
      const payload = {
        fullName: formData.fullName,
        displayName: formData.displayName,
        bio: formData.bio || undefined,
        phone: formData.phone || undefined,
      };
      
      const response = await updateUserProfile(payload);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (result.code === 200) {
        // Update local state
        const updatedProfile = { ...userProfile, ...payload };
        onProfileUpdate?.(updatedProfile);
        toast.success("Cập nhật hồ sơ thành công!");
        onOpenChange(false);
      } else {
        toast.error(result.message || "Cập nhật hồ sơ thất bại");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật hồ sơ");
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Họ và tên
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
              Tên hiển thị
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Nhập tên hiển thị"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
              Bio
            </Label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Viết vài dòng về bản thân..."
              className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={160}
            />
            <p className="text-xs text-gray-500">
              {formData.bio.length}/160 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Số điện thoại
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="0123456789"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Số điện thoại để liên hệ (10-11 chữ số).
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}