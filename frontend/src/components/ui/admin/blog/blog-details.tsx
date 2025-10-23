"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getPostById } from "@/services/auth/blog.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/common/dialog";
import { Button } from "@/components/ui/common/button";
import { Badge } from "@/components/ui/common/badge";
import { Card, CardContent } from "@/components/ui/common/card";
import { X, Calendar, User, Eye, MessageSquare } from "lucide-react";

interface BlogDetailProps {
  blogId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogDetail({ blogId, isOpen, onClose }: BlogDetailProps) {
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && blogId) {
      fetchBlog();
    }
  }, [isOpen, blogId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await getPostById(blogId);
      setBlog(res);
    } catch (error) {
      toast.error("Không thể tải chi tiết bài viết!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Chi tiết bài viết</DialogTitle>
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
        ) : blog ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white">{blog.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{blog.author?.fullName || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{blog.views || 0} lượt xem</span>
                </div>
              </div>

              {blog.tags && blog.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {blog.tags.map((tag: any, index: number) => (
                    <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div 
                  className="prose prose-invert max-w-none text-white/90"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </CardContent>
            </Card>

            {/* Comments Section */}
            {blog.comments && blog.comments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Bình luận ({blog.comments.length})
                </h3>
                <div className="space-y-3">
                  {blog.comments.slice(0, 5).map((comment: any, index: number) => (
                    <Card key={index} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {comment.author?.fullName?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium text-sm">
                                {comment.author?.fullName || "Unknown"}
                              </span>
                              <span className="text-white/50 text-xs">
                                {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <p className="text-white/80 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {blog.comments.length > 5 && (
                    <p className="text-white/50 text-sm text-center">
                      Và {blog.comments.length - 5} bình luận khác...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-white/70">Không tìm thấy bài viết</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
