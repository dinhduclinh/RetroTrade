"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Users, FileText, Shield, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

export function ModeratorStats() {
  const stats = [
    {
      title: "Tổng người dùng",
      value: "1,234",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      description: "Tăng trưởng so với tháng trước"
    },
    {
      title: "Yêu cầu chờ duyệt",
      value: "56",
      change: "+8%",
      changeType: "positive" as const,
      icon: FileText,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      description: "Cần xem xét và phê duyệt"
    },
    {
      title: "Tài khoản xác thực",
      value: "892",
      change: "+15%",
      changeType: "positive" as const,
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      description: "Đã xác thực thành công"
    },
    {
      title: "Báo cáo vi phạm",
      value: "23",
      change: "-5%",
      changeType: "negative" as const,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      description: "Giảm so với tháng trước"
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 animate-stagger">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const TrendIcon = stat.changeType === "positive" ? TrendingUp : TrendingDown
        
        return (
          <Card 
            key={index} 
            className={`
              bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 
              transition-all duration-300 hover:scale-105 hover:shadow-xl
              group cursor-pointer relative overflow-hidden hover-lift
              ${stat.borderColor}
            `}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-white/80 group-hover:text-white transition-colors duration-200">
                  {stat.title}
                </CardTitle>
                <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">
                  {stat.description}
                </p>
              </div>
              <div className={`
                p-3 rounded-xl transition-all duration-300 group-hover:scale-110
                ${stat.bgColor} group-hover:bg-white/20
              `}>
                <Icon className={`w-5 h-5 ${stat.color} group-hover:text-white transition-colors duration-200`} />
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white group-hover:text-white transition-colors duration-200">
                  {stat.value}
                </div>
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${stat.changeType === "positive" 
                    ? "bg-green-500/20 text-green-400 group-hover:bg-green-500/30" 
                    : "bg-red-500/20 text-red-400 group-hover:bg-red-500/30"
                  }
                  transition-all duration-200
                `}>
                  <TrendIcon className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`
                    h-full rounded-full transition-all duration-1000 ease-out
                    ${stat.changeType === "positive" 
                      ? "bg-gradient-to-r from-green-400 to-green-500" 
                      : "bg-gradient-to-r from-red-400 to-red-500"
                    }
                  `}
                  style={{ 
                    width: `${Math.min(100, Math.abs(parseInt(stat.change)) * 5)}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
