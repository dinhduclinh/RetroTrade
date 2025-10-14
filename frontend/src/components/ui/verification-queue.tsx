"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle, XCircle, Clock } from "lucide-react"

export function VerificationQueue() {
  const [verifications] = useState([
    {
      id: 1,
      user: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      documentType: "CCCD",
      documentNumber: "123456789",
      status: "pending",
      submittedAt: "2024-01-20",
      verifiedAt: null,
    },
    {
      id: 2,
      user: "Trần Thị B",
      email: "tranthib@email.com",
      documentType: "Passport",
      documentNumber: "A1234567",
      status: "verified",
      submittedAt: "2024-01-19",
      verifiedAt: "2024-01-19",
    },
    {
      id: 3,
      user: "Lê Văn C",
      email: "levanc@email.com",
      documentType: "CCCD",
      documentNumber: "987654321",
      status: "rejected",
      submittedAt: "2024-01-18",
      verifiedAt: "2024-01-18",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ xác thực</Badge>
      case "verified":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đã xác thực</Badge>
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
          <Shield className="w-5 h-5" />
          Hàng đợi xác thực
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Người dùng</TableHead>
                <TableHead className="text-white/70">Email</TableHead>
                <TableHead className="text-white/70">Loại giấy tờ</TableHead>
                <TableHead className="text-white/70">Số giấy tờ</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Ngày gửi</TableHead>
                <TableHead className="text-white/70">Ngày xác thực</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((verification) => (
                <TableRow key={verification.id} className="border-white/20">
                  <TableCell className="text-white font-medium">{verification.user}</TableCell>
                  <TableCell className="text-white/70">{verification.email}</TableCell>
                  <TableCell className="text-white/70">{verification.documentType}</TableCell>
                  <TableCell className="text-white/70">{verification.documentNumber}</TableCell>
                  <TableCell>{getStatusBadge(verification.status)}</TableCell>
                  <TableCell className="text-white/70">{verification.submittedAt}</TableCell>
                  <TableCell className="text-white/70">{verification.verifiedAt || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {verification.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {verification.status === "verified" && (
                        <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10">
                          <Clock className="w-4 h-4" />
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