"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCommentById } from "@/services/auth/blog.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/common/dialog";
import { Button } from "@/components/ui/common/button";
import { Badge } from "@/components/ui/common/badge";
import { Card, CardContent } from "@/components/ui/common/card";
import { X, Calendar, User, MessageSquare } from "lucide-react";

interface CommentDetailProps {
  commentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentDetail({ commentId, isOpen, onClose }: CommentDetailProps) {
  const [comment, setComment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && commentId) {
      fetchComment();
    }
  }, [isOpen, commentId]);

  const fetchComment = async () => {
    try {
      setLoading(true);
      const res = await getCommentById(commentId);
      setComment(res);
    } catch (error) {
      toast.error("Không thể tải chi tiết bình luận!");
    } finally {
      setLoading(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Chi tiết bình luận</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-white/70">Đang tải...</div>
          </div>
        ) : comment ? (
          <div className="space-y-6">
            {/* Comment Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {comment.author?.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">
                          {comment.author?.fullName || "Unknown"}
                        </span>
                        {getStatusBadge(comment.status || "pending")}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>Bài viết: {comment.post?.title || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <p className="text-white/90">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Author Info */}
            {comment.author && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Thông tin tác giả
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">Tên:</span>
                      <span className="text-white ml-2">{comment.author.fullName || "Unknown"}</span>
                    </div>
                    <div>
                      <span className="text-white/70">Email:</span>
                      <span className="text-white ml-2">{comment.author.email || "Unknown"}</span>
                    </div>
                    <div>
                      <span className="text-white/70">Vai trò:</span>
                      <span className="text-white ml-2">{comment.author.role || "Unknown"}</span>
                    </div>
                    <div>
                      <span className="text-white/70">Ngày tham gia:</span>
                      <span className="text-white ml-2">
                        {comment.author.createdAt ? new Date(comment.author.createdAt).toLocaleDateString('vi-VN') : "Unknown"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Post Info */}
            {comment.post && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Bài viết liên quan</h3>
                  <div className="space-y-2">
                    <h4 className="text-white font-medium">{comment.post.title}</h4>
                    <p className="text-white/70 text-sm line-clamp-2">{comment.post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>Tác giả: {comment.post.author?.fullName || "Unknown"}</span>
                      <span>
                        {new Date(comment.post.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-white/70">Không tìm thấy bình luận</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
