// File: src/components/ui/admin/terms/terms-form.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/common/button";
import { Input } from "@/components/ui/common/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/common/card";
import { Save, X, FileText, Trash2 } from "lucide-react";
import { createTerms, updateTerms } from "@/services/terms/terms.api";
import { toast } from "sonner";
import { Terms, TermsSection } from "@/services/terms/terms.api";

interface TermsFormProps {
  isOpen: boolean;
  terms?: Terms | null;
  onClose: () => void;
  onSuccess: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
} as const;

export function TermsForm({
  isOpen,
  terms,
  onClose,
  onSuccess,
}: TermsFormProps) {
  const isEditing = !!terms;
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    sections: [] as TermsSection[],
    effectiveDate: "",
    changesSummary: "",
  });
  const [loading, setLoading] = useState(false);

  // FIXED: Format effectiveDate properly for date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return new Date().toISOString().split("T")[0];
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  };

  useEffect(() => {
    const initialData = {
      version: terms?.version || "",
      title: terms?.title || "",
      sections: terms?.sections || [
        { icon: "FileText", title: "", content: [""] },
      ],
      effectiveDate: formatDateForInput(terms?.effectiveDate),
      changesSummary: terms?.changesSummary || "",
    };
    setFormData(initialData);
  }, [terms]);

  if (!isOpen) {
    return null;
  }

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        { icon: "FileText", title: "", content: [""] },
      ],
    });
  };

  const removeSection = (index: number) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sections: newSections.length
        ? newSections
        : [{ icon: "FileText", title: "", content: [""] }],
    });
  };

  const updateSection = (
    index: number,
    field: "icon" | "title",
    value: string
  ) => {
    const newSections = [...formData.sections];
    newSections[index][field] = value;
    setFormData({ ...formData, sections: newSections });
  };

  const addContentItem = (sectionIndex: number) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].content.push("");
    setFormData({ ...formData, sections: newSections });
  };

  const removeContentItem = (sectionIndex: number, contentIndex: number) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].content.splice(contentIndex, 1);
    if (newSections[sectionIndex].content.length === 0)
      newSections[sectionIndex].content.push("");
    setFormData({ ...formData, sections: newSections });
  };

  const updateContent = (
    sectionIndex: number,
    contentIndex: number,
    value: string
  ) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].content[contentIndex] = value;
    setFormData({ ...formData, sections: newSections });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !formData.title ||
      formData.sections.some(
        (s) => !s.title || s.content.some((c) => !c.trim())
      )
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (!isEditing && !formData.version) {
      toast.error("Vui lòng nhập phiên bản");
      return;
    }
    try {
      setLoading(true);
      let response: Response;
      if (isEditing) {
        response = await updateTerms(
          formData.title,
          formData.sections,
          formData.effectiveDate,
          formData.changesSummary || null
        );
      } else {
        response = await createTerms(
          formData.version,
          formData.title,
          formData.sections,
          formData.effectiveDate,
          formData.changesSummary || null
        );
      }
      if (response.ok) {
        toast.success(isEditing ? "Cập nhật thành công" : "Tạo mới thành công");
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Thao tác thất bại");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Lỗi hệ thống: " + error.message);
      } else {
        toast.error("Lỗi hệ thống không xác định");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={handleOverlayClick}
        />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <Card className="border-0 shadow-none bg-transparent w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-t-2xl flex-shrink-0">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
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
                      {isEditing ? "Cập nhật điều khoản" : "Tạo điều khoản mới"}
                    </CardTitle>
                  </div>
                  <p className="text-white/80 text-sm ml-14">
                    {isEditing
                      ? "Chỉnh sửa thông tin điều khoản hiện có"
                      : "Tạo mới một phiên bản điều khoản chuyên nghiệp"}
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
            <CardContent className="p-8 bg-white overflow-y-auto flex-1">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isEditing && (
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Phiên Bản <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.version}
                      onChange={(e) =>
                        setFormData({ ...formData, version: e.target.value })
                      }
                      className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 text-base px-4 py-3"
                      placeholder="Nhập phiên bản (e.g., v1.0)"
                      required
                    />
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Tiêu Đề <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 text-base px-4 py-3"
                    placeholder="Nhập tiêu đề điều khoản"
                    required
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Ngày Hiệu Lực <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectiveDate: e.target.value,
                      })
                    }
                    className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 text-base px-4 py-3"
                    required
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Tóm Tắt Thay Đổi
                  </label>
                  <Input
                    value={formData.changesSummary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        changesSummary: e.target.value,
                      })
                    }
                    className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl transition-all duration-200 text-base px-4 py-3"
                    placeholder="Mô tả các thay đổi (tùy chọn)"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Các Phần Điều Khoản <span className="text-red-500">*</span>
                  </label>
                  {formData.sections.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50"
                    >
                      <div className="flex gap-2 mb-3">
                        <select
                          value={section.icon}
                          onChange={(e) =>
                            updateSection(sectionIndex, "icon", e.target.value)
                          }
                          className="border-gray-300 rounded px-3 py-2 w-32"
                        >
                          <option value="FileText">FileText</option>
                          <option value="Shield">Shield</option>
                          <option value="Clock">Clock</option>
                          <option value="AlertCircle">AlertCircle</option>
                          <option value="CheckCircle">CheckCircle</option>
                        </select>
                        <Input
                          value={section.title}
                          onChange={(e) =>
                            updateSection(sectionIndex, "title", e.target.value)
                          }
                          placeholder="Tiêu đề phần"
                          className="flex-1"
                          required
                        />
                        {formData.sections.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSection(sectionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {section.content.map((item, contentIndex) => (
                        <div key={contentIndex} className="flex gap-2 mb-2">
                          <Input
                            value={item}
                            onChange={(e) =>
                              updateContent(
                                sectionIndex,
                                contentIndex,
                                e.target.value
                              )
                            }
                            placeholder={`Bullet ${contentIndex + 1}`}
                            className="flex-1 text-sm"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              removeContentItem(sectionIndex, contentIndex)
                            }
                          >
                            Xóa
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addContentItem(sectionIndex)}
                      >
                        + Thêm bullet
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSection}
                    className="mt-2"
                  >
                    + Thêm phần mới
                  </Button>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-200"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang lưu...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        {isEditing ? "Cập nhật" : "Tạo mới"}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
