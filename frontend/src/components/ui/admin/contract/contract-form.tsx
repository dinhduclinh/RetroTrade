import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/common/button";
import { Input } from "@/components/ui/common/input";
import { Textarea } from "@/components/ui/common/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/common/card";
import {
  Save,
  X,
  FileText,
  AlignLeft,
  FileCheck,
  Sparkles,
} from "lucide-react";
import {
  createContractTemplate,
  updateContractTemplate,
} from "@/services/contract/contract.api";
import { toast } from "sonner";

interface ContractTemplate {
  _id?: string;
  templateName: string;
  description: string;
  templateContent: string;
  isActive: boolean;
}

interface ContractTemplateFormProps {
  template?: ContractTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContractTemplateForm({
  template,
  onClose,
  onSuccess,
}: ContractTemplateFormProps) {
  const [formData, setFormData] = useState({
    templateName: template?.templateName || "",
    description: template?.description || "",
    templateContent: template?.templateContent || "",
    isActive: template?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (template?._id) {
        response = await updateContractTemplate(template._id, formData);
      } else {
        response = await createContractTemplate(formData);
      }
      if (response.ok) {
        toast.success(template ? "Cập nhật thành công" : "Tạo mới thành công");
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Thao tác thất bại");
      }
    } catch {
      toast.error("Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-t-2xl">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          <motion.div
            className="absolute top-4 right-20 w-2 h-2 bg-white rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-10 right-40 w-3 h-3 bg-white rounded-full"
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          <div className="relative flex justify-between items-center">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  {template ? "Cập nhật mẫu hợp đồng" : "Tạo mẫu hợp đồng mới"}
                </CardTitle>
              </div>
              <p className="text-white/80 text-sm ml-14">
                {template
                  ? "Chỉnh sửa thông tin mẫu hợp đồng hiện có"
                  : "Tạo mới một mẫu hợp đồng chuyên nghiệp"}
              </p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </CardHeader>

        <CardContent className="p-8 bg-white">
          <div className="space-y-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Tên mẫu hợp đồng <span className="text-red-500">*</span>
              </label>
              <motion.div
                animate={{
                  scale: focusedField === "templateName" ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  value={formData.templateName}
                  onChange={(e) =>
                    setFormData({ ...formData, templateName: e.target.value })
                  }
                  onFocus={() => setFocusedField("templateName")}
                  onBlur={() => setFocusedField(null)}
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 text-base px-4 py-3"
                  placeholder="Nhập tên mẫu hợp đồng"
                  required
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-indigo-600" />
                Mô tả
              </label>
              <motion.div
                animate={{
                  scale: focusedField === "description" ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  onFocus={() => setFocusedField("description")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Mô tả ngắn gọn về mục đích sử dụng của mẫu hợp đồng này..."
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 min-h-[100px] text-base px-4 py-3 resize-none"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Nội dung mẫu hợp đồng <span className="text-red-500">*</span>
              </label>
              <motion.div
                animate={{
                  scale: focusedField === "templateContent" ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Textarea
                  value={formData.templateContent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      templateContent: e.target.value,
                    })
                  }
                  onFocus={() => setFocusedField("templateContent")}
                  onBlur={() => setFocusedField(null)}
                  rows={14}
                  required
                  placeholder="Nhập nội dung chi tiết của hợp đồng tại đây...&#10;&#10;Bạn có thể sử dụng các biến động như {{TEN_KHACH_HANG}}, {{DIA_CHI}}, v.v."
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 text-base px-4 py-3 font-mono resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                  {formData.templateContent.length} ký tự
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-2 border-gray-400 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                  />
                  {formData.isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute left-0 w-5 h-5 bg-indigo-600 rounded pointer-events-none flex items-center justify-center"
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      Kích hoạt mẫu hợp đồng
                    </span>
                    {formData.isActive && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full"
                      >
                        Đang hoạt động
                      </motion.span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 block">
                    Mẫu hợp đồng sẽ có thể được sử dụng ngay lập tức
                  </span>
                </div>
              </label>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-200"
                >
                  Hủy bỏ
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="relative px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {loading && (
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                  {loading ? (
                    <span className="flex items-center gap-2 relative z-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Đang lưu...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 relative z-10">
                      <Save className="w-5 h-5" />
                      {template ? "Cập nhật mẫu" : "Tạo mẫu mới"}
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
