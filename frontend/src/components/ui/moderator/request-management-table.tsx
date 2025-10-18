"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/common/table"
import { Badge } from "@/components/ui/common/badge"
import { Button } from "@/components/ui/common/button"
import { FileText, Check, X, Eye } from "lucide-react"

export function RequestManagementTable() {
  const [requests] = useState([
    {
      id: 1,
      title: "Yêu cầu đăng bài sản phẩm",
      user: "Nguyễn Văn A",
      type: "product",
      status: "pending",
      submittedAt: "2024-01-20",
      priority: "medium",
    },
    {
      id: 2,
      title: "Yêu cầu đăng bài blog",
      user: "Trần Thị B",
      type: "blog",
      status: "pending",
      submittedAt: "2024-01-19",
      priority: "high",
    },
    {
      id: 3,
      title: "Yêu cầu chỉnh sửa thông tin",
      user: "Lê Văn C",
      type: "profile",
      status: "approved",
      submittedAt: "2024-01-18",
      priority: "low",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đã duyệt</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Từ chối</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không xác định</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cao</Badge>
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Trung bình</Badge>
      case "low":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Thấp</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không xác định</Badge>
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5" />
          Yêu cầu kiểm duyệt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Tiêu đề</TableHead>
                <TableHead className="text-white/70">Người gửi</TableHead>
                <TableHead className="text-white/70">Loại</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Độ ưu tiên</TableHead>
                <TableHead className="text-white/70">Ngày gửi</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="border-white/20">
                  <TableCell className="text-white font-medium">{request.title}</TableCell>
                  <TableCell className="text-white/70">{request.user}</TableCell>
                  <TableCell className="text-white/70 capitalize">{request.type}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell className="text-white/70">{request.submittedAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
