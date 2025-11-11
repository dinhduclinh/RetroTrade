import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/common/button";
import { Badge } from "@/components/ui/common/badge";
import { Terms } from "@/services/terms/terms.api";
import {
  FileText,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react"; 

const IconMap = {
  FileText,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
} as const;

interface TermsViewModalProps {
  terms: Terms;
  onClose: () => void;
}

export function TermsViewModal({ terms, onClose }: TermsViewModalProps) {
  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Chi Tiết Điều Khoản: {terms.version}{" "}
                {terms.isActive ? "(Hoạt động)" : "(Không hoạt động)"}
              </h2>
              <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="mb-4 space-y-2">
                <h3 className="text-lg font-semibold">
                  Tiêu đề: {terms.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Tác giả: {terms.createdBy?.fullName || "Admin"}
                </p>
                <p className="text-sm text-gray-600">
                  Ngày tạo:{" "}
                  {new Date(terms.createdAt).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-sm text-gray-600">
                  Hiệu lực từ:{" "}
                  {new Date(terms.effectiveDate).toLocaleDateString("vi-VN")}
                </p>
                {terms.changesSummary && (
                  <p className="text-sm text-gray-500 italic">
                    Tóm tắt thay đổi: {terms.changesSummary}
                  </p>
                )}
                <Badge
                  className={
                    terms.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }
                >
                  {terms.isActive ? "Phiên bản hiện tại" : "Phiên bản lưu trữ"}
                </Badge>
              </div>
              
              {/* Preview sections giống public UI */}
              <div className="space-y-6">
                {terms.sections?.map((section, index) => {
                  const Icon =
                    IconMap[section.icon as keyof typeof IconMap] || FileText; // Fallback
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6"
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-semibold text-slate-800">
                          {section.title}
                        </h4>
                      </div>
                      {/* Content Bullets */}
                      <ul className="space-y-3">
                        {section.content.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-start gap-3"
                          >
                            <ChevronRight className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                              {item}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                }) || (
                  <p className="text-gray-500 text-center py-8 italic">
                    Chưa có phần nào trong điều khoản này.
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
