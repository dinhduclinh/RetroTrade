"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/redux_store';
import { getItemById } from '@/services/products/product.api';
import AddToCart from '@/components/ui/common/AddToCart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/common/card';
import { Badge } from '@/components/ui/common/badge';
import { Button } from '@/components/ui/common/button';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Eye, 
  Package, 
  User, 
  Star,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface ProductDetail {
  _id: string;
  Title: string;
  ShortDescription: string;
  Description: string;
  BasePrice: number;
  DepositAmount: number;
  Currency: string;
  AvailableQuantity: number;
  MinRentalDuration: number;
  MaxRentalDuration: number;
  ViewCount: number;
  RentCount: number;
  City: string;
  District: string;
  Address: string;
  CategoryId: {
    _id: string;
    CategoryName: string;
  };
  ConditionId: {
    ConditionName: string;
  };
  PriceUnitId: {
    UnitName: string;
  };
  OwnerId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  Tags: Array<{
    _id: string;
    TagName: string;
  }>;
  Images: Array<{
    _id: string;
    Url: string;
    IsPrimary: boolean;
  }>;
  createdAt: string;
}

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getItemById(id);
        
        if (response.code === 200 && response.data) {
          setProduct(response.data);
        } else {
          setError(response.message || 'Không tìm thấy sản phẩm');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Có lỗi xảy ra khi tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {error || 'Không tìm thấy sản phẩm'}
              </h2>
              <Button onClick={handleBack} className="mt-4">
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const primaryImage = product.Images?.find(img => img.IsPrimary)?.Url || product.Images?.[0]?.Url;
  const otherImages = product.Images?.filter(img => !img.IsPrimary) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 bg-white rounded-lg overflow-hidden">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={product.Title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {otherImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {otherImages.map((image, index) => (
                  <div
                    key={image._id}
                    className="relative h-20 bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setSelectedImageIndex(index + 1)}
                  >
                    <Image
                      src={image.Url}
                      alt={`${product.Title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Title & Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {product.Title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{product.CategoryId.CategoryName}</Badge>
                <Badge variant="outline">{product.ConditionId.ConditionName}</Badge>
                <Badge variant="outline">{product.PriceUnitId.UnitName}</Badge>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                {product.ShortDescription}
              </p>
            </div>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Thông tin giá
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Giá thuê:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatPrice(product.BasePrice)} {product.Currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tiền cọc:</span>
                  <span className="text-xl font-semibold">
                    {formatPrice(product.DepositAmount)} {product.Currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Còn lại:</span>
                  <span className="font-medium">
                    {product.AvailableQuantity} sản phẩm
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin chủ sở hữu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {product.OwnerId.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.OwnerId.fullName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.OwnerId.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Vị trí
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.Address}, {product.District}, {product.City}
                </p>
              </CardContent>
            </Card>

            {/* Rental Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Thời gian thuê
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tối thiểu:</span>
                  <span className="font-medium">{product.MinRentalDuration} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tối đa:</span>
                  <span className="font-medium">{product.MaxRentalDuration} ngày</span>
                </div>
              </CardContent>
            </Card>

            {/* Add to Cart */}
            {accessToken && (
              <AddToCart
                itemId={product._id}
                availableQuantity={product.AvailableQuantity}
                basePrice={product.BasePrice}
                depositAmount={product.DepositAmount}
                currency={product.Currency}
                title={product.Title}
                ownerId={product.OwnerId._id}
              />
            )}

            {!accessToken && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng
                  </p>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href="/auth/login">Đăng nhập</Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link href="/auth/register">Đăng ký</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Mô tả chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {product.Description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        {product.Tags && product.Tags.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.Tags.map((tag) => (
                    <Badge key={tag._id} variant="outline">
                      {tag.TagName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {product.ViewCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lượt xem</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {product.RentCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lượt thuê</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(product.createdAt)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ngày đăng</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
