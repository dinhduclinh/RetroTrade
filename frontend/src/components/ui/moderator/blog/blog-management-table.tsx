"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/common/table"
import { Badge } from "@/components/ui/common/badge"
import { Button } from "@/components/ui/common/button"
import { FileText, Edit, Trash2, Eye, Calendar, MessageSquare } from "lucide-react"

export function BlogManagementTable() {
  const [posts] = useState([
    {
      id: 1,
      title: "Hướng dẫn sử dụng RetroTrade",
      author: "Admin",
      category: "Hướng dẫn",
      status: "published",
      views: 1234,
      comments: 56,
      createdAt: "2024-01-20",
      updatedAt: "2024-01-20",
    },
    {
      id: 2,
      title: "Cách bán sản phẩm hiệu quả",
      author: "Moderator",
      category: "Tips & Tricks",
      status: "draft",
      views: 0,
      comments: 0,
      createdAt: "2024-01-19",
      updatedAt: "2024-01-19",
    },
    {
      id: 3,
      title: "Tin tức công nghệ mới nhất",
      author: "Editor",
      category: "Tin tức",
      status: "published",
      views: 2341,
      comments: 89,
      createdAt: "2024-01-18",
      updatedAt: "2024-01-18",
    },
    {
      id: 4,
      title: "Bài viết chờ duyệt",
      author: "User",
      category: "Khác",
      status: "pending",
      views: 0,
      comments: 0,
      createdAt: "2024-01-17",
      updatedAt: "2024-01-17",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Đã xuất bản</Badge>
      case "draft":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Bản nháp</Badge>
      case "pending":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Chờ duyệt</Badge>
      case "archived":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Lưu trữ</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không xác định</Badge>
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5" />
          Quản lý Blog
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Tiêu đề</TableHead>
                <TableHead className="text-white/70">Tác giả</TableHead>
                <TableHead className="text-white/70">Danh mục</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Lượt xem</TableHead>
                <TableHead className="text-white/70">Bình luận</TableHead>
                <TableHead className="text-white/70">Ngày tạo</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} className="border-white/20">
                  <TableCell className="text-white font-medium max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell className="text-white/70">{post.author}</TableCell>
                  <TableCell className="text-white/70">{post.category}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell className="text-white/70">{post.views.toLocaleString()}</TableCell>
                  <TableCell className="text-white/70">{post.comments}</TableCell>
                  <TableCell className="text-white/70">{post.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {post.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
