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
import CommentDetail from "@/components/ui/admin/blog/comment-details";

export function CommentManagementTable() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await getAllComment(1, 20);
      setComments(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách bình luận!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await deleteComment(id);
      toast.success("Xóa bình luận thành công!");
      fetchComments();
    } catch (error) {
      toast.error("Không thể xóa bình luận!");
    }
  };

  const handleBan = async (id: string) => {
    if (!confirm("Bạn có chắc muốn cấm bình luận này?")) return;
    try {
      await banComment(id);
      toast.success("Cấm bình luận thành công!");
      fetchComments();
    } catch (error) {
      toast.error("Không thể cấm bình luận!");
    }
  };

  const handleViewDetail = (id: string) => {
    setSelectedCommentId(id);
    setIsDetailOpen(true);
  };

  const filteredComments = comments.filter((comment) =>
    comment.content?.toLowerCase().includes(query.toLowerCase()) ||
    comment.author?.fullName?.toLowerCase().includes(query.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đã duyệt</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>;
      case "banned":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bị cấm</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5" />
            Quản lý bình luận ({filteredComments.length} bình luận)
          </CardTitle>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <Input
            type="text"
            placeholder="Tìm kiếm bình luận..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-white/50 focus:border-blue-500"
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
              {loading ? (
                <TableRow className="border-white/20">
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-white/70">Đang tải...</div>
                  </TableCell>
                </TableRow>
              ) : filteredComments.length === 0 ? (
                <TableRow className="border-white/20">
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-white/70">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/30" />
                      <p className="text-lg font-medium mb-2">Không có bình luận nào</p>
                      <p className="text-sm">Chưa có bình luận nào trong hệ thống</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredComments.map((comment) => (
                  <TableRow key={comment._id} className="border-white/20">
                    <TableCell className="text-white/70 max-w-xs">
                      <div className="truncate">
                        {comment.content?.substring(0, 100)}
                        {comment.content?.length > 100 && "..."}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {comment.author?.fullName || "Unknown"}
                    </TableCell>
                    <TableCell className="text-white/70">
                      <div className="truncate max-w-xs">
                        {comment.post?.title || "Unknown Post"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(comment.status || "pending")}
                    </TableCell>
                    <TableCell className="text-white/70">
                      {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(comment._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Comment Detail Modal */}
      {isDetailOpen && selectedCommentId && (
        <CommentDetail
          commentId={selectedCommentId}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedCommentId(null);
          }}
        />
      )}
    </Card>
  );
}
