"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Shield, Wallet, Settings, ChevronRight, Key } from "lucide-react"

interface QuickActionsCardProps {
  onEditProfile?: () => void;
  onChangePassword?: () => void;
}

export function QuickActionsCard({ onEditProfile, onChangePassword }: QuickActionsCardProps) {
  const actions = [
    { icon: Edit, label: "Chỉnh sửa hồ sơ", color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-600", action: onEditProfile },
    { icon: Key, label: "Đổi mật khẩu", color: "from-green-500/20 to-emerald-500/20", iconColor: "text-green-600", action: onChangePassword },
    {
      icon: Shield,
      label: "Xác thực danh tính",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-600",
    },
    { icon: Wallet, label: "Quản lý ví", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-600" },
    {
      icon: Settings,
      label: "Cài đặt bảo mật",
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={action.action}
            className={`w-full justify-between bg-white border border-gray-200 hover:border-gray-300 text-gray-900 hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-lg group`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg bg-gray-100 ${action.iconColor}`}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="font-medium">{action.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
