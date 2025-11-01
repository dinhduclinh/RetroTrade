"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/common/table"
import { Badge } from "@/components/ui/common/badge"
import { Button } from "@/components/ui/common/button"
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
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Chờ xác thực</Badge>
      case "verified":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Đã xác thực</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Từ chối</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Không xác định</Badge>
    }
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Shield className="w-5 h-5" />
          Hàng đợi xác thực
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Người dùng</TableHead>
                <TableHead className="text-gray-600">Email</TableHead>
                <TableHead className="text-gray-600">Loại giấy tờ</TableHead>
                <TableHead className="text-gray-600">Số giấy tờ</TableHead>
                <TableHead className="text-gray-600">Trạng thái</TableHead>
                <TableHead className="text-gray-600">Ngày gửi</TableHead>
                <TableHead className="text-gray-600">Ngày xác thực</TableHead>
                <TableHead className="text-gray-600">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((verification) => (
                <TableRow key={verification.id} className="border-gray-200">
                  <TableCell className="text-gray-900 font-medium">{verification.user}</TableCell>
                  <TableCell className="text-gray-600">{verification.email}</TableCell>
                  <TableCell className="text-gray-600">{verification.documentType}</TableCell>
                  <TableCell className="text-gray-600">{verification.documentNumber}</TableCell>
                  <TableCell>{getStatusBadge(verification.status)}</TableCell>
                  <TableCell className="text-gray-600">{verification.submittedAt}</TableCell>
                  <TableCell className="text-gray-600">{verification.verifiedAt || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {verification.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {verification.status === "verified" && (
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50">
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
