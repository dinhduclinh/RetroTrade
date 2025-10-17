"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FolderOpen, Edit, Trash2, Plus, FileText } from "lucide-react"

export function CategoryManagementTable() {
  const [categories] = useState([
    {
      id: 1,
      name: "Hướng dẫn",
      slug: "huong-dan",
      description: "Các bài hướng dẫn sử dụng hệ thống",
      postCount: 25,
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Tips & Tricks",
      slug: "tips-tricks",
      description: "Mẹo và thủ thuật hữu ích",
      postCount: 18,
      status: "active",
      createdAt: "2024-01-10",
    },
    {
      id: 3,
      name: "Tin tức",
      slug: "tin-tuc",
      description: "Tin tức công nghệ và cập nhật",
      postCount: 42,
      status: "active",
      createdAt: "2024-01-05",
    },
    {
      id: 4,
      name: "Tạm ngưng",
      slug: "tam-ngung",
      description: "Danh mục tạm ngưng hoạt động",
      postCount: 0,
      status: "inactive",
      createdAt: "2024-01-01",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Hoạt động</Badge>
      case "inactive":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Tạm ngưng</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không xác định</Badge>
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <FolderOpen className="w-5 h-5" />
            Quản lý danh mục
          </CardTitle>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Thêm danh mục
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Tên danh mục</TableHead>
                <TableHead className="text-white/70">Slug</TableHead>
                <TableHead className="text-white/70">Mô tả</TableHead>
                <TableHead className="text-white/70">Số bài viết</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Ngày tạo</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="border-white/20">
                  <TableCell className="text-white font-medium">{category.name}</TableCell>
                  <TableCell className="text-white/70 font-mono text-sm">{category.slug}</TableCell>
                  <TableCell className="text-white/70 max-w-xs truncate">{category.description}</TableCell>
                  <TableCell className="text-white/70">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {category.postCount}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(category.status)}</TableCell>
                  <TableCell className="text-white/70">{category.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10">
                        <Edit className="w-4 h-4" />
                      </Button>
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
