"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllPosts,
  getAllCategories,
  getAllTags,
  getPostsByCategory,
  getPostsByTag,
} from "@/services/auth/blog.api";
import { CalendarDays, Tag, User } from "lucide-react";
import ChatButton from "@/components/common/chatbutton";

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
  const router = useRouter();


  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"category" | "tag" | null>(null);
  const [filterName, setFilterName] = useState<string>("");


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postData, cateData, tagData] = await Promise.all([
          getAllPosts(),
          getAllCategories(),
          getAllTags(),
        ]);

        const normalizedPosts: Post[] = postData?.data || postData || [];
        const normalizedCates = cateData?.data || cateData || [];
        const normalizedTags = tagData?.data || tagData || [];

        setAllPosts(normalizedPosts);
        setPosts(normalizedPosts);
        setCategories(normalizedCates);
        setTags(normalizedTags);
      } catch (err) {
        console.error("Lỗi lấy dứ liệu bài viết", err);
      }
    };

    fetchData();
  }, []);

  
  const handleCategoryClick = async (id: string, name: string) => {
    try {
      const data = await getPostsByCategory(id);
      const normalized = data?.data || data || [];
      setPosts(normalized);
      setFilterType("category");
      setFilterName(name);
    } catch (err) {
      console.error("Lỗi khi lọc theo danh mục:", err);
    }
  };


  const handleTagClick = async (id: string, name: string) => {
    try {
      const data = await getPostsByTag(id);
      const normalized = data?.data || data || [];
      setPosts(normalized);
      setFilterType("tag");
      setFilterName(name);
    } catch (err) {
      console.error("Lỗi khi lọc theo tag:", err);
    }
  };


  const resetFilter = async () => {
    setPosts(allPosts);
    setFilterType(null);
    setFilterName("");
  };

  
  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const featuredPosts = allPosts.slice(0, 3);

  return (
    <div className="container mx-auto py-10 flex gap-6">
      
      <aside className="w-1/4 space-y-6">
       
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="font-semibold mb-2 text-black">Tìm kiếm</h3>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        
        <div className="bg-white shadow rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-black">Danh mục</h3>
            {filterType === "category" && (
              <button
                onClick={resetFilter}
                className="text-xs text-blue-500 hover:underline"
              >
                Xóa lọc
              </button>
            )}
          </div>

          <ul className="space-y-2 text-gray-700">
            {categories.length > 0 ? (
              categories.map((cate) => (
                <li
                  key={cate._id}
                  onClick={() => handleCategoryClick(cate._id, cate.name)}
                  className={`cursor-pointer hover:text-blue-600 ${
                    filterType === "category" && filterName === cate.name
                      ? "text-blue-600 font-medium"
                      : ""
                  }`}
                >
                  {cate.name}
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm">Đang tải...</li>
            )}
          </ul>
        </div>

       
        <div className="bg-white shadow rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-black">Tag phổ biến</h3>
            {filterType === "tag" && (
              <button
                onClick={resetFilter}
                className="text-xs text-blue-500 hover:underline"
              >
                Xóa lọc
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag._id}
                  onClick={() => handleTagClick(tag._id, tag.name)}
                  className={`text-xs px-3 py-1 rounded-full cursor-pointer ${
                    filterType === "tag" && filterName === tag.name
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  #{tag.name}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Đang tải...</p>
            )}
          </div>
        </div>

      
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="font-semibold mb-3 text-black">Bài viết nổi bật</h3>
          <ul className="space-y-3">
            {featuredPosts.length > 0 ? (
              featuredPosts.map((post) => (
                <li
                  key={post._id}
                  onClick={() => router.push(`/blog/${post._id}`)}
                  className="flex gap-3 items-center cursor-pointer hover:opacity-80 transition"
                >
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📝</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="font-medium leading-snug line-clamp-2">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm">Đang tải...</li>
            )}
          </ul>
        </div>
      </aside>

     
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">
            {filterType
              ? `Bài viết theo ${
                  filterType === "category" ? "danh mục" : "tag"
                }: ${filterName}`
              : "Bài viết mới nhất"}
          </h1>
        </div>

        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-2xl shadow p-4 flex gap-4 hover:shadow-lg transition"
              >
                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-40 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-1">📝</div>
                      <div className="text-xs">Không có ảnh</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex gap-3 text-sm text-gray-500 mb-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </span>

                      {post.authorId?.name && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.authorId?.name}
                        </span>
                      )}

                      {post.categoryId?.name && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {post.categoryId.name}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-semibold mb-1 text-black">{post.title}</h2>
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
            ))
          ) : (
            <p className="text-gray-500 text-center py-10">
              Không tìm thấy bài viết nào.
            </p>
          )}
        </div>
      </main>

      {/* Floating Chat Button */}
      <ChatButton badgeCount={3} />
    </div>
  );
}