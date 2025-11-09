import { useState, useEffect } from 'react';
import { X, Plus, XCircle, Clock, DollarSign, Heart, Eye, Calendar, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { getComparableProducts } from '@/services/products/product.api';

function formatPrice(amount: number, currency?: string) {
  if (amount == null) return '';
  try {
    const locale = 'vi-VN';
    const currencyCode = currency || 'VND';
    const options: Intl.NumberFormatOptions = { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 };
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch {
    return `${amount} ${currency || ''}`.trim();
  }
}

interface Product {
  _id: string;
  Title: string;
  ShortDescription?: string;
  BasePrice: number;
  DepositAmount: number;
  MinRentalDuration: number;
  MaxRentalDuration: number | null;
  Currency: string;
  Quantity: number;
  AvailableQuantity: number;
  Address?: string;
  City?: string;
  District?: string;
  IsHighlighted: boolean;
  IsTrending: boolean;
  ViewCount: number;
  FavoriteCount: number;
  RentCount: number;
  CreatedAt: string;
  UpdatedAt: string;
  Images: Array<{
    _id: string;
    ItemId: string;
    Url: string;
    IsPrimary: boolean;
    Ordinal: number;
    AltText: string;
    IsDeleted: boolean;
    CreatedAt: string;
    UpdatedAt: string;
    __v: number;
  }>;
  Condition: {
    _id: string;
    ConditionId: number;
    ConditionName: string;
    UpdatedAt: string;
    IsDeleted: boolean;
    CreatedAt: string;
  };
  PriceUnit: {
    _id: string;
    UnitId: number;
    UnitName: string;
    IsDeleted: boolean;
    CreatedAt: string;
    UpdatedAt: string;
  };
  Category?: {
    _id: string;
    name: string;
  };
  Location?: string;
}

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct: any;
}

export default function ProductComparisonModal({ isOpen, onClose, currentProduct }: ProductComparisonModalProps) {
  const [comparableProducts, setComparableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    if (isOpen && currentProduct?._id) {
      setSelectedProducts([currentProduct]);
      fetchComparableProducts();
    }
  }, [isOpen, currentProduct]);

  const fetchComparableProducts = async () => {
    if (!currentProduct?.Category?._id) {
      setError('Không tìm thấy danh mục sản phẩm');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching comparable products for:', {
        productId: currentProduct._id,
        categoryId: currentProduct.Category._id
      });
      
      const response = await getComparableProducts(
        currentProduct._id,
        currentProduct.Category._id,
        5
      );
      
      console.log('Comparable products response:', response);
      
      if (response && response.data) {
        setComparableProducts(response.data);
      } else if (response && response.message) {
        setError(response.message);
      }
    } catch (error: any) {
      console.error('Error loading comparable products:', error);
      setError(error.message || 'Không thể tải sản phẩm so sánh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p._id === product._id);
      
      // If already selected, remove it
      if (isSelected) {
        return prev.filter(p => p._id !== product._id);
      } 
      // If not selected and we have less than 2 products, add it
      else if (prev.length < 2) {
        return [...prev, product];
      }
      // If we already have 2 products, don't add more
      return prev;
    });
  };

  const handleCompare = () => {
    if (selectedProducts.length === 2) {
      setIsComparing(true);
    }
  };

  const resetComparison = () => {
    setIsComparing(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  if (!isOpen) return null;

  // Calculate max height based on viewport
  const maxHeight = `calc(100vh - 100px)`;

  // Render comparison view
  if (isComparing && selectedProducts.length === 2) {
    const [product1, product2] = selectedProducts;
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
        <div 
          className="bg-white p-6 rounded-lg w-full max-w-6xl overflow-y-auto shadow-xl"
          style={{ maxHeight: maxHeight }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">So sánh sản phẩm</h2>
            <button 
              onClick={resetComparison}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Product 1 - Standardized layout */}
            <div className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {product1.Images?.[0]?.Url && (
                <div className="h-64 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={product1.Images[0].Url}
                    alt={product1.Images[0]?.AltText || product1.Title}
                    width={300}
                    height={240}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-gray-800 line-clamp-2" title={product1.Title}>
                {product1.Title}
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-bold text-blue-600 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatPrice(product1.BasePrice, product1.Currency)}
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      /{product1.PriceUnit?.UnitName || 'ngày'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Đặt cọc:</span>{' '}
                    <span className="font-semibold">{formatPrice(product1.DepositAmount, product1.Currency)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Thông tin thuê
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Tối thiểu:</span>
                      <span className="font-medium">{product1.MinRentalDuration} {product1.PriceUnit?.UnitName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Tối đa:</span>
                      <span className="font-medium">{product1.MaxRentalDuration} {product1.PriceUnit?.UnitName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Tình trạng:</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {product1.Condition?.ConditionName || 'Không xác định'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-500">
                      <Eye className="h-4 w-4 mr-1" />
                      {product1.ViewCount || 0}
                    </span>
                    <span className="flex items-center text-gray-500">
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      {product1.FavoriteCount || 0}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Đăng ngày: {new Date(product1.CreatedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
            
            {/* Product 2 - Now matching the same layout */}
            <div className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {product2.Images?.[0]?.Url && (
                <div className="h-64 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={product2.Images[0].Url}
                    alt={product2.Images[0]?.AltText || product2.Title}
                    width={300}
                    height={240}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-gray-800 line-clamp-2" title={product2.Title}>
                {product2.Title}
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-bold text-blue-600 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatPrice(product2.BasePrice, product2.Currency)}
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      /{product2.PriceUnit?.UnitName || 'ngày'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Đặt cọc:</span>{' '}
                    <span className="font-semibold">{formatPrice(product2.DepositAmount, product2.Currency)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Thông tin thuê
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Tối thiểu:</span>
                      <span className="font-medium">{product2.MinRentalDuration} {product2.PriceUnit?.UnitName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Tối đa:</span>
                      <span className="font-medium">{product2.MaxRentalDuration} {product2.PriceUnit?.UnitName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Tình trạng:</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {product2.Condition?.ConditionName || 'Không xác định'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-500">
                      <Eye className="h-4 w-4 mr-1" />
                      {product2.ViewCount || 0}
                    </span>
                    <span className="flex items-center text-gray-500">
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      {product2.FavoriteCount || 0}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Đăng ngày: {new Date(product2.CreatedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Bảng so sánh chi tiết</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Price Row */}
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700 w-1/3">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-blue-500" />
                        Giá thuê
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(product1.BasePrice, product1.Currency)} / {product1.PriceUnit?.UnitName || 'ngày'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(product2.BasePrice, product2.Currency)} / {product2.PriceUnit?.UnitName || 'ngày'}
                    </td>
                  </tr>
                  
                  {/* Deposit Row */}
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                        Tiền đặt cọc
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPrice(product1.DepositAmount, product1.Currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPrice(product2.DepositAmount, product2.Currency)}
                    </td>
                  </tr>
                  
                  {/* Rental Duration */}
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        Thời gian thuê tối thiểu
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product1.MinRentalDuration} {product1.PriceUnit?.UnitName || 'ngày'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product2.MinRentalDuration} {product2.PriceUnit?.UnitName || 'ngày'}
                    </td>
                  </tr>
                  
                  {/* Max Rental Duration */}
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        Thời gian thuê tối đa
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product1.MaxRentalDuration ? `${product1.MaxRentalDuration} ${product1.PriceUnit?.UnitName || 'ngày'}` : 'Không giới hạn'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product2.MaxRentalDuration ? `${product2.MaxRentalDuration} ${product2.PriceUnit?.UnitName || 'ngày'}` : 'Không giới hạn'}
                    </td>
                  </tr>
                  
                  {/* Condition */}
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Tình trạng
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product1.Condition?.ConditionName || 'Không xác định'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product2.Condition?.ConditionName || 'Không xác định'}
                    </td>
                  </tr>
                  
                  {/* Category */}
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Danh mục
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {(() => {
                        const category = product1.Category;
                        if (!category) return 'Không xác định';
                        
                        // Handle case where category might be a string or an object
                        if (typeof category === 'string') return category;
                        
                        // Handle case where category is an object with name property
                        if (category.name) return category.name;
                        
                        // Handle case where category is an array (shouldn't happen with current backend)
                        if (Array.isArray(category) && category.length > 0) {
                          return category[0].name || 'Không xác định';
                        }
                        
                        return 'Không xác định';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {(() => {
                        const category = product2.Category;
                        if (!category) return 'Không xác định';
                        
                        // Handle case where category might be a string or an object
                        if (typeof category === 'string') return category;
                        
                        // Handle case where category is an object with name property
                        if (category.name) return category.name;
                        
                        // Handle case where category is an array (shouldn't happen with current backend)
                        if (Array.isArray(category) && category.length > 0) {
                          return category[0].name || 'Không xác định';
                        }
                        
                        return 'Không xác định';
                      })()}
                    </td>
                  </tr>
                  
                  {/* Location */}
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Địa điểm
                      </div>
                    </th>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product1.Location || `${product1.Address || ''}${product1.City ? `, ${product1.City}` : ''}${product1.District ? `, ${product1.District}` : ''}` || 'Không xác định'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product2.Location || `${product2.Address || ''}${product2.City ? `, ${product2.City}` : ''}${product2.District ? `, ${product2.District}` : ''}` || 'Không xác định'}
                    </td>
                  </tr>
                  
                  {/* Quantity Info */}
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Số lượng
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product1.AvailableQuantity || 0} / {product1.Quantity || 0} sản phẩm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product2.AvailableQuantity || 0} / {product2.Quantity || 0} sản phẩm
                    </td>
                  </tr>
                  
                  {/* Stats */}
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Thống kê
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center" title="Lượt xem">
                          <Eye className="h-4 w-4 mr-1" /> {product1.ViewCount || 0}
                        </span>
                        <span className="flex items-center text-red-500" title="Yêu thích">
                          <Heart className="h-4 w-4 mr-1" /> {product1.FavoriteCount || 0}
                        </span>
                        <span className="flex items-center text-green-500" title="Đã thuê">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          {product1.RentCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center" title="Lượt xem">
                          <Eye className="h-4 w-4 mr-1" /> {product2.ViewCount || 0}
                        </span>
                        <span className="flex items-center text-red-500" title="Yêu thích">
                          <Heart className="h-4 w-4 mr-1" /> {product2.FavoriteCount || 0}
                        </span>
                        <span className="flex items-center text-green-500" title="Đã thuê">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          {product2.RentCount || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Listing Date */}
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        Ngày đăng
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(product1.CreatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(product2.CreatedAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                  
                  {/* Highlights */}
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Nổi bật
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product1.IsHighlighted ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Nổi bật
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Thông thường
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product2.IsHighlighted ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Nổi bật
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Thông thường
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-blue-500" />
                        Lượt xem
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product1.ViewCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product2.ViewCount || 0}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-2 text-red-500" />
                        Yêu thích
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product1.FavoriteCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product2.FavoriteCount || 0}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        Ngày đăng
                      </div>
                    </th>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(product1.CreatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(product2.CreatedAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={resetComparison}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
      <div className="bg-white p-6 rounded-xl w-full max-w-6xl max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">So sánh sản phẩm</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 w-full rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Selected Products */}
        <div className="mb-6">
          {selectedProducts.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sản phẩm đã chọn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProducts.map(product => (
                  <div key={product._id} className="border border-gray-200 rounded-xl p-4 relative shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => removeProduct(product._id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                    >
                      <XCircle size={20} />
                    </button>
                    {product.Images?.[0]?.Url && (
                      <div className="h-48 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <Image
                          src={product.Images[0].Url}
                          alt={product.Title}
                          width={200}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.Title}</h3>
                    <div className="text-lg font-bold text-blue-600 mb-2 flex items-center">
                      {formatPrice(product.BasePrice, product.Currency)}
                      {product.PriceUnit && <span className="text-sm font-normal ml-1">/{product.PriceUnit.UnitName}</span>}
                    </div>
                    {product.Condition && (
                      <div className="text-sm text-gray-600 mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        {product.Condition.ConditionName}
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {product.ViewCount || 0} lượt xem
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1 text-red-500" />
                        {product.FavoriteCount || 0} yêu thích
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Chưa có sản phẩm nào để so sánh
            </div>
          )}
        </div>
          
        {/* Available Products */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Chọn sản phẩm để so sánh</h3>
            {selectedProducts.length >= 2 && (
              <span className="text-sm text-yellow-600 font-medium">Đã chọn tối đa 2 sản phẩm</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-32" />
              ))
            ) : comparableProducts.length > 0 ? (
              comparableProducts.map((product) => {
                const isSelected = selectedProducts.some(p => p._id === product._id);
                const isMaxSelected = selectedProducts.length >= 2 && !isSelected;
                return (
                  <div 
                    key={product._id} 
                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      isMaxSelected ? 'opacity-50 cursor-not-allowed border-gray-300' : 'border-gray-200 hover:border-blue-200'
                    } ${isSelected ? 'border-blue-300 bg-blue-50' : ''}`}
                    onClick={() => {
                      if (!isMaxSelected) {
                        toggleProductSelection(product);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{product.Title}</h4>
                        <p className="text-blue-600 font-medium text-sm mb-2">
                          {formatPrice(product.BasePrice, product.Currency)}
                          {product.PriceUnit && <span className="text-gray-500"> /{product.PriceUnit.UnitName}</span>}
                        </p>
                        {product.Condition && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                            {product.Condition.ConditionName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isMaxSelected) {
                            toggleProductSelection(product);
                          }
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isSelected
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : isMaxSelected
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        disabled={isMaxSelected}
                      >
                        {isSelected ? <X size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Không có sản phẩm nào để so sánh
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            disabled={selectedProducts.length < 2}
            onClick={handleCompare}
            className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
              selectedProducts.length >= 2 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            So sánh ({selectedProducts.length}/2)
          </button>
        </div>
      </div>
    </div>
  );
}