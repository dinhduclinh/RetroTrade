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
import { MessageSquare, Eye, Trash2 } from "lucide-react";
import { getAllComment } from "@/services/auth/blog.api";

export function CommentManagementTable() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await getAllComment();
      // đảm bảo comments là mảng
      setComments(Array.isArray(res) ? res : res.comments || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const getStatusBadge = (isDeleted: boolean) => {
    return isDeleted ? (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        Đã xóa
      </Badge>
    ) : (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Hoạt động
      </Badge>
    );
  };

  if (loading) return <div className="text-white">Đang tải bình luận...</div>;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5" />
          Quản lý bình luận
        </CardTitle>
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
              {comments.map((comment) => (
                <TableRow key={comment._id} className="border-white/20">
                  <TableCell className="text-white/70 max-w-xs">
                    <div className="truncate" title={comment.content}>
                      {comment.content}
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {comment.user.fullName || "Unknown"}
                  </TableCell>
                  <TableCell className="text-white/70 max-w-xs truncate">
                    {comment.postTitle || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.isDeleted)}</TableCell>
                  <TableCell className="text-white/70">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:bg-blue-500/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!comment.isDeleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
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
      </CardContent>
    </Card>
  );
}
