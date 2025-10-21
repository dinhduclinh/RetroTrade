"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Search,
  FolderTree,
  X,
  Check,
  ArrowUpDown,
} from "lucide-react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  cascadeDeactivateCategory,
} from "@/services/products/category.api";

// Types để tránh TS errors
interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId: string | null;
  isActive: boolean;
  level?: number;
  path?: string[];
  createdAt?: string;
  updatedAt: string;
  children?: Category[];
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string | null;
  isActive: boolean;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

type SortField = "name" | "slug" | "updatedAt";
interface SortState {
  field: SortField;
  order: "asc" | "desc";
}

export default function ProductCategoryManager() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(
    new Set<string>()
  );
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmOnYes, setConfirmOnYes] = useState<() => void>(() => () => {});
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    parentCategoryId: null,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 5,
  });
  const [sort, setSort] = useState<SortState>({ field: "name", order: "asc" });

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      if (!response.ok) throw new Error("Không thể tải danh sách danh mục");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Dữ liệu không hợp lệ");
      const processedData = data.map((cat: Category) => ({
        ...cat,
        _id: cat._id || cat.id || "",
        parentCategoryId:
          cat.parentCategoryId === "" || cat.parentCategoryId === null
            ? null
            : cat.parentCategoryId.toString(),
        level: cat.level || 0,
        path: cat.path || [cat.name],
      }));
      setAllCategories(processedData);
    } catch (err) {
      toast.error((err as Error).message || "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const getRootCategories = () => {
    let roots = allCategories.filter((cat) => cat.parentCategoryId === null);
    // Filter by search term
    if (searchTerm.trim()) {
      roots = roots.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort
    roots.sort((a, b) => {
      let cmp: number;
      if (sort.field === "updatedAt") {
        const aDate = new Date(a.updatedAt);
        const bDate = new Date(b.updatedAt);
        cmp = aDate.getTime() - bDate.getTime();
      } else {
        // For 'name' or 'slug' - string comparison
        cmp = a[sort.field].localeCompare(b[sort.field]);
      }
      return sort.order === "asc" ? cmp : -cmp;
    });
    // Paginate
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginatedRoots = roots.slice(startIndex, endIndex);
    return paginatedRoots;
  };

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination({ currentPage: 1, itemsPerPage });
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
    else newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const getChildCategories = (parentId: string) => {
    return allCategories.filter(
      (cat) => cat.parentCategoryId?.toString() === parentId.toString()
    );
  };

  const buildTree = (cat: Category, level = 0): Category => {
    const children = getChildCategories(cat._id);
    return {
      ...cat,
      level,
      children: children.map((child) => buildTree(child, level + 1)),
    };
  };

  const getParentCategory = (categoryId: string): Category | null => {
    return allCategories.find((cat) => cat._id === categoryId) || null;
  };

  const handleDeactivate = (categoryId: string, hasChildren: boolean) => {
    const message = "Bạn có chắc chắn muốn vô hiệu hóa danh mục này?";
    let fullMessage = message;
    if (hasChildren) {
      fullMessage +=
        " Danh mục có danh mục con. Nếu bạn vô hiệu hóa danh mục cha, tất cả danh mục con cũng sẽ bị vô hiệu hóa.";
    }
    setConfirmTitle("Xác nhận vô hiệu hóa danh mục");
    setConfirmMessage(fullMessage);
    setConfirmOnYes(() => async () => {
      try {
        setLoading(true);
        let res;
        if (hasChildren) {
          res = await cascadeDeactivateCategory(categoryId, false);
        } else {
          res = await deleteCategory(categoryId);
        }
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            errData.message || `Thao tác thất bại với status ${res.status}`
          );
        }
        const result = await res.json();
        toast.success(result.message);
        await fetchAllCategories();
      } catch (err) {
        toast.error((err as Error).message || "Không thể thực hiện thao tác");
      } finally {
        setLoading(false);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleHardDelete = (categoryId: string) => {
    setConfirmTitle("Xác nhận xóa vĩnh viễn");
    setConfirmMessage(
      "Bạn có chắc chắn muốn xóa vĩnh viễn danh mục này khỏi hệ thống? Hành động này không thể hoàn tác."
    );
    setConfirmOnYes(() => async () => {
      try {
        setLoading(true);
        const res = await deleteCategory(categoryId);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            errData.message || `Xóa thất bại với status ${res.status}`
          );
        }
        const result = await res.json();
        toast.success(result.message);
        await fetchAllCategories();
      } catch (err) {
        toast.error((err as Error).message || "Không thể xóa danh mục");
      } finally {
        setLoading(false);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const openAddModal = (parentId: string | null = null) => {
    setModalMode("add");
    setSelectedCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      parentCategoryId: parentId,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    const parent = category.parentCategoryId
      ? getParentCategory(category.parentCategoryId)
      : null;
    const adjustedActive = category.isActive && (!parent || parent.isActive);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentCategoryId: category.parentCategoryId,
      isActive: adjustedActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (
      modalMode === "edit" &&
      selectedCategory &&
      selectedCategory.isActive &&
      !formData.isActive
    ) {
      const hasChildren = getChildCategories(selectedCategory._id).length > 0;
      if (hasChildren) {
        const message = "Bạn có chắc chắn muốn vô hiệu hóa danh mục này?";
        const fullMessage =
          message +
          " Danh mục có danh mục con. Nếu bạn vô hiệu hóa danh mục cha, tất cả danh mục con cũng sẽ bị vô hiệu hóa.";
        setConfirmTitle("Xác nhận vô hiệu hóa danh mục");
        setConfirmMessage(fullMessage);
        setConfirmOnYes(() => async () => {
          try {
            setLoading(true);
            const res = await cascadeDeactivateCategory(
              selectedCategory._id,
              false
            );
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.message || "Cập nhật thất bại");
            }
            const result = await res.json();
            toast.success(result.message);
            await fetchAllCategories();
            setShowModal(false);
          } catch (err) {
            toast.error((err as Error).message || "Lỗi khi cập nhật danh mục");
          } finally {
            setLoading(false);
            setShowConfirm(false);
          }
        });
        setShowConfirm(true);
        return;
      }
    }

    try {
      setLoading(true);
      let response;
      if (modalMode === "add") {
        response = await addCategory(
          formData.name,
          formData.slug,
          formData.description,
          formData.parentCategoryId,
          formData.isActive
        );
      } else {
        if (!selectedCategory) return;
        response = await updateCategory(
          selectedCategory._id,
          formData.name,
          formData.slug,
          formData.description,
          formData.parentCategoryId,
          formData.isActive
        );
      }
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Lưu thất bại");
      }
      await fetchAllCategories();
      setShowModal(false);
      toast.success(
        modalMode === "add"
          ? "Thêm danh mục thành công!"
          : "Cập nhật danh mục thành công!"
      );
    } catch (err) {
      toast.error((err as Error).message || "Lỗi khi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const CategoryItem = ({
    category,
    level = 0,
  }: {
    category: Category;
    level?: number;
  }) => {
    const children = getChildCategories(category._id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category._id);

    return (
      <div className="border-b border-white/10 last:border-b-0">
        <div
          className={`flex justify-between items-center py-4 px-4 transition-colors hover:bg-white/5 ${
            !category.isActive ? "opacity-60" : ""
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category._id)}
                className="p-1 hover:bg-white/10 rounded transition-all"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-white/70" />
                ) : (
                  <ChevronRight size={16} className="text-white/70" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <FolderTree size={18} className="text-blue-400" />

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">
                {category.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/70">
                  {category.slug}
                </span>
                {category.description && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-xs">
                      {category.description}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="truncate">
                  {new Date(category.updatedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                category.isActive
                  ? "bg-green-900/20 text-green-400 border border-green-400/30"
                  : "bg-red-900/20 text-red-400 border border-red-400/30"
              }`}
            >
              {category.isActive ? "Hoạt động" : "Tạm dừng"}
            </span>
            <button
              onClick={() => openAddModal(category._id)}
              className="p-2 text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Thêm danh mục con"
              disabled={!category.isActive || loading}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="p-2 text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Chỉnh sửa"
              disabled={loading}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() =>
                category.isActive
                  ? handleDeactivate(category._id, hasChildren)
                  : handleHardDelete(category._id)
              }
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Xóa"
              disabled={loading}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="bg-white/5">
            {children.map((child) => (
              <CategoryItem
                key={child._id}
                category={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = getRootCategories();

  const Pagination = () => {
    const totalRootCategories = allCategories.filter(
      (cat) => cat.parentCategoryId === null
    ).length;
    const totalPages = Math.ceil(totalRootCategories / pagination.itemsPerPage);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white/70 bg-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={
              pagination.currentPage === totalPages || totalRootCategories === 0
            }
            className="relative ml-3 inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white/70 bg-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">
              Hiển thị{" "}
              <span className="font-medium text-white">
                {totalRootCategories === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.itemsPerPage + 1}
              </span>{" "}
              đến{" "}
              <span className="font-medium text-white">
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  totalRootCategories
                )}
              </span>{" "}
              của{" "}
              <span className="font-medium text-white">
                {totalRootCategories}
              </span>{" "}
              kết quả
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.itemsPerPage}
              onChange={(e) =>
                handleItemsPerPageChange(parseInt(e.target.value))
              }
              className="px-2 py-1 border border-white/20 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white/5 text-white"
            >
              <option
                value={5}
                style={{ backgroundColor: "#111827", color: "white" }}
              >
                5
              </option>
              <option
                value={10}
                style={{ backgroundColor: "#111827", color: "white" }}
              >
                10
              </option>
              <option
                value={20}
                style={{ backgroundColor: "#111827", color: "white" }}
              >
                20
              </option>
              <option
                value={50}
                style={{ backgroundColor: "#111827", color: "white" }}
              >
                50
              </option>
            </select>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/20 bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium ${
                      pagination.currentPage === page
                        ? "z-10 bg-white/10 border-blue-400 text-blue-400"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={
                  pagination.currentPage === totalPages ||
                  totalRootCategories === 0
                }
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/20 bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 disabled:opacity-50"
              >
                Sau
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-white">
            Danh sách danh mục
          </h1>
          <div className="flex items-center gap-2">

            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="Tìm theo tên, đường dẫn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={sort.field}
                onChange={(e) => handleSort(e.target.value as SortField)}
                className="px-3 py-2 bg-white/10 border-white/20 rounded text-white/70 focus:border-blue-400 focus:outline-none"
              >
                <option
                  value="name"
                  style={{ backgroundColor: "#111827", color: "white" }}
                >
                  Tên
                </option>
                <option
                  value="slug"
                  style={{ backgroundColor: "#111827", color: "white" }}
                >
                  Đường dẫn
                </option>
                <option
                  value="updatedAt"
                  style={{ backgroundColor: "#111827", color: "white" }}
                >
                  Ngày cập nhật
                </option>
              </select>
              <button
                onClick={() => handleSort(sort.field)}
                className="p-2 bg-white/10 border-white/20 rounded hover:bg-white/5 text-white/70 transition-colors"
              >
                <ArrowUpDown
                  size={16}
                  className={sort.order === "asc" ? "rotate-0" : "rotate-180"}
                />
              </button>
            </div>
            <button
              onClick={() => openAddModal()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-semibold transition-colors"
              disabled={loading}
            >
              + Thêm danh mục
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/10">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            </div>
          ) : rootCategories.length > 0 ? (
            <>
              {rootCategories.map((category) => {
                const tree = buildTree(category);
                return <CategoryItem key={category._id} category={tree} />;
              })}
              <Pagination />
            </>
          ) : (
            <div className="text-center py-16 text-white/60">
              <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy danh mục nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/10 border-b border-white/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {modalMode === "add"
                  ? "Thêm danh mục sản phẩm mới"
                  : "Chỉnh sửa danh mục sản phẩm"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white/10 border-white/20 rounded focus:border-blue-400 focus:outline-none transition-colors text-white"
                  placeholder="Nhập tên danh mục"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Đường dẫn *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white/10 border-white/20 rounded focus:border-blue-400 focus:outline-none transition-colors font-mono text-white"
                  placeholder="duong-dan-danh-muc"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Mô tả
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white/10 border-white/20 rounded focus:border-blue-400 focus:outline-none transition-colors resize-none text-white"
                  placeholder="Nhập mô tả cho danh mục"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Danh mục cha
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white/10 border-white/20 rounded focus:border-blue-400 focus:outline-none transition-colors text-white"
                  value={formData.parentCategoryId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentCategoryId: e.target.value || null,
                    })
                  }
                >
                  <option
                    value=""
                    style={{ backgroundColor: "#111827", color: "white" }}
                  >
                    -- Không có (Danh mục gốc) --
                  </option>
                  {allCategories
                    .filter((cat) => cat.isActive)
                    .map((cat) => (
                      <option
                        key={cat._id}
                        value={cat._id}
                        style={{ backgroundColor: "#111827", color: "white" }}
                      >
                        {"  ".repeat(cat.level || 0)}└─ {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 rounded border-white/20 text-blue-400 focus:ring-blue-400 bg-white/10"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-white/70"
                >
                  Kích hoạt danh mục
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/5 border-t border-white/20 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white/10 border-white/20 text-white/70 rounded font-semibold hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                <X size={16} className="inline mr-2" />
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition-all disabled:opacity-50"
              >
                <Check size={16} className="inline mr-2" />
                {loading
                  ? "Đang xử lý..."
                  : modalMode === "add"
                  ? "Thêm mới"
                  : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg w-full max-w-md">
            <div className="sticky top-0 bg-white/10 border-b border-white/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{confirmTitle}</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-white/70 text-sm">{confirmMessage}</p>
            </div>

            <div className="sticky bottom-0 bg-white/5 border-t border-white/20 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 bg-white/10 border-white/20 text-white/70 rounded font-semibold hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={() => confirmOnYes()}
                disabled={loading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded font-semibold transition-all disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
