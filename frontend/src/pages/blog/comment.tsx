"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { decodeToken, type DecodedToken } from '@/utils/jwtHelper';
import type { RootState } from "@/store/redux_store";
import {
  getCommentsByPost,
  addComment,
  deleteCommentByUser,
  updateCommentByUser,
} from "@/services/auth/blog.api";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/common/dropdown-menu";
interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isLoggedIn = !!accessToken;

  const decoded = decodeToken(accessToken);
  const currentUserId = decoded?._id || null;

  const fetchComments = async () => {
    const res = await getCommentsByPost(postId);
    setComments(Array.isArray(res) ? res : []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để bình luận!");
      return;
    }

    const res = await addComment(postId, { content: newComment });
    if (res && res._id) {
      setComments([res, ...comments]);
      setNewComment("");
    }
    await fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này không?")) return;
    const res = await deleteCommentByUser(id);
    if (!res.error) {
      setComments(comments.filter((c) => c._id !== id));
    }
  };

  const handleEdit = (comment: any) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    const res = await updateCommentByUser(id, { content: editContent });
    if (!res.error) {
      setComments(
        comments.map((c) => (c._id === id ? { ...c, content: editContent } : c))
      );
      setEditingCommentId(null);
      setEditContent("");
    }
  };

  useEffect(() => {
    if (postId) fetchComments();
  }, [postId]);

  return (
    <div className="mt-10">
      <h3 className="font-semibold mb-4 text-lg">
        Bình luận ({comments.length})
      </h3>

     
      {isLoggedIn ? (
        <div className="flex flex-col gap-2 mb-6">
          <textarea
            className="border rounded-lg p-2 w-full"
            placeholder="Viết bình luận..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={handleAddComment}
            className="self-end bg-[#6677ee] text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Gửi bình luận
          </button>
        </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg p-3 mb-6">
          🔒 Bạn cần{" "}
          <a href="/auth/login" className="text-blue-600 underline">
            đăng nhập
          </a>{" "}
          để bình luận.
        </div>
      )}

      {/* Danh sách bình luận */}
      <ul className="space-y-4">
        {comments.map((c) => {
          const isOwner =
            currentUserId === c.userId?._id || currentUserId === c.userId?.id;

          return (
            <li key={c._id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={c.userId?.avatarUrl || "/user.png"}
                  alt={c.userId?.fullName || "User"}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">
                  {c.userId?.fullName || "Ẩn danh"}
                </span>
                <span className="text-xs text-gray-400">
                  • {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                </span>

                {/* Menu ba chấm */}
                {isOwner && editingCommentId !== c._id && (
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-500 hover:text-gray-700 p-1 rounded">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => handleEdit(c)}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          ✏️ Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(c._id)}
                          className="cursor-pointer text-red-500 hover:bg-gray-100"
                        >
                          🗑️ Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

             
              {editingCommentId === c._id ? (
                <div className="mt-2">
                  <textarea
                    className="border rounded-lg p-2 w-full text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={() => handleUpdate(c._id)}
                      className="bg-[#6677ee] text-white px-3 py-1 rounded hover:bg-blue-500"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditContent("");
                      }}
                      className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-1">{c.content}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
