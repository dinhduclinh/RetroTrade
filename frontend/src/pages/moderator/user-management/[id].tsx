"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ModeratorSidebar } from "@/components/ui/moderator-sidebar"
import { ModeratorHeader } from "@/components/ui/moderator-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, Calendar, Shield, Star, Coins, Wallet } from "lucide-react"
import { getUserById } from "@/services/auth/user.api"
import type { UserProfile, ApiResponse } from "@iService"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!id || typeof id !== 'string') return
      
      try {
        setLoading(true)
        setError(null)
        
        const response: ApiResponse<UserProfile> = await getUserById(id)
        
        if (response.code === 200 && response.data) {
          setUser(response.data)
        } else {
          setError(response.message || 'Không thể tải thông tin người dùng')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Đã xảy ra lỗi khi tải thông tin người dùng')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  const handleTabChange = (tab: "dashboard" | "users" | "requests" | "verification" | "blog") => {
    console.log("User profile page - handleTabChange called with:", tab)
    
    // Navigate to the main moderator page with the selected tab
    if (tab === "users") {
      // If clicking on users, go back to user management list
      router.push('/moderator/user-management')
    } else {
      // For other tabs, go to main moderator page with query parameter
      router.push(`/moderator?tab=${tab}`)
    }
  }

  const handleBack = () => {
    router.push('/moderator/user-management')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500'
      case 'moderator':
        return 'bg-blue-500'
      case 'user':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Quản trị viên'
      case 'moderator':
        return 'Điều hành viên'
      case 'user':
        return 'Người dùng'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Lỗi</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-gray-500 text-xl mb-4">👤</div>
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy người dùng</h3>
              <p className="text-gray-600 mb-4">Người dùng với ID này không tồn tại</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.2),rgba(255,255,255,0))] animate-pulse" />
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex">
        <ModeratorSidebar 
          activeTab="users" 
          onTabChange={handleTabChange}
        />

        <div className="flex-1 lg:ml-72">
          <ModeratorHeader />

          <main className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-6">
              <Button 
                onClick={handleBack} 
                variant="ghost" 
                className="text-white hover:bg-white/10 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách người dùng
              </Button>
              
              <h2 className="text-2xl font-bold text-white mb-2">Thông tin người dùng</h2>
              <p className="text-white/70">Chi tiết thông tin và trạng thái tài khoản</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Avatar className="w-24 h-24 mx-auto mb-4">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback className="text-lg">
                          {user.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {user.displayName || user.fullName}
                      </h3>
                      
                      <Badge className={`${getRoleBadgeColor(user.role)} text-white mb-4`}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      
                      <div className="space-y-2 text-sm text-white/70">
                        <div className="flex items-center justify-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center justify-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Details Card */}
              <div className="lg:col-span-2">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Thông tin cơ bản</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-white/70">Họ và tên</label>
                          <p className="text-white font-medium">{user.fullName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-white/70">Tên hiển thị</label>
                          <p className="text-white font-medium">{user.displayName || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-white/70">Email</label>
                          <p className="text-white font-medium">{user.email}</p>
                        </div>
                        <div>
                          <label className="text-sm text-white/70">Số điện thoại</label>
                          <p className="text-white font-medium">{user.phone || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                      {user.bio && (
                        <div className="mt-4">
                          <label className="text-sm text-white/70">Giới thiệu</label>
                          <p className="text-white font-medium">{user.bio}</p>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-white/20 w-full" />

                    {/* Status */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Trạng thái xác thực</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-white/70" />
                          <span className="text-white/70 mr-2">Email:</span>
                          <Badge variant={user.isEmailConfirmed ? "default" : "secondary"}>
                            {user.isEmailConfirmed ? "Đã xác thực" : "Chưa xác thực"}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 mr-2 text-white/70" />
                          <span className="text-white/70 mr-2">SĐT:</span>
                          <Badge variant={user.isPhoneConfirmed ? "default" : "secondary"}>
                            {user.isPhoneConfirmed ? "Đã xác thực" : "Chưa xác thực"}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-white/70" />
                          <span className="text-white/70 mr-2">ID:</span>
                          <Badge variant={user.isIdVerified ? "default" : "secondary"}>
                            {user.isIdVerified ? "Đã xác thực" : "Chưa xác thực"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/20 w-full" />

                    {/* Stats */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Thống kê</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <Star className="w-5 h-5 mr-2 text-yellow-400" />
                          <span className="text-white/70 mr-2">Điểm uy tín:</span>
                          <span className="text-white font-medium">{user.reputationScore}</span>
                        </div>
                        <div className="flex items-center">
                          <Coins className="w-5 h-5 mr-2 text-green-400" />
                          <span className="text-white/70 mr-2">Điểm:</span>
                          <span className="text-white font-medium">{user.points}</span>
                        </div>
                        {user.wallet && (
                          <div className="flex items-center">
                            <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                            <span className="text-white/70 mr-2">Số dư:</span>
                            <span className="text-white font-medium">
                              {user.wallet.balance.toLocaleString()} {user.wallet.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-white/20 w-full" />

                    {/* Dates */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Thông tin thời gian</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-white/70" />
                          <div>
                            <label className="text-sm text-white/70">Ngày tạo</label>
                            <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-white/70" />
                          <div>
                            <label className="text-sm text-white/70">Cập nhật lần cuối</label>
                            <p className="text-white font-medium">{formatDate(user.updatedAt)}</p>
                          </div>
                        </div>
                        {user.lastLoginAt && (
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-white/70" />
                            <div>
                              <label className="text-sm text-white/70">Đăng nhập lần cuối</label>
                              <p className="text-white font-medium">{formatDate(user.lastLoginAt)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
