"use client";

import { useEffect, useState } from "react";
import {
  getAllPosts,
  getAllCategories,
  getAllTags,
} from "@/services/auth/blog.api";
import { CalendarDays, Tag, User } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  shortDescription: string;
  thumbnail?: string;
  createdAt: string;
  authorId?: {
    name: string;
  };
  categoryId?: {
    name: string;
  };
  tags?: { name: string }[];
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, cateRes, tagRes] = await Promise.all([
          getAllPosts(),
          getAllCategories(),
          getAllTags(),
        ]);

        const [postData, cateData, tagData] = await Promise.all([
          postRes.json(),
          cateRes.json(),
          tagRes.json(),
        ]);

        setPosts(postData);
        setCategories(cateData);
        setTags(tagData);
      } catch (err) {
        console.error("Error fetching blog data:", err);
      }
    };

    fetchData();
  }, []);

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10 flex gap-6">
      {/* ============ SIDEBAR ============ */}
      <aside className="w-1/4 space-y-6">
        {/* Tìm kiếm */}
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Tìm kiếm</h3>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Danh mục */}
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="font-semibold mb-3">Danh mục</h3>
          <ul className="space-y-2 text-gray-700">
            {categories.length > 0 ? (
              categories.map((cate) => (
                <li
                  key={cate._id}
                  className="cursor-pointer hover:text-blue-600"
                >
                  {cate.name}
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm">Đang tải...</li>
            )}
          </ul>
        </div>

        {/* Bài viết nổi bật */}
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="font-semibold mb-3">Bài viết nổi bật</h3>
          <ul className="space-y-3">
            {posts
              .filter((p) => p.title && p.thumbnail)
              .slice(0, 3)
              .map((post) => (
                <li key={post._id} className="flex gap-3 items-center">
                  <img
                    src={post.thumbnail || "/placeholder.jpg"}
                    alt={post.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="text-sm">
                    <p className="font-medium leading-snug">{post.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Tag phổ biến */}
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="font-semibold mb-3">Tag phổ biến</h3>
          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag._id}
                  className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
                >
                  #{tag.name}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Đang tải...</p>
            )}
          </div>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1">
        <h1 className="text-3xl font-bold mb-6">Bài viết</h1>

        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-2xl shadow p-4 flex gap-4 hover:shadow-lg transition"
            >
              <img
                src={post.thumbnail || "/placeholder.jpg"}
                alt={post.title}
                className="w-40 h-32 object-cover rounded-lg"
              />

              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex gap-3 text-sm text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </span>

                    {post.authorId?.name && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.authorId?.name || "Ẩn danh"}
                      </span>
                    )}

                    {post.categoryId?.name && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {post.categoryId.name}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold mb-1">{post.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {post.shortDescription}
                  </p>
                </div>

                <a
                  href={`/blog/${post._id}`}
                  className="mt-3 inline-block text-sm text-white bg-[#6677ee] hover:bg-blue-700 px-4 py-2 rounded-lg w-fit"
                >
                  Đọc tiếp
                </a>
              </div>
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <p className="text-gray-500 text-center py-10">
              Không tìm thấy bài viết nào.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
