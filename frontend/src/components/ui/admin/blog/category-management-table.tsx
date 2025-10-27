"use client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
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
import { FolderOpen, Edit, Trash2, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/common/dialog";
import { Input } from "@/components/ui/common/input";
import { Textarea } from "@/components/ui/common/textarea";

export function CategoryManagementTable() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockCategories = [
        { _id: "1", name: "Công nghệ", description: "Bài viết về công nghệ", postCount: 15 },
        { _id: "2", name: "Kinh doanh", description: "Bài viết về kinh doanh", postCount: 8 },
        { _id: "3", name: "Giáo dục", description: "Bài viết về giáo dục", postCount: 12 },
      ];
      setCategories(mockCategories);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        // Update category
        toast.success("Cập nhật danh mục thành công!");
      } else {
        // Create category
        toast.success("Tạo danh mục thành công!");
      }
      setOpenDialog(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      toast.error("Có lỗi xảy ra!");
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      toast.success("Xóa danh mục thành công!");
      fetchCategories();
    } catch (error) {
      toast.error("Không thể xóa danh mục!");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(query.toLowerCase()) ||
    category.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <FolderOpen className="w-5 h-5" />
            Quản lý danh mục ({filteredCategories.length} danh mục)
          </CardTitle>
          <Button 
            onClick={() => setOpenDialog(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm danh mục
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <Input
            type="text"
            placeholder="Tìm kiếm danh mục..."
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
                <TableHead className="text-white/70">Tên danh mục</TableHead>
                <TableHead className="text-white/70">Mô tả</TableHead>
                <TableHead className="text-white/70">Số bài viết</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/20">
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-white/70">Đang tải...</div>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow className="border-white/20">
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-white/70">
                      <FolderOpen className="w-12 h-12 mx-auto mb-4 text-white/30" />
                      <p className="text-lg font-medium mb-2">Không có danh mục nào</p>
                      <p className="text-sm">Tạo danh mục đầu tiên để bắt đầu</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category._id} className="border-white/20">
                    <TableCell className="text-white font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-white/70">
                      {category.description}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {category.postCount} bài viết
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-yellow-400 hover:bg-yellow-500/10"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(category._id)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Tên danh mục
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Nhập tên danh mục..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Mô tả
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Nhập mô tả danh mục..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpenDialog(false);
                  setEditingCategory(null);
                  setFormData({ name: "", description: "" });
                }}
                className="text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {editingCategory ? "Cập nhật" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
