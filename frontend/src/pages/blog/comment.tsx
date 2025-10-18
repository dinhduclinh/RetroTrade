"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/redux_store";
import { getCommentsByPost, addComment } from "@/services/auth/blog.api";

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");

  // 🔹 Lấy accessToken từ Redux
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isLoggedIn = !!accessToken;

  const fetchComments = async () => {
    const res = await getCommentsByPost(postId);
    console.log("fetchComments:", res);
    setComments(Array.isArray(res) ? res : []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để bình luận!");
      return;
    }

    const res = await addComment(postId, { content: newComment });
    console.log("addComment:", res);

    if (res && res._id) setComments([res, ...comments]);
    setNewComment("");
    await fetchComments();
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

      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c._id} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <img
                src={c.userId?.avatar || "/user.png"}
                alt={c.userId?.fullName || "User"}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">
                {c.userId?.fullName || "Ẩn danh"}
              </span>
              <span className="text-xs text-gray-400">
                • {new Date(c.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <p className="text-sm">{c.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
