"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Star,
  StarOff,
  Eye,
  Loader2,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import {
  getTopProductsForHighlight,
  toggleProductHighlight,
  getPublicItemById,
} from "@/services/products/product.api";
import ProductDetail from "./product-detail";

interface RawTopProduct {
  _id: string;
  Title: string;
  ownerName?: string;
  categoryName?: string;
  BasePrice: number;
  Currency: string;
  ViewCount: number;
  FavoriteCount: number;
  RentCount: number;
  score: number;
  IsHighlighted: boolean;
  CreatedAt: string;
  thumbnailUrl?: string;
}

interface TopProduct {
  id: string;
  title: string;
  ownerName: string;
  categoryName: string;
  basePrice: number;
  currency: string;
  viewCount: number;
  favoriteCount: number;
  rentCount: number;
  score: number;
  isHighlighted: boolean;
  createdAt: string;
  thumbnailUrl: string;
}

interface PublicItemResponse {
  success: boolean;
  data: {
    _id?: string;
    id?: string;
    Title?: string;
    title?: string;
    ShortDescription?: string;
    shortDescription?: string;
    Description?: string;
    description?: string;
    BasePrice?: number;
    basePrice?: number;
    DepositAmount?: number;
    depositAmount?: number;
    Currency?: string;
    currency?: string;
    Category?: { name?: string };
    Owner?: { FullName?: string; fullName?: string };
    Condition?: { ConditionName?: string };
    PriceUnit?: { UnitName?: string };
    MinRentalDuration?: number;
    MaxRentalDuration?: number;
    Quantity?: number;
    AvailableQuantity?: number;
    Address?: string;
    City?: string;
    District?: string;
    Images?: Array<{
      Url?: string;
      url?: string;
      IsPrimary?: boolean;
      isPrimary?: boolean;
    }>;
  } | null;
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

type SortField = "score" | "createdAt" | "title";
interface SortState {
  field: SortField;
  order: "asc" | "desc";
}

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

export default function TopHighlightTable() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState<TopProduct | null>(null);

  const [sort, setSort] = useState<SortState>({
    field: "score",
    order: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const response = await getTopProductsForHighlight();
      if (!response.ok) throw new Error("Lỗi fetch top products");
      const responseData: { data: RawTopProduct[] } = await response.json();
      const { data } = responseData;
      if (!data) throw new Error("Dữ liệu không hợp lệ");
      const processedData = data.map((item: RawTopProduct) => ({
        id: item._id,
        title: item.Title,
        ownerName: item.ownerName ?? "N/A",
        categoryName: item.categoryName ?? "N/A",
        basePrice: item.BasePrice,
        currency: item.Currency,
        viewCount: item.ViewCount,
        favoriteCount: item.FavoriteCount,
        rentCount: item.RentCount,
        score: Math.round(item.score),
        isHighlighted: item.IsHighlighted,
        createdAt: new Date(item.CreatedAt).toLocaleDateString("vi-VN"),
        thumbnailUrl: item.thumbnailUrl ?? "/placeholder-image.jpg",
      }));
      setProducts(processedData);
      // Reset pagination on refetch
      setCurrentPage(1);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được top products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const allProducts = products;

  // Sort products
  const sortedProducts = [...allProducts].sort((a, b) => {
    let cmp: number;
    switch (sort.field) {
      case "score":
        cmp = a.score - b.score;
        break;
      case "createdAt":
        const aDate = parseDate(a.createdAt);
        const bDate = parseDate(b.createdAt);
        cmp = aDate.getTime() - bDate.getTime();
        break;
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      default:
        return 0;
    }
    return sort.order === "asc" ? cmp : -cmp;
  });

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const openConfirmModal = (product: TopProduct) => {
    setConfirmProduct(product);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!confirmProduct) return;
    setToggleLoading(confirmProduct.id);
    try {
      const res = await toggleProductHighlight(
        confirmProduct.id,
        !confirmProduct.isHighlighted
      );
      if (!res.ok) {
        const errData: { message?: string } = await res.json();
        throw new Error(errData.message || "Toggle thất bại");
      }
      const result: { message?: string } = await res.json();
      toast.success(
        result.message ||
          `Đã ${
            !confirmProduct.isHighlighted ? "nổi bật" : "bỏ nổi bật"
          } sản phẩm`
      );
      // Cập nhật local state thay vì refetch để tránh gián đoạn
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === confirmProduct.id
            ? { ...p, isHighlighted: !p.isHighlighted }
            : p
        )
      );
    } catch (err) {
      toast.error((err as Error).message || "Không thể cập nhật");
    } finally {
      setToggleLoading(null);
      setShowConfirmModal(false);
      setConfirmProduct(null);
    }
  };

  const handleViewDetails = async (id: string) => {
    if (!id || id.length !== 24) {
      toast.error("ID sản phẩm không hợp lệ");
      return;
    }
    try {
      setDetailsLoading(true);
      const response: PublicItemResponse = await getPublicItemById(id);
      if (!response.success || !response.data)
        throw new Error("Không thể tải chi tiết sản phẩm");
      const itemData = response.data;
      console.log("Product details data:", itemData);
      setProductDetails({
        id: itemData._id ?? itemData.id ?? "",
        title: itemData.Title ?? itemData.title ?? "",
        shortDescription:
          itemData.ShortDescription ?? itemData.shortDescription ?? undefined,
        description: itemData.Description ?? itemData.description ?? undefined,
        basePrice: itemData.BasePrice ?? itemData.basePrice ?? 0,
        depositAmount: itemData.DepositAmount ?? itemData.depositAmount ?? 0,
        currency: itemData.Currency ?? itemData.currency ?? "VND",
        categoryName: itemData.Category?.name,
        ownerName: itemData.Owner?.FullName ?? itemData.Owner?.fullName,
        conditionName: itemData.Condition?.ConditionName,
        priceUnitName: itemData.PriceUnit?.UnitName,
        minRentalDuration: itemData.MinRentalDuration,
        maxRentalDuration: itemData.MaxRentalDuration,
        quantity: itemData.Quantity ?? 0,
        availableQuantity: itemData.AvailableQuantity ?? 0,
        address: itemData.Address,
        city: itemData.City,
        district: itemData.District,
        images: itemData.Images
          ? itemData.Images.map((img) => ({
              url: img.Url ?? img.url ?? "",
              isPrimary: img.IsPrimary ?? img.isPrimary ?? false,
            }))
          : [],
      });
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error loading product details:", err);
      toast.error((err as Error).message || "Không thể tải chi tiết sản phẩm");
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const Pagination = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || sortedProducts.length === 0}
            className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-medium text-gray-900">
                {sortedProducts.length === 0 ? 0 : indexOfFirst + 1}
              </span>{" "}
              đến{" "}
              <span className="font-medium text-gray-900">
                {Math.min(indexOfLast, sortedProducts.length)}
              </span>{" "}
              của{" "}
              <span className="font-medium text-gray-900">
                {sortedProducts.length}
              </span>{" "}
              kết quả
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) =>
                handleItemsPerPageChange(parseInt(e.target.value))
              }
              className="px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-900"
            >
              <option
                value={5}
                style={{ backgroundColor: "white", color: "#111827" }}
              >
                5
              </option>
              <option
                value={10}
                style={{ backgroundColor: "white", color: "#111827" }}
              >
                10
              </option>
            </select>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium ${
                      currentPage === page
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage === totalPages || sortedProducts.length === 0
                }
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Top Sản Phẩm Tốt Nhất
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={sort.field}
              onChange={(e) => handleSort(e.target.value as SortField)}
              className="px-3 py-2 bg-gray-50 border-gray-200 rounded text-gray-700 focus:border-blue-400 focus:outline-none"
            >
              <option
                value="score"
                style={{ backgroundColor: "white", color: "#111827" }}
              >
                Score
              </option>
              <option
                value="createdAt"
                style={{ backgroundColor: "white", color: "#111827" }}
              >
                Ngày tạo
              </option>
              <option
                value="title"
                style={{ backgroundColor: "white", color: "#111827" }}
              >
                Tiêu đề
              </option>
            </select>
            <button
              onClick={() => handleSort(sort.field)}
              className="p-2 bg-gray-50 border-gray-200 rounded hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <ArrowUpDown
                size={16}
                className={sort.order === "asc" ? "rotate-0" : "rotate-180"}
              />
            </button>
            <button
              onClick={fetchTopProducts}
              disabled={loading}
              className="p-2 bg-gray-50 border-gray-200 rounded hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Hình Ảnh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tiêu Đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Chủ Sở Hữu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Danh Mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  View / Fav / Rent
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.title}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-cover rounded border border-gray-200"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {product.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {product.createdAt}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {product.ownerName}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {product.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.basePrice.toLocaleString()} {product.currency}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-yellow-600">
                      {product.score}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                    V: {product.viewCount} | F: {product.favoriteCount} | R:{" "}
                    {product.rentCount}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => openConfirmModal(product)}
                        disabled={toggleLoading === product.id}
                        className="p-2 rounded transition-colors disabled:opacity-50 hover:bg-gray-100"
                        title={
                          product.isHighlighted ? "Bỏ nổi bật" : "Đặt nổi bật"
                        }
                      >
                        {product.isHighlighted ? (
                          <Star size={16} className="text-yellow-600" />
                        ) : (
                          <StarOff size={16} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleViewDetails(product.id)}
                        disabled={detailsLoading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentProducts.length === 0 && sortedProducts.length === 0 && (
            <div className="text-center py-16 text-gray-600 absolute inset-0 flex flex-col items-center justify-center">
              <p>Chưa có sản phẩm nào</p>
            </div>
          )}
          {currentProducts.length === 0 && sortedProducts.length > 0 && (
            <div className="text-center py-16 text-gray-600">
              <p>Không tìm thấy sản phẩm nào phù hợp</p>
            </div>
          )}
        </div>

        {sortedProducts.length > 0 && <Pagination />}
      </div>

      {showConfirmModal && confirmProduct && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Xác nhận {confirmProduct.isHighlighted ? "bỏ" : "thêm"} nổi bật
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn{" "}
              {confirmProduct.isHighlighted ? "bỏ" : "thêm"} nổi bật sản
              phẩm&nbsp; &quot;{confirmProduct.title}&quot;?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmProduct(null);
                }}
                className="px-4 py-2 bg-white border border-gray-200 rounded text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmToggle}
                disabled={toggleLoading === confirmProduct.id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
              >
                {toggleLoading === confirmProduct.id ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : null}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductDetail
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        productDetails={productDetails}
        loading={detailsLoading}
      />
    </>
  );
}
