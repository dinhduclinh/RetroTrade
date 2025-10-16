"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Edit2,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  MapPin,
  Package,
  DollarSign,
  X,
} from "lucide-react";
import {
  getUserProducts,
  deleteProduct,
} from "@/services/products/product.api";
import { toast } from "sonner";

export default function MyProductsList() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserProducts();
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data.items || []);
        setFilteredProducts(data.data.items || []);
      } else {
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi lấy sản phẩm:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = products;

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (p: any) => p.StatusId === parseInt(statusFilter)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p: any) =>
          p.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.ShortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [statusFilter, searchTerm, products]);

  const getStatusInfo = (statusId: number) => {
    const statuses = {
      1: {
        label: "Chờ duyệt",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      2: {
        label: "Đã duyệt",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      3: {
        label: "Bị từ chối",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };
    return statuses[statusId] || statuses[1];
  };

  const getConditionName = (product: any) => {
    return product.Condition?.ConditionName || "Không rõ";
  };

  const getPriceUnitName = (product: any) => {
    return product.PriceUnit?.UnitName || "ngày";
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }
    return `$${price}`;
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await deleteProduct(productToDelete._id);
      if (response.ok) {
        setProducts(products.filter((p: any) => p._id !== productToDelete._id));
        setFilteredProducts(
          filteredProducts.filter((p: any) => p._id !== productToDelete._id)
        );
        setShowDeleteModal(false);
        setProductToDelete(null);
        toast.success("Xóa sản phẩm thành công!");
      } else {
        const errorData = await response.json();
        toast.error(`Lỗi: ${errorData.message || "Không thể xóa sản phẩm."}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    }
  };

  const StatusStats = () => {
    const pending = products.filter((p: any) => p.StatusId === 1).length;
    const approved = products.filter((p: any) => p.StatusId === 2).length;
    const rejected = products.filter((p: any) => p.StatusId === 3).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-600">{pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600">{approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bị từ chối</p>
              <p className="text-2xl font-bold text-red-600">{rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <XCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Lỗi tải dữ liệu
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Sản phẩm của tôi
                </h1>
                <p className="text-gray-600">
                  Quản lý và theo dõi các sản phẩm cho thuê của bạn
                </p>
              </div>
              <Link
                href="/products/myproducts/add"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Plus size={20} />
                Đăng sản phẩm mới
              </Link>
            </div>
          </div>

          {/* Stats */}
          <StatusStats />

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="1">Chờ duyệt</option>
                  <option value="2">Đã duyệt</option>
                  <option value="3">Bị từ chối</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Đang tải...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có sản phẩm nào
              </h3>
              <p className="text-gray-600 mb-6">
                Hãy đăng sản phẩm đầu tiên của bạn!
              </p>
              <Link
                href="/products/myproducts/add"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Đăng sản phẩm mới
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: any) => {
                const statusInfo = getStatusInfo(product.StatusId);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {product.Images && product.Images.length > 0 ? (
                        <Image
                          src={product.Images[0].Url}
                          alt={product.Title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={48} className="text-gray-400" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div
                        className={`absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.color}`}
                      >
                        <StatusIcon size={14} />
                        {statusInfo.label}
                      </div>

                      {/* Available Badge */}
                      {product.AvailableQuantity === 0 && (
                        <div className="absolute top-3 right-3 bg-gray-900 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                          Đã cho thuê hết
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.Title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.ShortDescription}
                      </p>

                      {/* Category & Condition */}
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {product.CategoryId?.Name || "Chưa phân loại"}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {getConditionName(product)}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="truncate">
                          {product.District}, {product.City}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              Giá thuê
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatPrice(product.BasePrice, product.Currency)}
                              <span className="text-sm font-normal text-gray-600">
                                /{getPriceUnitName(product)}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">
                              Đặt cọc
                            </p>
                            <p className="text-sm font-semibold text-gray-700">
                              {formatPrice(
                                product.DepositAmount,
                                product.Currency
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{product.ViewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package size={14} />
                          <span>{product.RentCount} lượt thuê</span>
                        </div>
                        <div>
                          <span className="font-semibold">
                            {product.AvailableQuantity}/{product.Quantity}
                          </span>{" "}
                          còn lại
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/products/myproducts/update/${product._id}`} // Sử dụng _id thay vì ItemGuid để khớp với backend
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 size={16} />
                          Chỉnh sửa
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <Trash2 className="text-red-600" size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Xác nhận xóa sản phẩm
                </h3>

                <p className="text-gray-600 text-center mb-6">
                  Bạn có chắc chắn muốn xóa sản phẩm{" "}
                  <span className="font-semibold">
                    "{productToDelete?.Title}"
                  </span>
                  ? Hành động này không thể hoàn tác.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Xóa sản phẩm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
