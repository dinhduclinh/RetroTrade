"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderOpen, MessageSquare, Eye } from "lucide-react"

export function BlogStats() {
  const stats = [
    {
      title: "Tổng bài viết",
      value: "156",
      change: "+8%",
      icon: FileText,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Danh mục",
      value: "12",
      change: "+2%",
      icon: FolderOpen,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      title: "Bình luận",
      value: "1,234",
      change: "+15%",
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Lượt xem",
      value: "45,678",
      change: "+22%",
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-white/70">
                <span className="text-emerald-400">{stat.change}</span> so với tháng trước
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
