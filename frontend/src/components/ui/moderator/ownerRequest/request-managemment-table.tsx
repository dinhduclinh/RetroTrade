"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/common/table";
import { Badge } from "@/components/ui/common/badge";
import { Button } from "@/components/ui/common/button";
import { FileText, Check, X, Eye } from "lucide-react";

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
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Chờ duyệt
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Đã duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Từ chối
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            Không xác định
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Cao
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Trung bình
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Thấp
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            Không xác định
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <FileText className="w-5 h-5" />
          Yêu cầu kiểm duyệt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Tiêu đề</TableHead>
                <TableHead className="text-gray-600">Người gửi</TableHead>
                <TableHead className="text-gray-600">Loại</TableHead>
                <TableHead className="text-gray-600">Trạng thái</TableHead>
                <TableHead className="text-gray-600">Độ ưu tiên</TableHead>
                <TableHead className="text-gray-600">Ngày gửi</TableHead>
                <TableHead className="text-gray-600">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="border-gray-200">
                  <TableCell className="text-gray-900 font-medium">
                    {request.title}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {request.user}
                  </TableCell>
                  <TableCell className="text-gray-600 capitalize">
                    {request.type}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell className="text-gray-600">
                    {request.submittedAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                          >
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
  );
}
