"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllPosts, deletePost } from "@/services/auth/blog.api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/common/card";
import { Button } from "@/components/ui/common/button";
import { Input } from "@/components/ui/common/input";
import { FileText, Edit, Trash2, Eye, Search } from "lucide-react";
import BlogDetail from "@/components/ui/moderator/blog/blog-details";
import AddPostDialog from "@/components/ui/moderator/blog/add-blog-form";
import EditBlogForm from "@/components/ui/moderator/blog/edit-blog-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/common/dialog";

export  function BlogManagementTable() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editBlogId, setEditBlogId] = useState<string | null>(null); 
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteBlog, setDeleteBlog] = useState<any>(null);


  const fetchPosts = async () => {
    try {
      setLoading(true); 
      const res = await getAllPosts(1, 20);
      setPosts(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách bài viết!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);



  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );
  const handleEditClick = (id: string) => {
    setEditBlogId(id);
    setOpenEdit(true);
  };

 
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditBlogId(null);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await deletePost(id);
      toast.success("Xóa bài viết thành công!");
      fetchPosts();
    } catch (error) {
      toast.error("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };


  return (
    <>
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-white">Quản lý bài viết</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Tìm theo tiêu đề..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <Button
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setOpenAdd(true)}
              >
                + Thêm bài viết
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tiêu đề</th>

                  <th className="px-4 py-3 text-left font-medium">Danh mục</th>
                  <th className="px-4 py-3 text-left font-medium">Thẻ</th>
                  <th className="px-4 py-3 text-center font-medium">Nổi bật</th>
                  <th className="px-4 py-3 text-center font-medium">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-3 text-center text-white/60"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((post) => (
                    <tr key={post._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white font-medium max-w-xs truncate">
                        {post.title}
                      </td>

                      <td className="px-4 py-3 text-white/70">
                        {post.categoryId?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {post.tags?.length
                          ? post.tags.map((tag: any) => tag.name).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-white/70">
                        {post.isFeatured ? "⭐ Có" : "Không"}
                      </td>
                      <td className="px-4 py-3 text-center text-white/70">
                        {post.isActive ? "Hoạt động" : "Ẩn"}
                      </td>
                      <td className="px-4 py-3 text-center text-white/70">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedBlogId(post._id);
                              setIsDetailOpen(true);
                            }}
                            className="text-blue-400 hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => handleEditClick(post._id)}
                            className="text-emerald-400 hover:bg-white/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setDeleteBlog(post);
                              setOpenDelete(true);
                            }}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-3 text-center text-white/60 italic"
                    >
                      {query
                        ? `Không tìm thấy bài viết nào khớp với "${query}"`
                        : "Không có bài viết nào."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <BlogDetail
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        blogId={selectedBlogId}
      />
      <AddPostDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          toast.success("Làm mới danh sách bài viết!");
          fetchPosts();
        }}
      />
      {openEdit && editBlogId && (
        <EditBlogForm
          open={openEdit}
          postId={editBlogId}
          onClose={handleCloseEdit}
          onSuccess={(updatedPost) => {
            toast.success("Cập nhật bài viết thành công!");

            setPosts((prev) =>
              prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
            );
          }}
        />
      )}
      {openDelete && deleteBlog && (
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="bg-white/10 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Xóa bài viết
              </DialogTitle>
            </DialogHeader>

            <p>
              Bạn có chắc muốn xoá bài viết:{" "}
              <span className="font-semibold text-red-400">
                {deleteBlog.title}
              </span>
              ?
            </p>

            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setOpenDelete(false)}>
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500"
                onClick={async () => {
                  await handleDelete(deleteBlog._id);
                  setOpenDelete(false);
                }}
              >
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
 
}
