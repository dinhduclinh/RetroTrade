"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

import {
  Search,
  Package,
  Eye,
  Check,
  X,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import {
  getPendingProducts,
  getPendingProductDetails,
  approveProduct,
  rejectProduct,
} from "@/services/products/product.api";
import ProductDetail from "./product-detail";

interface PendingProduct {
  id: string;
  title: string;
  ownerId: string;
  ownerName?: string;
  thumbnailUrl?: string;
  categoryName?: string;
  basePrice: number;
  currency: string;
  priceUnitName?: string;
  createdAt: string;
  createdAtTimestamp: number;
  status: "pending";
}

interface ProductDetails {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  depositAmount: number;
  currency: string;
  categoryName?: string;
  ownerName?: string;
  conditionName?: string;
  priceUnitName?: string;
  minRentalDuration?: number;
  maxRentalDuration?: number;
  quantity: number;
  availableQuantity: number;
  address?: string;
  city?: string;
  district?: string;
  images: { url: string; isPrimary: boolean }[];
}

interface FormData {
  reason: string;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

type SortField = "title" | "createdAt" | "basePrice";
interface SortState {
  field: SortField;
  order: "asc" | "desc";
}

export default function PendingProductsManager() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmOnYes, setConfirmOnYes] = useState<() => void>(() => () => {});
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(
    null
  );
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({ reason: "" });
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 5,
  });
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const response = await getPendingProducts();
      if (!response.ok)
        throw new Error("Không thể tải danh sách sản phẩm chờ duyệt");
      const apiData = await response.json();
      const data = apiData.data || [];
      if (!Array.isArray(data)) throw new Error("Dữ liệu không hợp lệ");
      const processedData = data
        .map((item) => {
          const createdDate = new Date(item.createdAt || item.CreatedAt);
          return {
            id: item._id || item.id || "",
            title: item.Title || item.title || "",
            ownerId: item.ownerId || item.OwnerId || "",
            ownerName: item.ownerName || "",
            thumbnailUrl:
              item.thumbnailUrl ||
              item.images?.[0]?.url ||
              "/placeholder-image.jpg",
            categoryName: item.categoryName || "N/A",
            basePrice: item.basePrice || item.BasePrice || 0,
            currency: item.currency || "VND",
            priceUnitName: item.priceUnitName || "N/A",
            createdAt: createdDate.toLocaleDateString("vi-VN"),
            createdAtTimestamp: createdDate.getTime(),
            status: "pending" as const,
          };
        })
        .filter((p) => p.id);
      setProducts(processedData);
    } catch (err) {
      toast.error(
        (err as Error).message || "Không thể tải danh sách sản phẩm chờ duyệt"
      );
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (prod) =>
          prod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prod.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prod.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      let cmp: number;
      if (sort.field === "createdAt") {
        cmp = a.createdAtTimestamp - b.createdAtTimestamp;
      } else if (sort.field === "basePrice") {
        cmp = a.basePrice - b.basePrice;
      } else {
        cmp = a[sort.field].localeCompare(b[sort.field]);
      }
      return sort.order === "asc" ? cmp : -cmp;
    });

    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    return { paginated, total: filtered.length };
  };

  const { paginated: filteredProducts, total } = getFilteredProducts();

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

  const viewDetails = async (id: string) => {
    if (!id || id.length !== 24) {
      toast.error("ID sản phẩm không hợp lệ");
      return;
    }
    try {
      setDetailsLoading(true);
      const response = await getPendingProductDetails(id);
      if (!response.ok) throw new Error("Không thể tải chi tiết sản phẩm");
      const data = await response.json();
      setProductDetails({
        id: data._id || data.id || "",
        title: data.Title || data.title || "",
        shortDescription: data.ShortDescription || data.shortDescription || "",
        description: data.Description || data.description || "",
        basePrice: data.BasePrice || data.basePrice || 0,
        depositAmount: data.DepositAmount || data.depositAmount || 0,
        currency: data.Currency || data.currency || "VND",
        categoryName: data.categoryName || data.Category?.name || "N/A",
        ownerName: data.ownerName || data.ownerInfo?.fullName || "N/A",
        conditionName: data.conditionName || "N/A",
        priceUnitName: data.priceUnitName || "N/A",
        minRentalDuration: data.MinRentalDuration || 0,
        maxRentalDuration: data.MaxRentalDuration || 0,
        quantity: data.Quantity || 0,
        availableQuantity: data.AvailableQuantity || 0,
        address: data.Address || "",
        city: data.City || "",
        district: data.District || "",
        images: data.images
          ? data.images.map(
              (img: {
                Url?: string;
                url?: string;
                IsPrimary?: boolean;
                isPrimary?: boolean;
              }) => ({
                url: img.Url || img.url || "",
                isPrimary: img.IsPrimary || img.isPrimary || false,
              })
            )
          : [],
      });
      setSelectedProduct(products.find((p) => p.id === id) || null);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error((err as Error).message || "Không thể tải chi tiết sản phẩm");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = (product: PendingProduct) => {
    if (!product.id || product.id.length !== 24) {
      toast.error("ID sản phẩm không hợp lệ");
      return;
    }
    setSelectedProduct(product);
    setConfirmTitle("Xác nhận duyệt sản phẩm");
    setConfirmMessage(
      `Bạn có chắc chắn muốn duyệt sản phẩm "${product.title}"?`
    );
    setConfirmOnYes(() => async () => {
      try {
        setLoading(true);
        const res = await approveProduct(product.id);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Duyệt thất bại");
        }
        const result = await res.json();
        toast.success(result.message || "Duyệt sản phẩm thành công!");
        await fetchPendingProducts();
      } catch (err) {
        toast.error((err as Error).message || "Không thể duyệt sản phẩm");
      } finally {
        setLoading(false);
        setShowConfirmApprove(false);
      }
    });
    setShowConfirmApprove(true);
  };

  const handleReject = (product: PendingProduct) => {
    if (!product.id || product.id.length !== 24) {
      toast.error("ID sản phẩm không hợp lệ");
      return;
    }
    setSelectedProduct(product);
    setFormData({ reason: "" });
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedProduct || !formData.reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối!");
      return;
    }
    if (!selectedProduct.id || selectedProduct.id.length !== 24) {
      toast.error("ID sản phẩm không hợp lệ");
      return;
    }
    try {
      setLoading(true);
      const res = await rejectProduct(selectedProduct.id, formData.reason);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Từ chối thất bại");
      }
      const result = await res.json();
      toast.success(result.message || "Từ chối sản phẩm thành công!");
      setShowRejectModal(false);
      await fetchPendingProducts();
    } catch (err) {
      toast.error((err as Error).message || "Không thể từ chối sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const Pagination = () => {
    const totalPages = Math.ceil(total / pagination.itemsPerPage);
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
            disabled={pagination.currentPage === totalPages || total === 0}
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
                {total === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.itemsPerPage + 1}
              </span>{" "}
              đến{" "}
              <span className="font-medium text-white">
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  total
                )}
              </span>{" "}
              của <span className="font-medium text-white">{total}</span> kết
              quả
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
                disabled={pagination.currentPage === totalPages || total === 0}
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
          <h1 className="text-xl font-bold text-white">Sản phẩm chờ duyệt</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="Tìm theo tiêu đề, chủ sở hữu, danh mục..."
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
                  value="title"
                  style={{ backgroundColor: "#111827", color: "white" }}
                >
                  Tiêu đề
                </option>
                <option
                  value="createdAt"
                  style={{ backgroundColor: "#111827", color: "white" }}
                >
                  Ngày tạo
                </option>
                <option
                  value="basePrice"
                  style={{ backgroundColor: "#111827", color: "white" }}
                >
                  Giá cơ bản
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
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/10">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin h-8 w-8 text-blue-400" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Chủ sở hữu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/5 divide-y divide-white/10">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="relative">
                        {product.thumbnailUrl ? (
                          <Image
                            src={
                              product.thumbnailUrl || "/placeholder-image.jpg"
                            }
                            alt={product.title || "Product thumbnail"}
                            width={48}
                            height={48}
                            className="h-12 w-12 object-cover rounded border border-white/20"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const sibling =
                                target.nextElementSibling as HTMLElement | null;
                              if (sibling) {
                                target.style.display = "none";
                                sibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`h-12 w-12 bg-white/10 rounded border border-white/20 flex items-center justify-center transition-all ${
                            product.thumbnailUrl
                              ? "absolute inset-0 opacity-0"
                              : ""
                          }`}
                          style={{
                            display: product.thumbnailUrl ? "none" : "flex",
                          }}
                        >
                          <Package size={16} className="text-white/50" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap max-w-48">
                      <div className="text-sm font-medium text-white truncate">
                        {product.title}
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        {product.categoryName}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap max-w-32">
                      <div className="text-sm text-white truncate">
                        {product.ownerName || product.ownerId}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {product.basePrice.toLocaleString()} {product.currency}/
                      {product.priceUnitName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap max-w-32">
                      <div className="text-sm text-white/70 truncate">
                        {product.createdAt}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-900/20 text-yellow-400 border border-yellow-400/30">
                        Chờ duyệt
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => viewDetails(product.id)}
                          className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                          title="Xem chi tiết"
                          disabled={loading || detailsLoading}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleApprove(product)}
                          className="p-2 text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
                          title="Duyệt"
                          disabled={loading}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(product)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Từ chối"
                          disabled={loading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-white/60">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy sản phẩm chờ duyệt nào</p>
            </div>
          )}
        </div>
        <Pagination />
      </div>

      {/* Product Detail Modal */}
      <ProductDetail
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        productDetails={productDetails}
        loading={detailsLoading}
      />

      {/* Reject Modal*/}
      {showRejectModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/10 border-b border-white/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Từ chối sản phẩm</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-white/70">Sản phẩm: {selectedProduct.title}</p>
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Lý do từ chối *
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white/10 border-white/20 rounded focus:border-red-400 focus:outline-none transition-colors resize-none text-white"
                  placeholder="Nhập lý do từ chối..."
                  rows={4}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white/5 border-t border-white/20 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 bg-white/10 border-white/20 text-white/70 rounded font-semibold hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                <X size={16} className="inline mr-2" /> Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={loading || !formData.reason.trim()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded font-semibold transition-all disabled:opacity-50"
              >
                <X size={16} className="inline mr-2" />
                {loading ? "Đang xử lý..." : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve Modal*/}
      {showConfirmApprove && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg w-full max-w-md">
            <div className="sticky top-0 bg-white/10 border-b border-white/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{confirmTitle}</h2>
              <button
                onClick={() => setShowConfirmApprove(false)}
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
                onClick={() => setShowConfirmApprove(false)}
                className="px-5 py-2.5 bg-white/10 border-white/20 text-white/70 rounded font-semibold hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={() => confirmOnYes()}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition-all disabled:opacity-50"
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
