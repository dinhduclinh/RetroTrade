"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"
import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { toast } from "sonner"
import { updateUserProfile } from "@/services/auth/user.api"
import type { UserProfile } from "@iService"

interface DetailedInfoCardProps {
  userProfile: UserProfile;
}

export type DetailedInfoCardHandle = {
  openPhoneEditor: () => void
}

export const DetailedInfoCard = forwardRef<DetailedInfoCardHandle, DetailedInfoCardProps>(function DetailedInfoCard({ userProfile }: DetailedInfoCardProps, ref) {
  const [localPhone, setLocalPhone] = useState<string | undefined>(userProfile.phone)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const phoneSectionRef = useRef<HTMLDivElement | null>(null)

  const handleEditPhone = async () => {
    const newPhone = window.prompt("Nhập số điện thoại mới (để trống để xóa):", localPhone || "")
    if (newPhone === null) return
    if (newPhone === localPhone) return
    const confirmMsg = newPhone
      ? `Xác nhận cập nhật số điện thoại thành ${newPhone}? Hệ thống sẽ đặt lại trạng thái xác thực số điện thoại.`
      : `Xác nhận xóa số điện thoại? Hệ thống sẽ đặt lại trạng thái xác thực số điện thoại.`
    const ok = window.confirm(confirmMsg)
    if (!ok) return

    try {
      setIsSubmitting(true)
      const payload = { phone: newPhone ? newPhone : null }
      const res = await updateUserProfile(payload)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // FE-only change: set phone and mark phone confirmed false
      setLocalPhone(newPhone || undefined)
      ;(userProfile as unknown as { phone?: string; isPhoneConfirmed: boolean }).phone = newPhone || undefined
      ;(userProfile as unknown as { phone?: string; isPhoneConfirmed: boolean }).isPhoneConfirmed = false
      toast.success("Cập nhật số điện thoại thành công. Trạng thái xác thực đã đặt lại.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật số điện thoại")
    } finally {
      setIsSubmitting(false)
    }
  }

  useImperativeHandle(ref, () => ({
    openPhoneEditor: () => {
      if (phoneSectionRef.current) {
        phoneSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      // Slight delay to ensure scroll finishes before prompt appears
      setTimeout(() => {
        void handleEditPhone()
      }, 200)
    }
  }))
  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl group overflow-hidden relative h-full">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          Thông tin chi tiết
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
              <label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Họ và tên
              </label>
              <p className="text-gray-900 font-medium">{userProfile.fullName}</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
              <label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-gray-900 font-medium">{userProfile.email}</p>
            </div>

            <div ref={phoneSectionRef} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Số điện thoại
                </label>
                <button
                  type="button"
                  onClick={handleEditPhone}
                  disabled={isSubmitting}
                  className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                >
                  {localPhone ? "Chỉnh sửa" : "Thêm"}
                </button>
              </div>
              <p className="text-gray-900 font-medium">{localPhone || "—"}</p>
              {!localPhone && (
                <p className="text-xs text-gray-500 mt-1">Bạn có thể bỏ trống số điện thoại.</p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
              <label className="text-sm text-gray-500 block mb-2">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{userProfile.userGuid}</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
              <label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Cập nhật lần cuối
              </label>
              <p className="text-gray-900 text-sm">
                {new Date(userProfile.updatedAt).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
              <label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Trạng thái
              </label>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600">
                Hoạt động
              </Badge>
            </div>
          </div>
        </div>
        
        {userProfile.bio && (
          <div className="pt-6 border-t border-gray-200">
            <label className="text-sm text-gray-500 block mb-2">Giới thiệu</label>
            <p className="text-gray-900">{userProfile.bio}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
