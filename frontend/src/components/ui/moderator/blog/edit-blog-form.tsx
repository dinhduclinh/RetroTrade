"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/common/dialog";
import { toast } from "sonner";
import {
  getAllCategories,
  getAllTags,
  getBlogDetail,
  updatePost,
} from "@/services/auth/blog.api";
import { Switch } from "@/components/ui/common/switch";
import { Label } from "@/components/ui/common/label";

interface EditBlogFormProps {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  onSuccess?: (updatedPost: any) => void;
}

interface BlogFormData {
  title: string;
  shortDescription?: string;
  content: string;
  categoryId?: string;
  tags: string[];
  images: File[];
  isActive: boolean;
  isFeatured: boolean;
  oldImages?: string[];
}

const EditBlogForm: React.FC<EditBlogFormProps> = ({
  open,
  onClose,
  postId,
  onSuccess,
}) => {
  const [form, setForm] = useState<BlogFormData>({
    title: "",
    shortDescription: "",
    content: "",
    categoryId: "",
    tags: [],
    images: [],
    isActive: true,
    isFeatured: false,
    oldImages: [],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // 🧩 Load danh mục, tag, và dữ liệu bài viết
  useEffect(() => {
    if (open && postId) {
      fetchCategories();
      fetchTags();
      fetchPostDetail(postId);
    }
  }, [open, postId]);

  const fetchCategories = async () => {
    try {
      const res = await getAllCategories();
      setCategories(res?.data || res || []);
    } catch {
      toast.error("Không thể tải danh mục");
    }
  };

  const fetchTags = async () => {
    try {
      const res = await getAllTags();
      setTags(res?.data || res || []);
    } catch {
      toast.error("Không thể tải thẻ tag");
    }
  };

  const fetchPostDetail = async (id: string) => {
    try {
      setLoadingData(true);
      const res = await getBlogDetail(id);
      if (res) {
        setForm({
          title: res.title || "",
          shortDescription: res.shortDescription || "",
          content: res.content || "",
          categoryId: res.categoryId?._id || "",
          tags: res.tags?.map((t: any) => t._id) || [],
          images: [],
          oldImages: res.images || [],
          isActive: res.isActive,
          isFeatured: res.isFeatured,
        });
      }
    } catch (err) {
      toast.error("Không thể tải chi tiết bài viết");
    } finally {
      setLoadingData(false);
    }
  };

  // 🧠 Cập nhật input
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🖼️ Upload ảnh mới
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setForm((prev) => ({
      ...prev,
      images: files ? Array.from(files) : [],
    }));
  };

  // 🏷️ Chọn tag
  const handleTagToggle = (tagId: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("shortDescription", form.shortDescription || "");
      formData.append("content", form.content);
      if (form.categoryId) formData.append("categoryId", form.categoryId);
      if (form.tags.length > 0)
        formData.append("tags", JSON.stringify(form.tags));
      formData.append("isActive", String(form.isActive));
      formData.append("isFeatured", String(form.isFeatured));
      form.images.forEach((file) => formData.append("images", file));

      const updatedPost = await updatePost(postId, formData);

      if (updatedPost && !updatedPost.error && updatedPost._id) {
        toast.success("Cập nhật bài viết thành công!");
       
        onSuccess?.(updatedPost);
        onClose();
      } else {
        toast.error(updatedPost?.message || "Không thể cập nhật bài viết");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật bài viết");
    } finally {
      setLoading(false);
    }
  };


  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#6E8CFB] text-white border border-white/10">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
          <DialogDescription className="text-white/60">
            Cập nhật thông tin bài viết hiện có.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="text-center py-6 text-white/80">
            Đang tải dữ liệu...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Tiêu đề */}
            <div>
              <label className="block text-sm mb-1">Tiêu đề *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
              />
            </div>

            {/* Mô tả ngắn */}
            <div>
              <label className="block text-sm mb-1">Mô tả ngắn</label>
              <textarea
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                rows={2}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
              />
            </div>

            {/* Nội dung */}
            <div>
              <label className="block text-sm mb-1">Nội dung *</label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={6}
                required
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
              />
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-sm mb-1">Danh mục</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full p-2 rounded bg-[#4B66CC] text-white border border-white/20 focus:outline-none"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-sm mb-1">Thẻ (tags)</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag._id}
                    onClick={() => handleTagToggle(tag._id)}
                    className={`px-3 py-1 rounded-full border ${
                      form.tags.includes(tag._id)
                        ? "bg-white text-[#6E8CFB]"
                        : "bg-transparent border-white/30 text-white"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ảnh hiện có */}
            {form.oldImages && form.oldImages.length > 0 && (
              <div>
                <label className="block text-sm mb-1">Ảnh hiện tại</label>
                <div className="flex gap-2 flex-wrap">
                  {form.oldImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded border border-white/20"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ảnh mới */}
            <div>
              <label className="block text-sm mb-1">Ảnh mới (nếu có)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-white"
              />
            </div>

            {/* Switch */}
            <div className="flex gap-4">
              <Label className="flex items-center gap-2">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(checked: any) =>
                    setForm((prev) => ({ ...prev, isFeatured: checked }))
                  }
                />
                Nổi bật
              </Label>
              <Label className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked: any) =>
                    setForm((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                Hiển thị
              </Label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-[#6E8CFB] font-semibold rounded hover:bg-white/90 transition"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditBlogForm;
