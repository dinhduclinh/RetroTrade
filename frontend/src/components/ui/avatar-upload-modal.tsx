"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Camera, Link } from "lucide-react"
import { toast } from "sonner"
import { uploadUserAvatar, updateUserAvatar } from "@/services/auth/user.api"
import type { UserProfile } from "@iService"

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: UserProfile
  onAvatarUpdated: (newAvatarUrl: string) => void
}

export function AvatarUploadModal({ isOpen, onClose, userProfile, onAvatarUpdated }: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Vui lòng chọn file ảnh")
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File ảnh không được vượt quá 5MB")
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setActiveTab("upload") // Tự động chuyển sang tab upload khi chọn file
    }
  }

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value
    setAvatarUrl(url)
    
    // Preview URL nếu hợp lệ
    if (url.trim() && (url.startsWith('http://') || url.startsWith('https://'))) {
      setPreviewUrl(url)
    } else if (url.trim() === '') {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (activeTab === "upload" && selectedFile) {
      setIsUploading(true)
      try {
        const response = await uploadUserAvatar(selectedFile)
        if (response.code === 200) {
          toast.success("Cập nhật avatar thành công!")
          onAvatarUpdated(response.data.avatarUrl)
          onClose()
        } else {
          toast.error(response.message || "Có lỗi xảy ra khi upload avatar")
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast.error("Có lỗi xảy ra khi upload avatar")
      } finally {
        setIsUploading(false)
      }
    } else if (activeTab === "url" && avatarUrl.trim()) {
      setIsUploading(true)
      try {
        const response = await updateUserAvatar({ avatarUrl: avatarUrl.trim() })
        if (response.code === 200) {
          toast.success("Cập nhật avatar thành công!")
          onAvatarUpdated(response.data.avatarUrl)
          onClose()
        } else {
          toast.error(response.message || "Có lỗi xảy ra khi cập nhật avatar")
        }
      } catch (error) {
        console.error("Update error:", error)
        toast.error("Có lỗi xảy ra khi cập nhật avatar")
      } finally {
        setIsUploading(false)
      }
    } else {
      toast.error("Vui lòng chọn file ảnh hoặc nhập URL")
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAvatarUrl("")
    setIsUploading(false)
    setActiveTab("upload")
    onClose()
  }

  const currentPreview = previewUrl || avatarUrl || userProfile.avatarUrl

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật avatar</DialogTitle>
          <DialogDescription>
            Chọn ảnh từ máy tính hoặc nhập URL ảnh để cập nhật avatar của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-gray-200">
                <AvatarImage src={currentPreview} alt="Avatar preview" />
                <AvatarFallback className="text-3xl">
                  {userProfile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {currentPreview && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Preview info */}
          {currentPreview && (
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">
                ✓ Preview avatar thành công
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Camera className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "url"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Link className="w-4 h-4" />
              URL
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Chọn file ảnh</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hỗ trợ: JPG, PNG, GIF, WEBP. Tối đa 5MB.
                </p>
              </div>
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* URL Tab */}
          {activeTab === "url" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="avatar-url">URL ảnh</Label>
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={handleUrlChange}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập URL ảnh hợp lệ để xem preview
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isUploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={isUploading || (activeTab === "upload" && !selectedFile) || (activeTab === "url" && !avatarUrl.trim())}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Cập nhật
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
