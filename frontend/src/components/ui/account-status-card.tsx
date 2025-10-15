"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, User, CheckCircle2, AlertCircle } from "lucide-react"
import type { UserProfile } from "@iService"

interface AccountStatusCardProps {
  userProfile: UserProfile;
}

export function AccountStatusCard({ userProfile }: AccountStatusCardProps) {
  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl group overflow-hidden relative">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          Trạng thái tài khoản
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 group/item">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium">Email</span>
          </div>
          <Badge className={`${userProfile.isEmailConfirmed 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600' 
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          } transition-all duration-300 flex items-center gap-1`}>
            {userProfile.isEmailConfirmed ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Xác thực
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Chưa xác thực
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 group/item">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Phone className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium">Số điện thoại</span>
          </div>
          <Badge className={`${userProfile.isPhoneConfirmed 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600' 
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          } transition-all duration-300 flex items-center gap-1`}>
            {userProfile.isPhoneConfirmed ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Xác thực
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Chưa xác thực
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 group/item">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <User className="w-4 h-4 text-pink-600" />
            </div>
            <span className="text-sm font-medium">Danh tính</span>
          </div>
          <Badge className={`${userProfile.isIdVerified 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600' 
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          } transition-all duration-300 flex items-center gap-1`}>
            {userProfile.isIdVerified ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Xác thực
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Chưa xác thực
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
