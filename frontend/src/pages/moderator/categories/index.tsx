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

export default function CategoryManager() {
  const [allCategories, setAllCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmOnYes, setConfirmOnYes] = useState<() => Promise<void>>(
    async () => {}
  );
  const [confirmContext, setConfirmContext] = useState("");
  const [modalMode, setModalMode] = useState("add");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentCategoryId: null,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 5,
  });
  const [sort, setSort] = useState({ field: "name", order: "asc" });

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
      const processedData = data.map((cat) => ({
        ...cat,
        _id: cat._id || cat.id,
        parentCategoryId:
          cat.parentCategoryId === "" ? null : cat.parentCategoryId,
        level: cat.level || 0,
        path: cat.path || [cat.name],
      }));
      setAllCategories(processedData);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const getRootCategories = () => {
    let roots = allCategories.filter((cat) => cat.parentCategoryId === null);
    // Sort
    roots.sort((a, b) => {
      let aVal = a[sort.field];
      let bVal = b[sort.field];
      if (sort.field === "updatedAt" || sort.field === "createdAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return sort.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.order === "asc" ? 1 : -1;
      return 0;
    });
    // Paginate
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginatedRoots = roots.slice(startIndex, endIndex);
    return paginatedRoots;
  };

  const handleSort = (field: string) => {
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

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
    else newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const getChildCategories = (parentId) => {
    return allCategories.filter(
      (cat) => cat.parentCategoryId?.toString() === parentId
    );
  };

  const buildTree = (cat, level = 0) => {
    const children = getChildCategories(cat._id);
    return {
      ...cat,
      level,
      children: children.map((child) => buildTree(child, level + 1)),
    };
  };

  const getParentCategory = (categoryId) => {
    return allCategories.find((cat) => cat._id === categoryId);
  };

  const handleDeactivate = (categoryId, hasChildren) => {
    const message = "Bạn có chắc chắn muốn vô hiệu hóa danh mục này?";
    let fullMessage = message;
    if (hasChildren) {
      fullMessage +=
        " Danh mục có danh mục con. Nếu bạn vô hiệu hóa danh mục cha, tất cả danh mục con cũng sẽ bị vô hiệu hóa.";
    }
    setConfirmTitle("Xác nhận vô hiệu hóa danh mục");
    setConfirmMessage(fullMessage);
    setConfirmContext("deactivate");
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
        toast.error(err.message || "Không thể thực hiện thao tác");
      } finally {
        setLoading(false);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleHardDelete = (categoryId) => {
    setConfirmTitle("Xác nhận xóa vĩnh viễn");
    setConfirmMessage(
      "Bạn có chắc chắn muốn xóa vĩnh viễn danh mục này khỏi hệ thống? Hành động này không thể hoàn tác."
    );
    setConfirmContext("delete");
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
        toast.error(err.message || "Không thể xóa danh mục");
      } finally {
        setLoading(false);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const openAddModal = (parentId = null) => {
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

  const openEditModal = (category) => {
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
        setConfirmContext("update-deactivate");
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
            toast.error(err.message || "Lỗi khi cập nhật danh mục");
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
      toast.error(err.message || "Lỗi khi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const CategoryItem = ({ category, level = 0 }) => {
    const children = getChildCategories(category._id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category._id);

    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div
          className={`flex justify-between items-center py-4 px-4 transition-colors hover:bg-gray-50 ${
            !category.isActive ? "opacity-60" : ""
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category._id)}
                className="p-1 hover:bg-gray-200 rounded transition-all"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <FolderTree size={18} className="text-blue-600" />

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 text-sm">
                {category.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                category.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {category.isActive ? "Hoạt động" : "Tạm dừng"}
            </span>
            <button
              onClick={() => openAddModal(category._id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Thêm danh mục con"
              disabled={!category.isActive || loading}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
              disabled={loading}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
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
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={
              pagination.currentPage === totalPages || totalRootCategories === 0
            }
            className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị{" "}
              <span className="font-medium">
                {totalRootCategories === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.itemsPerPage + 1}
              </span>{" "}
              đến{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  totalRootCategories
                )}
              </span>{" "}
              của <span className="font-medium">{totalRootCategories}</span> kết
              quả
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.itemsPerPage}
              onChange={(e) =>
                handleItemsPerPageChange(parseInt(e.target.value))
              }
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      pagination.currentPage === page
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white text-gray-700 hover:bg-gray-50"
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
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <FolderTree size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý Danh mục
              </h1>
            </div>
            <button
              onClick={() => openAddModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              disabled={loading}
            >
              <Plus size={18} />
              Thêm danh mục
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Tìm kiếm danh mục theo tên hoặc slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={sort.field}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                <option value="name">Tên</option>
                <option value="slug">Slug</option>
                <option value="updatedAt">Ngày cập nhật</option>
              </select>
              <button
                onClick={() => handleSort(sort.field)}
                className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ArrowUpDown
                  size={16}
                  className={sort.order === "asc" ? "rotate-0" : "rotate-180"}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Category List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : rootCategories.length > 0 ? (
            <>
              {rootCategories.map((category) => {
                const tree = buildTree(category);
                return <CategoryItem key={category._id} category={tree} />;
              })}
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy danh mục nào</p>
            </div>
          )}
          <Pagination />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "add"
                    ? "Thêm danh mục mới"
                    : "Chỉnh sửa danh mục"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Nhập tên danh mục"
                    value={formData.name}
                    onChange={handleNameChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors font-mono"
                    placeholder="slug-danh-muc"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    placeholder="Nhập mô tả cho danh mục"
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Danh mục cha
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    value={formData.parentCategoryId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parentCategoryId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {allCategories
                      .filter((cat) => cat.isActive)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {"  ".repeat(cat.level)}└─ {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700"
                  >
                    Kích hoạt danh mục
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <X size={16} />
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  <Check size={16} />
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {confirmTitle}
                </h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-700 text-sm">{confirmMessage}</p>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmOnYes}
                  disabled={loading}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
