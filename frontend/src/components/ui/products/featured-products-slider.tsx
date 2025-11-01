"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Star,
  Eye,
  Package,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  Sparkles,
} from "lucide-react";
import { getHighlightedProducts } from "@/services/products/product.api";

interface Product {
  _id: string;
  title: string;
  shortDescription?: string;
  thumbnail: string;
  basePrice: number;
  currency: string;
  depositAmount: number;
  viewCount?: number;
  rentCount?: number;
  city?: string;
  district?: string;
  priceUnit?: {
    UnitName: string;
  };
}

interface FeaturedProductsSliderProps {
  featuredProducts?: Product[];
  isLoading?: boolean;
  currentSlide?: number;
  onSlideChange?: (index: number) => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  onRefresh?: () => void;
  getVisibleProducts?: () => Product[];
  formatPrice?: (price: number, currency: string) => string;
}

const formatPrice = (price: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }
  return `$${price}`;
};

export default function FeaturedProductsSlider({
  featuredProducts: externalProducts,
  isLoading: externalLoading,
  currentSlide: externalSlide,
  onSlideChange: externalOnSlideChange,
  onNextSlide: externalOnNextSlide,
  onPrevSlide: externalOnPrevSlide,
  onRefresh: externalOnRefresh,
  getVisibleProducts: externalGetVisibleProducts,
  formatPrice: externalFormatPrice,
}: FeaturedProductsSliderProps) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Internal state
  const [internalProducts, setInternalProducts] = useState<Product[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalSlide, setInternalSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Use external props if provided, otherwise use internal state
  const featuredProducts = externalProducts ?? internalProducts;
  const isLoading = externalLoading ?? internalLoading;
  const currentSlide = externalSlide ?? internalSlide;
  const priceFormatter = externalFormatPrice ?? formatPrice;

  const productsLength = featuredProducts?.length || 0;
  const totalSlides = Math.max(1, productsLength - 3);

  // Fetch featured products
  const fetchFeaturedProducts = useCallback(async () => {
    if (externalProducts) return; // Don't fetch if products provided externally

    try {
      setInternalLoading(true);
      const response = await getHighlightedProducts();
      const result = await response.json();

      if (response.ok && result.success) {
        const formattedProducts = (result.data || []).map((product: any) => {
          let thumbnailUrl = product.thumbnail || "/placeholder.jpg";

          if (!thumbnailUrl || thumbnailUrl === "/placeholder.jpg") {
            if (product.images && product.images.length > 0) {
              const firstImage = product.images[0];
              if (typeof firstImage === "object") {
                thumbnailUrl =
                  firstImage.Url || firstImage.url || firstImage.thumbnail || thumbnailUrl;
              } else if (typeof firstImage === "string") {
                thumbnailUrl = firstImage;
              }
            }
          }

          if (thumbnailUrl && thumbnailUrl !== "/placeholder.jpg") {
            if (!thumbnailUrl.startsWith("http") && !thumbnailUrl.startsWith("/")) {
              thumbnailUrl = `/${thumbnailUrl}`;
            }
            if (thumbnailUrl.startsWith("/") && !thumbnailUrl.startsWith("http")) {
              const cleanPath = thumbnailUrl.replace(/^\/+/, "");
              thumbnailUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}/${cleanPath}`;
            }
          }

          const priceUnit =
            (product.priceUnit && (product.priceUnit[0] || product.priceUnit)) ||
            (product.PriceUnit && { UnitName: product.PriceUnit }) ||
            { UnitName: "ngày" };

          return {
            _id: product._id || "",
            title: product.Title || "No title",
            shortDescription: product.Description || "",
            thumbnail: thumbnailUrl,
            basePrice: product.BasePrice || 0,
            currency: product.Currency || "VND",
            depositAmount: product.DepositAmount || 0,
            createdAt: product.CreatedAt || new Date().toISOString(),
            availableQuantity: 1,
            quantity: 1,
            viewCount: product.ViewCount || 0,
            rentCount: product.RentCount || 0,
            favoriteCount: product.FavoriteCount || 0,
            address: [product.Address, product.District, product.City]
              .filter(Boolean)
              .join(", "),
            city: product.City,
            district: product.District,
            condition: product.condition || { ConditionName: "Used" },
            priceUnit: priceUnit,
            category: product.category
              ? {
                  _id: product.category._id || product.CategoryId || "",
                  name: product.category.Name || product.category.name || "",
                }
              : null,
            tags: (product.tags || []).map((tag: any) => ({
              _id: tag._id,
              name: tag.Name || tag.name,
            })),
            isHighlighted: true,
          };
        });

        setInternalProducts(formattedProducts);
      } else {
        throw new Error(result.message || "Failed to fetch highlighted products");
      }
    } catch (err) {
      console.error("Error fetching featured products:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : String(err || "Có lỗi xảy ra khi tải sản phẩm nổi bật");
      toast.error(errorMsg);
    } finally {
      setInternalLoading(false);
    }
  }, [externalProducts]);

  // Fetch on mount if using internal state
  useEffect(() => {
    if (!externalProducts) {
      fetchFeaturedProducts();
    }
  }, [externalProducts, fetchFeaturedProducts]);

  // Slide handlers
  const handleNextSlide = useCallback(() => {
    if (externalOnNextSlide) {
      externalOnNextSlide();
    } else {
      setInternalSlide((prev) => {
        const next = (prev + 1) % totalSlides;
        return next;
      });
    }
  }, [externalOnNextSlide, totalSlides]);

  const handlePrevSlide = useCallback(() => {
    if (externalOnPrevSlide) {
      externalOnPrevSlide();
    } else {
      setInternalSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  }, [externalOnPrevSlide, totalSlides]);

  const handleSlideChange = useCallback((index: number) => {
    if (externalOnSlideChange) {
      externalOnSlideChange(index);
    } else {
      setInternalSlide(index);
    }
  }, [externalOnSlideChange]);

  const handleRefresh = () => {
    if (externalOnRefresh) {
      externalOnRefresh();
    } else {
      fetchFeaturedProducts();
    }
  };

  // Get visible products
  const getVisibleProducts = () => {
    if (externalGetVisibleProducts) {
      return externalGetVisibleProducts();
    }

    if (featuredProducts.length <= 4) return featuredProducts;
    const endIndex = currentSlide + 4;
    if (endIndex > featuredProducts.length) {
      return [
        ...featuredProducts.slice(currentSlide),
        ...featuredProducts.slice(0, endIndex % featuredProducts.length),
      ];
    }
    return featuredProducts.slice(currentSlide, endIndex);
  };

  // Autoplay functionality
  useEffect(() => {
    if (!featuredProducts || productsLength <= 4 || isPaused) return;

    autoplayRef.current = setInterval(() => {
      handleNextSlide();
    }, 4000); // Auto slide every 4 seconds

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [productsLength, isPaused, featuredProducts, handleNextSlide]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-600 animate-pulse" />
            </div>
            <p className="mt-6 text-black font-medium">Đang tải sản phẩm nổi bật...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-6">
              <Package className="w-10 h-10 text-purple-600" />
            </div>
            <p className="text-black text-lg mb-6">Hiện chưa có sản phẩm nổi bật nào</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-16 relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
            <h2 className="text-4xl font-bold text-black">
              Sản phẩm nổi bật
            </h2>
            <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
          <p className="text-black text-lg">Khám phá những sản phẩm được yêu thích nhất</p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Products Grid */}
          <div
            ref={sliderRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ease-in-out"
          >
            {getVisibleProducts().map((product, index) => (
              <div
                key={`${product._id}-${currentSlide}-${index}`}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-gray-100"
                onClick={() => router.push(`/products/details?id=${product._id}`)}
              >
                {/* Image Container */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                  <Image
                    src={product.thumbnail || "/placeholder.jpg"}
                    alt={product.title || "Product image"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/placeholder.jpg") {
                        target.src = "/placeholder.jpg";
                      }
                    }}
                  />
                  
                  {/* Badge */}
                  <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Nổi bật</span>
                  </div>

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Title */}
                  <h3 className="font-bold text-lg text-black line-clamp-2 min-h-[3.5rem] transition-colors duration-300">
                    {product.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-black">
                    <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">
                      {[product.district, product.city].filter(Boolean).join(", ") || "Chưa có địa chỉ"}
                    </span>
                  </div>

                  {/* Price Card */}
                  <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-black mb-1 font-medium">Giá thuê</p>
                        <p className="text-xl font-bold text-black">
                          {priceFormatter(product.basePrice, product.currency)}
                          {product.priceUnit?.UnitName && (
                            <span className="text-sm font-normal text-black">
                              /{product.priceUnit.UnitName}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right border-l border-purple-200 pl-4 ml-4">
                        <p className="text-xs text-black mb-1 font-medium">Đặt cọc</p>
                        <p className="text-base font-bold text-black">
                          {priceFormatter(product.depositAmount, product.currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-black pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{product.viewCount?.toLocaleString() || "0"}</span>
                      <span className="text-black">lượt xem</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{product.rentCount || "0"}</span>
                      <span className="text-black">lượt thuê</span>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {productsLength > 4 && (
            <>
              <button
                onClick={handlePrevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 text-gray-700 hover:text-white rounded-full p-3 shadow-xl z-20 transition-all duration-300 hover:scale-110 hover:shadow-2xl border border-gray-200 group"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleNextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 text-gray-700 hover:text-white rounded-full p-3 shadow-xl z-20 transition-all duration-300 hover:scale-110 hover:shadow-2xl border border-gray-200 group"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {totalSlides > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  className="relative group"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      currentSlide === index
                        ? "w-10 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg"
                        : "w-2 bg-gray-300 hover:bg-gray-400 group-hover:w-6"
                    }`}
                  />
                  {currentSlide === index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse opacity-75"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

