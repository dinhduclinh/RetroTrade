"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"

interface UserProfile {
  _id: string;
  userGuid: string;
  email: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  isEmailConfirmed: boolean;
  isPhoneConfirmed: boolean;
  isIdVerified: boolean;
  reputationScore: number;
  points: number;
  role: string;
  wallet: {
    currency: string;
    balance: number;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DetailedInfoCardProps {
  userProfile: UserProfile;
}

export function DetailedInfoCard({ userProfile }: DetailedInfoCardProps) {
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

            {userProfile.phone && (
              <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                <label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Số điện thoại
                </label>
                <p className="text-gray-900 font-medium">{userProfile.phone}</p>
              </div>
            )}
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
}
