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

import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/common/dialog";



export function CommentManagementTable() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteCommentData, setDeleteCommentData] = useState<any>(null);

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

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await banComment(id);
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

                      
                      {comment.isDeleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            setDeleteCommentData(comment);
                            setOpenDelete(true);
                          }}
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

       
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Xóa bình luận?</DialogTitle>
            </DialogHeader>

            <p>
              Bạn có chắc muốn xóa bình luận của{" "}
              <span className="text-red-400 font-semibold">
                {deleteCommentData?.user?.fullName ||
                  deleteCommentData?.ownerName ||
                  "Người dùng"}
              </span>
              ?
            </p>

            <div className="p-3 mt-2 bg-black/20 rounded border border-white/10 text-sm text-white/70">
              “{deleteCommentData?.content}”
            </div>

            <p className="text-xs text-red-300 mt-2">
              ⚠️ Hành động này không thể khôi phục.
            </p>

            <DialogFooter className="mt-4">
              <Button
                variant="ghost"
                className="text-gray-300 hover:bg-white/10"
                onClick={() => setOpenDelete(false)}
              >
                Hủy
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  try {
                    await deleteComment(deleteCommentData?._id);
                    setComments((prev) =>
                      prev.filter((c) => c._id !== deleteCommentData?._id)
                    );
                    toast.success("Xóa bình luận thành công!");
                    setOpenDelete(false);
                  } catch (error) {
                    toast.error("Xóa bình luận thất bại");
                  }
                }}
              >
                Xóa ngay
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
