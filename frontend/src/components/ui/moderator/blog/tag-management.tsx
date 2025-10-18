"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import { Button } from "@/components/ui/common/button";
import { Input } from "@/components/ui/common/input";
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/services/auth/blog.api";

import { Search, Plus, Edit, Trash } from "lucide-react";


type Tag = {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
};

export  function TagManagementTable() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);


  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await getAllTags();
      setTags(res);
    } catch (err) {
      console.error("Failed to load tags:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);


  const handleAddTag = async () => {
    if (!newTag.trim()) return alert("Vui lòng nhập tên tag");
    try {
      await createTag({ name: newTag });
      setNewTag("");
      fetchTags();
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  };

  // 🟡 Sửa tag
  const handleEdit = async (tag: Tag) => {
    const newName = prompt("Nhập tên mới cho tag:", tag.name);
    if (!newName || newName === tag.name) return;
    try {
      await updateTag(tag._id, { name: newName });
      fetchTags();
    } catch (err) {
      console.error("Failed to update tag:", err);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa tag này?")) return;
    try {
      await deleteTag(id);
      fetchTags();
    } catch (err) {
      console.error("Failed to delete tag:", err);
    }
  };

  // 🔍 Lọc
  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-white">Quản lý Tag</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
              <Input
                placeholder="Tìm tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Input
              placeholder="Thêm tag mới..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 w-50"
            />
            <Button
              onClick={handleAddTag}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Thêm
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-white/70 text-center py-4">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tên</th>
                  <th className="px-4 py-3 text-left font-medium">Tạo lúc</th>
                  <th className="px-4 py-3 text-center font-medium">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((tag) => (
                  <tr key={tag._id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{tag.name}</td>
                    <td className="px-4 py-3 text-white/70">
                      {new Date(tag.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleEdit(tag)}
                          className="text-emerald-400 hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(tag._id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-center text-white/60 italic"
                    >
                      Không có tag nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
