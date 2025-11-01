"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import { Button } from "@/components/ui/common/button";
import { Separator } from "@/components/ui/common/separator";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/common/empty-state";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Zap,
  Loader2,
  ChevronRight,
  Home,
  Calendar,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store/redux_store";
import {
  fetchCartItems,
  updateCartItemAction,
  removeItemFromCartAction,
} from "@/store/cart/cartActions";
import { setCartItems } from "@/store/cart/cartReducer";
import PopupModal from "@/components/ui/common/PopupModal";
import Image from "next/image";


export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    items: cartItems,
    loading,
    error,
  } = useSelector((state: RootState) => state.cart);

  // Popup modal state
  const [popupModal, setPopupModal] = useState({
    isOpen: false,
    type: "info" as "error" | "success" | "info",
    title: "",
    message: "",
  });

  // Edit rental dates state
  const [editingDates, setEditingDates] = useState<{
    [cartItemId: string]: {
      rentalStartDateTime: string;
      rentalEndDateTime: string;
    };
  }>({});

  // Loading state for individual items
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Selected items state for checkout
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchCartItems());
  }, [dispatch]);

  // Initialize all items as selected when cart items change
  useEffect(() => {
    if (cartItems.length === 0) return;

    const getDisplayKeyLocal = (item: (typeof cartItems)[0]) => {
      if (item.rentalStartDate && item.rentalEndDate) {
        return `${item.itemId}_${item.rentalStartDate}_${item.rentalEndDate}`;
      }
      return item._id;
    };
    const allItemKeys = new Set(
      cartItems.map((item) => getDisplayKeyLocal(item))
    );
    setSelectedItems(allItemKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]); // Only depend on length to prevent unnecessary updates

  // Breadcrumb data
  const breadcrumbs = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Sản phẩm", href: "/products", icon: null },
    { label: "Giỏ hàng", href: "/auth/cartitem", icon: ShoppingCart },
  ];

  // Handle back navigation
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/products");
    }
  };

  // Show popup modal
  const showPopup = useCallback(
    (type: "error" | "success" | "info", title: string, message: string) => {
      setPopupModal({
        isOpen: true,
        type,
        title,
        message,
      });
    },
    []
  );

  // Close popup modal
  const closePopup = useCallback(() => {
    setPopupModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Remove item function
  const removeItem = useCallback(
    async (cartItemId: string) => {
      try {
        await dispatch(removeItemFromCartAction(cartItemId));
        showPopup("success", "Thành công", "Đã xóa sản phẩm khỏi giỏ hàng");
      } catch {
        showPopup("error", "Lỗi", "Có lỗi xảy ra khi xóa sản phẩm");
      }
    },
    [dispatch, showPopup]
  );

  // Update rental dates function
  const updateRentalDates = useCallback(
    async (
      cartItemId: string,
      rentalStartDateTime: string,
      rentalEndDateTime: string
    ) => {
      // Validation
      if (!rentalStartDateTime || !rentalEndDateTime) {
        showPopup(
          "error",
          "Lỗi",
          "Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc"
        );
        return;
      }

      const startDate = new Date(rentalStartDateTime);
      const endDate = new Date(rentalEndDateTime);

      const diffDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > 365) {
        showPopup(
          "error",
          "Lỗi",
          "Thời gian thuê không được vượt quá 365 ngày"
        );
        return;
      }

      try {
        // Set loading state for this specific item
        setUpdatingItems((prev) => new Set(prev).add(cartItemId));

        await dispatch(
          updateCartItemAction(cartItemId, {
            rentalStartDate: rentalStartDateTime,
            rentalEndDate: rentalEndDateTime,
          })
        );

        showPopup(
          "success",
          "Thành công",
          "Đã cập nhật thời gian thuê thành công"
        );

        // Clear editing state
        setEditingDates((prev) => {
          const newState = { ...prev };
          delete newState[cartItemId];
          return newState;
        });
      } catch {
        showPopup("error", "Lỗi", "Có lỗi xảy ra khi cập nhật thời gian thuê");
      } finally {
        // Clear loading state
        setUpdatingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cartItemId);
          return newSet;
        });
      }
    },
    [dispatch, showPopup]
  );

  // Create unique display key for each cart item based on product + rental dates
  // This allows same products with different rental dates to be treated as separate items
  const getDisplayKey = useCallback((item: (typeof cartItems)[0]) => {
    if (item.rentalStartDate && item.rentalEndDate) {
      return `${item.itemId}_${item.rentalStartDate}_${item.rentalEndDate}`;
    }
    return item._id;
  }, []);

  // Toggle item selection
  const toggleItemSelection = useCallback((displayKey: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(displayKey)) {
        newSet.delete(displayKey);
      } else {
        newSet.add(displayKey);
      }
      return newSet;
    });
  }, []);

  // Select/Deselect all items
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => getDisplayKey(item))));
    }
  }, [selectedItems.size, cartItems, getDisplayKey]);

  // Helper functions for editing dates
  const startEditingDates = useCallback(
    (cartItemId: string, rentalStartDate?: string, rentalEndDate?: string) => {
      // Convert existing date strings to datetime-local format
      const startDateTime = rentalStartDate
        ? rentalStartDate.replace("T", "T").substring(0, 16)
        : "";
      const endDateTime = rentalEndDate
        ? rentalEndDate.replace("T", "T").substring(0, 16)
        : "";

      setEditingDates((prev) => ({
        ...prev,
        [cartItemId]: {
          rentalStartDateTime: startDateTime,
          rentalEndDateTime: endDateTime,
        },
      }));
    },
    []
  );

  const cancelEditingDates = useCallback((cartItemId: string) => {
    setEditingDates((prev) => {
      const newState = { ...prev };
      delete newState[cartItemId];
      return newState;
    });
  }, []);

  const updateEditingDates = useCallback(
    (
      cartItemId: string,
      field: "rentalStartDateTime" | "rentalEndDateTime",
      value: string
    ) => {
      setEditingDates((prev) => ({
        ...prev,
        [cartItemId]: {
          ...prev[cartItemId],
          [field]: value,
        },
      }));
    },
    []
  );

  // Update quantity function
  const updateQuantity = useCallback(
    async (cartItemId: string, newQuantity: number) => {
      // Find the cart item to get available quantity
      const cartItem = cartItems.find((item) => item._id === cartItemId);

      if (!cartItem) {
        showPopup("error", "Lỗi", "Không tìm thấy sản phẩm trong giỏ hàng");
        return;
      }

      // Validation checks
      if (newQuantity <= 0) {
        await removeItem(cartItemId);
        return;
      }

      if (newQuantity > cartItem.availableQuantity) {
        showPopup(
          "error",
          "Số lượng không hợp lệ",
          `Hiện tại chỉ có ${cartItem.availableQuantity} sản phẩm`
        );
        return;
      }

      if (newQuantity > 99) {
        showPopup(
          "error",
          "Số lượng không hợp lệ",
          "Số lượng không được vượt quá 99 sản phẩm"
        );
        return;
      }

      if (!Number.isInteger(newQuantity)) {
        showPopup(
          "error",
          "Số lượng không hợp lệ",
          "Số lượng phải là số nguyên"
        );
        return;
      }

      try {
        // Make API call
        await dispatch(
          updateCartItemAction(cartItemId, { quantity: newQuantity })
        );
      } catch {
        // If API fails, revert the optimistic update
        dispatch(fetchCartItems());
        showPopup("error", "Lỗi", "Có lỗi xảy ra khi cập nhật số lượng");
      }
    },
    [cartItems, dispatch, showPopup, removeItem]
  );

  // Debounced update function to prevent spam clicks
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdate = useCallback(
    (cartItemId: string, newQuantity: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateQuantity(cartItemId, newQuantity);
      }, 300); // 300ms delay
    },
    [updateQuantity]
  );

  // Immediate UI update for better UX
  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    // Find the cart item to get available quantity
    const cartItem = cartItems.find((item) => item._id === cartItemId);

    if (!cartItem) return;
    // Quick validation for immediate UI update
    if (newQuantity <= 0) {
      return;
    }

    if (newQuantity > cartItem.availableQuantity) {
      // Don't update UI, show error
      showPopup(
        "error",
        "Số lượng không hợp lệ",
        `Hiện tại chỉ có ${cartItem.availableQuantity} sản phẩm`
      );
      return;
    }

    if (newQuantity > 99) {
      // Don't update UI, show error
      showPopup(
        "error",
        "Số lượng không hợp lệ",
        "Số lượng không được vượt quá 99 sản phẩm"
      );
      return;
    }

    // Immediate UI update
    const updatedCartItems = cartItems.map((item) =>
      item._id === cartItemId ? { ...item, quantity: newQuantity } : item
    );
    dispatch(setCartItems(updatedCartItems));

    // Debounced API call
    debouncedUpdate(cartItemId, newQuantity);
  };

  
  const calculateRentalDuration = (
    startDate?: string,
    endDate?: string,
    priceUnit?: string
  ) => {
    if (!startDate || !endDate) return 1;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());

    // Calculate based on price unit
    switch (priceUnit?.toLowerCase()) {
      case "giờ":
      case "hour":
      case "hours":
        return Math.ceil(diffTime / (1000 * 60 * 60)) || 1;
      case "ngày":
      case "day":
      case "days":
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      case "tuần":
      case "week":
      case "weeks":
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) || 1;
      case "tháng":
      case "month":
      case "months":
        // Approximate month calculation (30 days)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) || 1;
      default:
        // Default to days if unit is not recognized
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
  };


const handleCheckout = () => {
  // Lấy các sản phẩm được chọn
  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.has(getDisplayKey(item))
  );

  if (selectedCartItems.length === 0) {
    showPopup(
      "error",
      "Lỗi",
      "Vui lòng chọn ít nhất một sản phẩm để thanh toán"
    );
    return;
  }

  // Kiểm tra tất cả có ngày thuê không
  for (const item of selectedCartItems) {
    if (!item.rentalStartDate || !item.rentalEndDate) {
      showPopup(
        "error",
        "Thiếu thông tin",
        `Sản phẩm "${item.title}" chưa có thời gian thuê`
      );
      return;
    }
  }


  sessionStorage.setItem("checkoutItems", JSON.stringify(selectedCartItems));


  router.push("/auth/order/");
};


  // Get display text for rental duration
  const getRentalDurationText = (duration: number, priceUnit?: string) => {
    switch (priceUnit?.toLowerCase()) {
      case "giờ":
      case "hour":
      case "hours":
        return `${duration} giờ`;
      case "ngày":
      case "day":
      case "days":
        return `${duration} ngày`;
      case "tuần":
      case "week":
      case "weeks":
        return `${duration} tuần`;
      case "tháng":
      case "month":
      case "months":
        return `${duration} tháng`;
      default:
        return `${duration} ngày`;
    }
  };

  // Calculate totals for selected items only
  const subtotal = cartItems.reduce((sum, item) => {
    if (selectedItems.has(getDisplayKey(item))) {
      const rentalDuration = calculateRentalDuration(
        item.rentalStartDate,
        item.rentalEndDate,
        item.priceUnit
      );
      return sum + item.basePrice * item.quantity * rentalDuration;
    }
    return sum;
  }, 0);

  // Calculate total deposit for selected items
  const totalDeposit = cartItems.reduce((sum, item) => {
    if (selectedItems.has(getDisplayKey(item))) {
      return sum + item.depositAmount * item.quantity;
    }
    return sum;
  }, 0);

  const tax = subtotal * 0.03;
  const total = subtotal + tax + totalDeposit;

  // Format price helper
  const formatPrice = (price: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }
    return `$${price}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <main className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-700">Đang tải giỏ hàng...</span>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => dispatch(fetchCartItems())}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Thử lại
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <main className="container mx-auto px-4 py-20">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => {
                const IconComponent = breadcrumb.icon;
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <div
                    key={breadcrumb.href}
                    className="flex items-center space-x-2"
                  >
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}

                    {isLast ? (
                      <span className="flex items-center space-x-1 text-gray-900 font-medium">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{breadcrumb.label}</span>
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{breadcrumb.label}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          <Empty className="border-gray-200 bg-white shadow-lg">
            <EmptyMedia variant="icon" className="bg-blue-100">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-gray-900">Giỏ hàng trống</EmptyTitle>
              <EmptyDescription className="text-gray-600">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản
                phẩm của chúng tôi!
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </Button>
                <Link href="/products">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Tiếp tục mua sắm
                  </Button>
                </Link>
              </div>
            </EmptyContent>
          </Empty>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => {
              const IconComponent = breadcrumb.icon;
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div
                  key={breadcrumb.href}
                  className="flex items-center space-x-2"
                >
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}

                  {isLast ? (
                    <span className="flex items-center space-x-1 text-gray-900 font-medium">
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{breadcrumb.label}</span>
                    </span>
                  ) : (
                    <Link
                      href={breadcrumb.href}
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{breadcrumb.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-purple-600" />
            Giỏ hàng thuê của bạn
          </h1>
          <p className="text-slate-600">
            Bạn có {cartItems.length} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select All Header */}
            <Card className="border-purple-200/50 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.size === cartItems.length &&
                        cartItems.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Chọn tất cả ({selectedItems.size}/{cartItems.length})
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <span className="text-sm text-blue-600 font-semibold">
                      Đã chọn {selectedItems.size} sản phẩm
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {cartItems.map((item, index) => {
              const rentalDuration = calculateRentalDuration(
                item.rentalStartDate,
                item.rentalEndDate,
                item.priceUnit
              );
              const itemTotal = item.basePrice * item.quantity * rentalDuration;
              const displayKey = getDisplayKey(item);

              return (
                <Card
                  key={item._id}
                  className={`border-purple-200/50 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                    updatingItems.has(item._id)
                      ? "ring-2 ring-blue-200 shadow-lg"
                      : ""
                  } ${!selectedItems.has(displayKey) ? "opacity-60" : ""}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Checkbox */}
                      <div className="md:col-span-4 flex items-center gap-3 pb-2 border-b border-purple-200/50">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(displayKey)}
                          onChange={() => toggleItemSelection(displayKey)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Chọn sản phẩm này để thanh toán
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="relative w-full h-40 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-100 to-blue-100 shadow-md">
                        <Image
                          src={item.primaryImage || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-purple-600">
                          {item.condition || "Chưa xác định"}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Còn lại {item.availableQuantity} sản phẩm
                          </p>
                        </div>

                        {/* Rental Period */}
                        <div
                          className={`bg-blue-50 px-3 py-2 rounded-lg transition-all duration-300 ${
                            updatingItems.has(item._id)
                              ? "opacity-75 bg-blue-100"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar
                                className={`w-4 h-4 text-blue-600 ${
                                  updatingItems.has(item._id)
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              />
                              <span className="text-sm font-medium text-blue-700">
                                Thời gian thuê:
                              </span>
                              {updatingItems.has(item._id) && (
                                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                              )}
                            </div>
                            {!editingDates[item._id] &&
                              !updatingItems.has(item._id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    startEditingDates(
                                      item._id,
                                      item.rentalStartDate,
                                      item.rentalEndDate
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 px-2 transition-all duration-200"
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  <span className="text-xs">Chỉnh sửa</span>
                                </Button>
                              )}
                          </div>

                          {editingDates[item._id] ? (
                            // Edit mode
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                  <label className="block text-xs text-blue-700 font-medium mb-2">
                                    Thời gian bắt đầu:
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={
                                      editingDates[item._id].rentalStartDateTime
                                    }
                                    onChange={(e) =>
                                      updateEditingDates(
                                        item._id,
                                        "rentalStartDateTime",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-center"
                                    min={(() => {
                                      const now = new Date();
                                      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
                                      const minTime = new Date(
                                        now.getTime() - bufferTime
                                      );
                                      return minTime
                                        .toISOString()
                                        .substring(0, 16);
                                    })()}
                                  />
                                </div>
                                <div className="text-center">
                                  <label className="block text-xs text-blue-700 font-medium mb-2">
                                    Thời gian kết thúc:
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={
                                      editingDates[item._id].rentalEndDateTime
                                    }
                                    onChange={(e) =>
                                      updateEditingDates(
                                        item._id,
                                        "rentalEndDateTime",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-center"
                                    min={
                                      editingDates[item._id]
                                        .rentalStartDateTime ||
                                      (() => {
                                        const now = new Date();
                                        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
                                        const minTime = new Date(
                                          now.getTime() - bufferTime
                                        );
                                        return minTime
                                          .toISOString()
                                          .substring(0, 16);
                                      })()
                                    }
                                  />
                                </div>
                              </div>
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateRentalDates(
                                      item._id,
                                      editingDates[item._id]
                                        .rentalStartDateTime,
                                      editingDates[item._id].rentalEndDateTime
                                    )
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-6 px-3 text-xs transition-all duration-200"
                                  disabled={updatingItems.has(item._id)}
                                >
                                  {updatingItems.has(item._id) ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Đang lưu...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Lưu
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelEditingDates(item._id)}
                                  className="border-gray-300 text-gray-600 hover:bg-gray-50 h-6 px-3 text-xs transition-all duration-200"
                                  disabled={updatingItems.has(item._id)}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Display mode
                            <div
                              className={`transition-all duration-300 ${
                                updatingItems.has(item._id)
                                  ? "opacity-60"
                                  : "opacity-100"
                              }`}
                            >
                              {item.rentalStartDate && item.rentalEndDate ? (
                                <>
                                  <div className="text-sm text-blue-600 mb-1">
                                    {(() => {
                                      const startDate = new Date(
                                        item.rentalStartDate
                                      );
                                      const endDate = new Date(
                                        item.rentalEndDate
                                      );
                                      const hasTime =
                                        item.rentalStartDate.includes("T") ||
                                        item.rentalEndDate.includes("T");

                                      if (hasTime) {
                                        return `${startDate.toLocaleDateString(
                                          "vi-VN"
                                        )} ${startDate.toLocaleTimeString(
                                          "vi-VN",
                                          { hour: "2-digit", minute: "2-digit" }
                                        )} - ${endDate.toLocaleDateString(
                                          "vi-VN"
                                        )} ${endDate.toLocaleTimeString(
                                          "vi-VN",
                                          { hour: "2-digit", minute: "2-digit" }
                                        )}`;
                                      } else {
                                        return `${startDate.toLocaleDateString(
                                          "vi-VN"
                                        )} - ${endDate.toLocaleDateString(
                                          "vi-VN"
                                        )}`;
                                      }
                                    })()}
                                  </div>
                                  <div className="text-sm text-blue-600 font-medium">
                                    Tổng cộng:{" "}
                                    {getRentalDurationText(
                                      rentalDuration,
                                      item.priceUnit
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  Chưa chọn thời gian thuê
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Owner Info */}
                        {item.owner && (
                          <div className="flex items-center gap-3 bg-purple-50 px-3 py-2 rounded-lg">
                            <Image
                              src={item.owner.avatarUrl || "/placeholder.svg"}
                              alt={item.owner.fullName}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">
                                {item.owner.fullName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {item.owner.email}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-orange-50 px-3 py-2 rounded-lg">
                            <p className="text-xs text-slate-600">Giá thuê</p>
                            <p className="font-bold text-orange-600">
                              {formatPrice(item.basePrice, item.currency)}/
                              {item.priceUnit || "ngày"}
                            </p>
                          </div>
                          <div className="bg-red-50 px-3 py-2 rounded-lg">
                            <p className="text-xs text-slate-600">Cọc</p>
                            <p className="font-bold text-red-600">
                              {formatPrice(item.depositAmount, item.currency)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-between items-end gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-2 border border-purple-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleQuantityChange(item._id, item.quantity - 1)
                            }
                            className="text-purple-600 hover:text-purple-700 hover:bg-white h-8 w-8"
                            disabled={loading}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-slate-800 font-bold w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleQuantityChange(item._id, item.quantity + 1)
                            }
                            className="text-purple-600 hover:text-purple-700 hover:bg-white h-8 w-8"
                            disabled={loading}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {formatPrice(itemTotal, item.currency)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatPrice(item.basePrice, item.currency)} ×{" "}
                            {item.quantity} ×{" "}
                            {getRentalDurationText(
                              rentalDuration,
                              item.priceUnit
                            )}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          onClick={() => removeItem(item._id)}
                          className="text-slate-600 hover:text-red-800 hover:bg-red-50 flex justify-end items-center ml-auto pr-6 py-4 backdrop-grayscale bg-gradient-to-r from-red-100 via-orange-50 to-red-50"
                        >
                          <Trash2 className="w-7 h-7 mr-3" />
                          <span className="text-lg">Xóa</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-purple-200/50 bg-white/80 backdrop-blur-sm sticky top-24 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Tóm tắt đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Warning when no items selected */}
                {selectedItems.size === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-amber-700 font-medium">
                      ⚠️ Vui lòng chọn ít nhất một sản phẩm để thanh toán
                    </p>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Tạm tính:</span>
                  <span className="text-slate-800 font-semibold">
                    {subtotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <Separator className="bg-purple-200/50" />

                {/* Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Thuế (3%):</span>
                  <span className="text-slate-800 font-semibold">
                    {tax.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <Separator className="bg-purple-200/50" />

                {/* Deposit */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Tiền đặt cọc:</span>
                  <span className="text-slate-800 font-semibold">
                    {totalDeposit.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <Separator className="bg-purple-200/50" />

                {/* Total */}
                <div className="flex justify-between items-center pt-2 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 rounded-lg">
                  <span className="text-lg font-bold text-slate-800">
                    Tổng cộng:
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {total.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={selectedItems.size === 0}
                  onClick={handleCheckout}
                >
                  Thanh toán
                </Button>

                {/* Continue Shopping */}
                <Link href="/products">
                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tiếp tục mua sắm
                  </Button>
                </Link>

                {/* Promo Code */}
                <div className="pt-4 border-t border-purple-200/50">
                  <p className="text-xs text-slate-600 mb-3 font-semibold">
                    Có mã khuyến mãi?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã"
                      className="flex-1 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                    />
                    <Button
                      variant="outline"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Popup Modal */}
      <PopupModal
        isOpen={popupModal.isOpen}
        onClose={closePopup}
        type={popupModal.type}
        title={popupModal.title}
        message={popupModal.message}
      />
    </div>
  );
}
