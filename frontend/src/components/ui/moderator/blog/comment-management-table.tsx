"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/common/table"
import { Badge } from "@/components/ui/common/badge"
import { Button } from "@/components/ui/common/button"
import { MessageSquare, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react"

export function CommentManagementTable() {
  const [comments] = useState([
    {
      id: 1,
      content: "Bài viết rất hay và hữu ích! Cảm ơn tác giả đã chia sẻ.",
      author: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      postTitle: "Hướng dẫn sử dụng RetroTrade",
      status: "approved",
      createdAt: "2024-01-20",
      likes: 5,
    },
    {
      id: 2,
      content: "Tôi có một số thắc mắc về phần này, bạn có thể giải thích rõ hơn không?",
      author: "Trần Thị B",
      email: "tranthib@email.com",
      postTitle: "Cách bán sản phẩm hiệu quả",
      status: "pending",
      createdAt: "2024-01-19",
      likes: 2,
    },
    {
      id: 3,
      content: "Spam comment không liên quan đến nội dung bài viết",
      author: "Spam User",
      email: "spam@email.com",
      postTitle: "Tin tức công nghệ mới nhất",
      status: "rejected",
      createdAt: "2024-01-18",
      likes: 0,
    },
    {
      id: 4,
      content: "Rất thích cách trình bày của bài viết này!",
      author: "Lê Văn C",
      email: "levanc@email.com",
      postTitle: "Hướng dẫn sử dụng RetroTrade",
      status: "approved",
      createdAt: "2024-01-17",
      likes: 8,
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Đã duyệt</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Từ chối</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không xác định</Badge>
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5" />
          Quản lý bình luận
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Nội dung</TableHead>
                <TableHead className="text-white/70">Tác giả</TableHead>
                <TableHead className="text-white/70">Email</TableHead>
                <TableHead className="text-white/70">Bài viết</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Likes</TableHead>
                <TableHead className="text-white/70">Ngày tạo</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id} className="border-white/20">
                  <TableCell className="text-white/70 max-w-xs">
                    <div className="truncate" title={comment.content}>
                      {comment.content}
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-medium">{comment.author}</TableCell>
                  <TableCell className="text-white/70">{comment.email}</TableCell>
                  <TableCell className="text-white/70 max-w-xs truncate">{comment.postTitle}</TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell className="text-white/70">{comment.likes}</TableCell>
                  <TableCell className="text-white/70">{comment.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {comment.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
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
