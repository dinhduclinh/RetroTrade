"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Eye, Ban, CheckCircle } from "lucide-react"

export function UserManagementTable() {
  const [users] = useState([
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      role: "user",
      status: "active",
      joinDate: "2024-01-15",
      lastLogin: "2024-01-20",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tranthib@email.com",
      role: "user",
      status: "pending",
      joinDate: "2024-01-18",
      lastLogin: "2024-01-19",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "levanc@email.com",
      role: "user",
      status: "banned",
      joinDate: "2024-01-10",
      lastLogin: "2024-01-12",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoạt động</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>
      case "banned":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bị cấm</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Không xác định</Badge>
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          Quản lý người dùng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Tên</TableHead>
                <TableHead className="text-white/70">Email</TableHead>
                <TableHead className="text-white/70">Vai trò</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Ngày tham gia</TableHead>
                <TableHead className="text-white/70">Đăng nhập cuối</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-white/20">
                  <TableCell className="text-white font-medium">{user.name}</TableCell>
                  <TableCell className="text-white/70">{user.email}</TableCell>
                  <TableCell className="text-white/70 capitalize">{user.role}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-white/70">{user.joinDate}</TableCell>
                  <TableCell className="text-white/70">{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {user.status === "active" && (
                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10">
                          <Ban className="w-4 h-4" />
                        </Button>
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