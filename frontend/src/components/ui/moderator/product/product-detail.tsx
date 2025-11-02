"use client";
import Image from "next/image";
import { X, Hash, Users, DollarSign, Clock, MapPin } from "lucide-react";

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

interface ProductDetailProps {
  isOpen: boolean;
  onClose: () => void;
  productDetails: ProductDetails | null;
  loading: boolean;
}

export default function ProductDetail({
  isOpen,
  onClose,
  productDetails,
  loading,
}: ProductDetailProps) {
  if (!isOpen || !productDetails) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 p-4 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết sản phẩm</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="relative">
                  <div className="relative">
                    <Image
                      src={
                        productDetails.images.find((img) => img.isPrimary)
                          ?.url ||
                        productDetails.images[0]?.url ||
                        "/placeholder.jpg"
                      }
                      alt={productDetails.title || "Product image"}
                      width={800}
                      height={400}
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                  {productDetails.images.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {productDetails.images.map((img, idx) => (
                        <div key={idx} className="relative flex-shrink-0">
                          <Image
                            src={img.url || "/placeholder-image.jpg"}
                            alt={`Thumbnail ${idx + 1}`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-image.jpg";
                            }}
                          />

                          {img.isPrimary && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                              Chính
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title & Basic Info */}
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {productDetails.title}
                  </h1>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Hash size={16} />
                    <span className="text-sm">
                      {productDetails.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Users size={16} />
                    <span className="text-sm">
                      Chủ sở hữu: {productDetails.ownerName}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} />
                      <span className="text-lg font-semibold text-gray-900">
                        {productDetails.basePrice.toLocaleString()}{" "}
                        {productDetails.currency}/{productDetails.priceUnitName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>
                        Thời hạn: {productDetails.minRentalDuration} -{" "}
                        {productDetails.maxRentalDuration}{" "}
                        {productDetails.priceUnitName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>
                        Số lượng: {productDetails.availableQuantity}/
                        {productDetails.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {productDetails.shortDescription && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Mô tả ngắn
                  </h3>
                  <p className="text-gray-600">
                    {productDetails.shortDescription}
                  </p>
                </div>
              )}
              {productDetails.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Mô tả chi tiết
                  </h3>
                  <div className="prose max-w-none bg-gray-50 p-4 rounded-lg text-gray-900">
                    <div
                      className="text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: productDetails.description,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign size={16} /> Tiền đặt cọc
                  </h4>
                  <p className="text-gray-900 text-lg">
                    {productDetails.depositAmount.toLocaleString()}{" "}
                    {productDetails.currency}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    Tình trạng
                  </h4>
                  <p className="text-gray-900">{productDetails.conditionName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} /> Vị trí
                  </h4>
                  <p className="text-gray-900">
                    {productDetails.district || "N/A"},{" "}
                    {productDetails.city || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} /> Địa chỉ chi tiết
                  </h4>
                  <p className="text-gray-900">
                    {productDetails.address || "Chưa cung cấp"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
