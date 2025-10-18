"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { BarChart3, Star, Calendar } from "lucide-react"
import type { UserProfile } from "@iService"

interface StatisticsCardProps {
  userProfile: UserProfile;
}

export function StatisticsCard({ userProfile }: StatisticsCardProps) {
  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl group overflow-hidden relative">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          Thống kê
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-medium">Điểm tích lũy</span>
          </div>
          <span className="text-indigo-600 text-xl font-bold">{userProfile.points}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 rounded-lg bg-green-500/20">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium">Đánh giá</span>
          </div>
          <span className="text-green-600 text-xl font-bold">{userProfile.reputationScore}/5</span>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium">Ngày tham gia</span>
          </div>
          <span className="text-purple-600 text-sm font-medium">
            {new Date(userProfile.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}