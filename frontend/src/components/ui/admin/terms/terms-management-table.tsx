import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/common/button";
import { Card, CardContent } from "@/components/ui/common/card";
import { Badge } from "@/components/ui/common/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/common/table";
import { Edit, Eye, Search } from "lucide-react";
import { Terms } from "@/services/terms/terms.api";

interface TermsManagementTableProps {
  onEdit: (terms: Terms) => void;
  onView: (terms: Terms) => void;
  data?: Terms[];
  isHistoryView?: boolean; 
}

export function TermsManagementTable({
  onEdit,
  onView,
  data = [],
}: TermsManagementTableProps) {
  const [loading, setLoading] = useState<boolean>(!data.length);

  useEffect(() => {
    if (data.length > 0) {
      setLoading(false);
    }
  }, [data]);

  const renderEditButton = (terms: Terms) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onEdit(terms)}
      className="gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
    >
      <Edit className="w-3 h-3" />
      Sửa
    </Button>
  );

  const renderViewButton = (terms: Terms) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onView(terms)}
      className="gap-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
    >
      <Eye className="w-3 h-3" />
      Xem
    </Button>
  );

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-16">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <TableRow className="border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700">
                  Phiên Bản
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Tiêu Đề
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Trạng Thái
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Số Phần
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Tác Giả
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Ngày Tạo
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Hành Động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Search className="w-8 h-8 text-gray-400 mb-3" />
                        <p className="text-gray-500 font-medium">
                          Không có dữ liệu
                        </p>
                        <p className="text-gray-400 text-sm">
                          Chưa có điều khoản active.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((terms) => (
                    <motion.tr
                      key={terms._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {terms.version}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {terms.title}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          Hoạt động
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {terms.sections?.length || 0}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {terms.createdBy?.fullName || "Admin"}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(terms.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {renderViewButton(terms)}
                        {renderEditButton(terms)}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
