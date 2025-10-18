"use client";

import { useState, useEffect } from "react";
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
import { MessageSquare, Eye, Search, Trash2 } from "lucide-react";
import {
  getAllComment,
  deleteComment,
  banComment,
} from "@/services/auth/blog.api";
import { toast } from "sonner";
import CommentDetail from "./comment-details";

export function CommentManagementTable() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await getAllComment();
      setComments(Array.isArray(res) ? res : res.comments || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      toast.error("Tải bình luận thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleViewDetail = (id: string) => {
    setSelectedCommentId(id);
    setOpenDetail(true);
  };

  // Toggle trạng thái ẩn/hoạt động
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await banComment(id); // API đã toggle trạng thái ở backend
      setComments((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, isDeleted: !currentStatus } : c
        )
      );
      toast.success(
        !currentStatus
          ? "Ẩn bình luận thành công"
          : "Mở lại bình luận thành công"
      );
    } catch (err) {
      console.error("Failed to toggle comment status:", err);
      toast.error("Thao tác thất bại");
    }
  };

  // Xóa vĩnh viễn
  const handleDeletePermanent = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa vĩnh viễn bình luận này?")) return;
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
      toast.success("Xóa bình luận vĩnh viễn thành công");
    } catch (err) {
      console.error("Failed to delete comment permanently:", err);
      toast.error("Xóa bình luận thất bại");
    }
  };

  const filteredComments = comments.filter((comment) => {
    const q = searchQuery.toLowerCase();
    return (
      comment.content.toLowerCase().includes(q) ||
      (comment.user?.fullName || "").toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="text-white">Đang tải bình luận...</div>;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5" />
          Quản lý bình luận
        </CardTitle>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="Tìm kiếm bình luận..."
            className="px-2 py-1 rounded bg-white/10 text-white placeholder-white/50 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Nội dung</TableHead>
                <TableHead className="text-white/70">Tác giả</TableHead>
                <TableHead className="text-white/70">Bài viết</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Ngày tạo</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.map((comment) => (
                <TableRow key={comment._id} className="border-white/20">
                  <TableCell className="text-white/70 max-w-xs">
                    <div className="truncate" title={comment.content}>
                      {comment.content}
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {comment.user?.fullName || "Unknown"}
                  </TableCell>
                  <TableCell className="text-white/70 max-w-xs truncate">
                    {comment.postTitle || "-"}
                  </TableCell>
                  {/* Trạng thái toggle */}
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${
                        comment.isDeleted
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}
                      onClick={() =>
                        handleToggleStatus(comment._id, comment.isDeleted)
                      }
                      title="Click để thay đổi trạng thái"
                    >
                      {comment.isDeleted ? "Đã ẩn" : "Hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/70">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:bg-blue-500/10"
                        onClick={() => handleViewDetail(comment._id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {/* Nếu đã bị ẩn thì hiển thị nút Xóa vĩnh viễn */}
                      {comment.isDeleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeletePermanent(comment._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selectedCommentId && (
          <CommentDetail
            open={openDetail}
            onClose={() => setOpenDetail(false)}
            commentId={selectedCommentId}
          />
        )}
      </CardContent>
    </Card>
  );
}
