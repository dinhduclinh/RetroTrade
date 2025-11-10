'use client';

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { createOrderAction } from "@/store/order/orderActions";
import { removeItemFromCartAction } from "@/store/cart/cartActions";
import type { CartItem } from "@/services/auth/cartItem.api";
import { format } from "date-fns";
import { RootState, AppDispatch } from "@/store/redux_store";
import { decodeToken } from "@/utils/jwtHelper";
import { getUserProfile } from "@/services/auth/user.api";
import {
  Package,
  MapPin,
  Truck,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Home,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Edit2,
  X,
  Save,
  Eye,
  ExternalLink,
  Percent,
} from "lucide-react";
import { getCurrentTax } from "@/services/tax/tax.api";
import Link from "next/link";
import { toast } from "sonner";
import type { UserAddress } from "@/services/auth/userAddress.api";

import { payOrderWithWallet } from "@/services/wallet/wallet.api";
import PopupModal from "@/components/ui/common/PopupModal";
import { DiscountSelector, type AppliedDiscount } from "@/components/ui/auth/discounts/DiscountSelector";
import { AddressSelector } from "@/components/ui/auth/address/address-selector";

const calculateRentalDays = (item: CartItem): number => {
  if (!item.rentalStartDate || !item.rentalEndDate) return 0;
  const start = new Date(item.rentalStartDate);
  const end = new Date(item.rentalEndDate);
  const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  let unitCount: number;
  switch (item.priceUnit.toLowerCase()) {
    case "hour":
    case "giờ":
      unitCount = Math.ceil(totalHours);
      break;
    case "day":
    case "ngày":
      unitCount = Math.ceil(totalHours / 24);
      break;
    case "week":
    case "tuần":
      unitCount = Math.ceil(totalHours / (24 * 7));
      break;
    case "month":
    case "tháng":
      unitCount = Math.ceil(totalHours / (24 * 30));
      break;
    default:
      unitCount = Math.ceil(totalHours / 24);
  }
  return Math.max(1, unitCount);
};

const getRentalDurationText = (
  duration: number,
  priceUnit?: string
): string => {
  const unit = priceUnit?.toLowerCase();
  switch (unit) {
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

type CheckoutOrderPayload = {
  itemId: string;
  quantity: number;
  startAt?: string;
  endAt?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    phone: string;
  };
  paymentMethod: string;
  note: string;
  discountCode?: string;
  discountAmount?: number;
  discountType?: "percent" | "fixed";
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
};

export default function Checkout() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState({
    fullName: "",
    street: "",
    ward: "",
    province: "",
    phone: "",
  });
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(3); // Default 3%
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Hiển thị 3 sản phẩm mỗi trang
  // State cho modal thông báo lỗi
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [editingItems, setEditingItems] = useState<Record<string, {
    quantity: number;
    rentalStartDate: string;
    rentalEndDate: string;
  }>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, {
    quantity?: string;
    rentalStartDate?: string;
    rentalEndDate?: string;
  }>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);



  // Lấy từ sessionStorage
  useEffect(() => {
    const itemsStr = sessionStorage.getItem("checkoutItems");
    if (!itemsStr) {
      router.push("/auth/cartitem");
      return;
    }
    const items: CartItem[] = JSON.parse(itemsStr);
    const invalid = items.find((i) => !i.rentalStartDate || !i.rentalEndDate);
    if (invalid) {
      toast.error(`Sản phẩm "${invalid.title}" chưa có ngày thuê hợp lệ.`);
      router.push("/auth/cartitem");
      return;
    }
    setCartItems(items);
  }, [router]);


  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const response = await getCurrentTax();
        if (response.success && response.data) {
          setTaxRate(response.data.taxRate);
        }
      } catch (error) {
        console.error("Error fetching tax rate:", error);

      }
    };
    fetchTaxRate();
  }, []);

  // Load user info and auto-fill shipping address
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        // Get fullName from token
        const decoded = decodeToken(accessToken);
        if (decoded?.fullName) {
          setShipping(prev => ({
            ...prev,
            fullName: decoded.fullName || "",
          }));
        }

        // Get phone from user profile
        const profileResponse = await getUserProfile();
        if (profileResponse?.user?.phone || profileResponse?.data?.phone) {
          const phone = profileResponse.user?.phone || profileResponse.data?.phone || "";
          setShipping(prev => ({
            ...prev,
            phone: phone,
          }));
        }

      } catch (error) {
        console.error("Error loading user info:", error);
      }
    };

    if (accessToken) {
      loadUserInfo();
    }
  }, [accessToken]);

  // Apply address to shipping form
  const applyAddressToShipping = (address: UserAddress) => {
    setShipping(prev => ({
      ...prev,
      street: address.Address,
      ward: address.District,
      province: address.City,
    }));
  };

  // Pagination calculations
  const totalPages = Math.ceil(cartItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = cartItems.slice(startIndex, endIndex);

  const rentalTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const days = calculateRentalDays(item);
      return sum + item.basePrice * item.quantity * days;
    }, 0);
  }, [cartItems]);

  const depositTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.depositAmount * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = appliedDiscount?.amount ?? 0;
  const discountedRental = Math.max(0, rentalTotal - discountAmount);
  const taxAmount = (discountedRental * taxRate) / 100;
  const grandTotal = discountedRental + taxAmount + depositTotal;

  useEffect(() => {
    if (
      appliedDiscount &&
      appliedDiscount.discount.minOrderAmount &&
      rentalTotal < appliedDiscount.discount.minOrderAmount
    ) {
      setAppliedDiscount(null);
      toast.info("Đơn hàng không còn đáp ứng điều kiện tối thiểu của mã giảm giá đã chọn.");
    }
  }, [appliedDiscount, rentalTotal]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Format date to datetime-local input format
  const formatDateTimeLocal = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get minimum datetime for date inputs (current time - 5 minutes buffer)
  const getMinDateTime = (): string => {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    const minTime = new Date(now.getTime() - bufferTime);
    return minTime.toISOString().substring(0, 16);
  };

  // Validate item changes
  const validateItem = (itemId: string, data: {
    quantity: number;
    rentalStartDate: string;
    rentalEndDate: string;
  }, item: CartItem): { isValid: boolean; errors: { quantity?: string; rentalStartDate?: string; rentalEndDate?: string } } => {
    const errors: { quantity?: string; rentalStartDate?: string; rentalEndDate?: string } = {};

    // Validate quantity
    if (!data.quantity || data.quantity < 1 || !Number.isInteger(data.quantity)) {
      errors.quantity = "Số lượng phải là số nguyên dương";
    } else if (item.availableQuantity !== undefined && data.quantity > item.availableQuantity) {
      errors.quantity = `Số lượng không được vượt quá ${item.availableQuantity} sản phẩm có sẵn`;
    }

    // Validate dates
    const startDate = new Date(data.rentalStartDate);
    const endDate = new Date(data.rentalEndDate);
    const now = new Date();
    const minDateTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes buffer

    if (!data.rentalStartDate) {
      errors.rentalStartDate = "Vui lòng chọn ngày bắt đầu";
    } else if (startDate < minDateTime) {
      errors.rentalStartDate = "Ngày bắt đầu không được trong quá khứ";
    }

    if (!data.rentalEndDate) {
      errors.rentalEndDate = "Vui lòng chọn ngày kết thúc";
    } else if (endDate < minDateTime) {
      errors.rentalEndDate = "Ngày kết thúc không được trong quá khứ";
    }

    if (data.rentalStartDate && data.rentalEndDate && endDate <= startDate) {
      errors.rentalEndDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Start editing item
  const startEditing = (item: CartItem) => {
    setEditingItems({
      ...editingItems,
      [item._id]: {
        quantity: item.quantity,
        rentalStartDate: formatDateTimeLocal(item.rentalStartDate || ""),
        rentalEndDate: formatDateTimeLocal(item.rentalEndDate || ""),
      }
    });
    setItemErrors({ ...itemErrors, [item._id]: {} });
  };

  // Cancel editing
  const cancelEditing = (itemId: string) => {
    const newEditing = { ...editingItems };
    delete newEditing[itemId];
    setEditingItems(newEditing);
    const newErrors = { ...itemErrors };
    delete newErrors[itemId];
    setItemErrors(newErrors);
  };

  // Update editing field
  const updateEditingField = (itemId: string, field: string, value: string | number) => {
    setEditingItems({
      ...editingItems,
      [itemId]: {
        ...editingItems[itemId],
        [field]: value
      }
    });
    // Clear error for this field when user starts typing
    if (itemErrors[itemId]?.[field as keyof typeof itemErrors[string]]) {
      setItemErrors({
        ...itemErrors,
        [itemId]: {
          ...itemErrors[itemId],
          [field]: undefined
        }
      });
    }
  };

  // Save item changes
  const saveItem = (item: CartItem) => {
    const editingData = editingItems[item._id];
    if (!editingData) return;

    const validation = validateItem(item._id, editingData, item);

    if (!validation.isValid) {
      setItemErrors({
        ...itemErrors,
        [item._id]: validation.errors
      });
      return;
    }

    // Update cartItems
    const updatedItems = cartItems.map(cartItem => {
      if (cartItem._id === item._id) {
        return {
          ...cartItem,
          quantity: editingData.quantity,
          rentalStartDate: editingData.rentalStartDate,
          rentalEndDate: editingData.rentalEndDate,
        };
      }
      return cartItem;
    });

    // Update sessionStorage
    sessionStorage.setItem("checkoutItems", JSON.stringify(updatedItems));
    setCartItems(updatedItems);

    // Clear editing state
    cancelEditing(item._id);
  };

  // const handleSubmit = async () => {
  //   if (
  //     !shipping.fullName ||
  //     !shipping.street ||
  //     !shipping.province ||
  //     !shipping.phone
  //   ) {
  //     toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     let successCount = 0;
  //     const failedItems: string[] = [];

  //     for (const item of cartItems) {
  //       console.log("Tạo đơn hàng:", item.title);

  //       const result = await dispatch(
  //         createOrderAction({
  //           itemId: item.itemId,
  //           quantity: item.quantity,
  //           startAt: item.rentalStartDate,
  //           endAt: item.rentalEndDate,
  //           shippingAddress: shipping,
  //           paymentMethod: "Wallet",
  //           note,
  //         })
  //       );

  //       if (!result?.success) {
  //         const errorMessage = result?.error || "Không thể tạo đơn hàng";
  //         toast.error(`Không thể tạo đơn cho sản phẩm: ${item.title}. ${errorMessage}`);
  //         failedItems.push(item.title);
  //         console.error(`Order failed for ${item.title}:`, result?.error);
  //         continue; // Continue processing other items instead of throwing
  //       }
  //       try {
  //         if (!result?.data?._id || !result?.data?.userId) {
  //           toast.error("Không tìm thấy orderId hoặc userId.");
  //           continue;
  //         }
  //         console.log("Gọi thanh toán ví:", result.data._id, result.data.userId);
  //         const paymentResult = await payOrderWithWallet(result.data._id, result.data.userId);

  //         if (!paymentResult.success) {
  //           toast.error(`Thanh toán thất bại cho sản phẩm: ${item.title}. Lý do: ${paymentResult.error}`);
  //           failedItems.push(item.title + " (thanh toán không thành công)");
  //           continue; // bỏ qua item này, tiếp tục các item còn lại
  //         }
  //       } catch (paymentError) {
  //         toast.error(`Lỗi thanh toán đơn ${item.title}`);
  //         failedItems.push(item.title + " (lỗi thanh toán)");
  //         continue;
  //       }
  //       // Only remove from cart if order was successful
  //       if (!item._id?.startsWith("temp-")) {
  //         try {
  //           await dispatch(removeItemFromCartAction(item._id));
  //         } catch (cartError) {
  //           console.error(`Error removing item from cart: ${item.title}`, cartError);
  //           // Don't fail the entire process if cart removal fails
  //         }
  //       }

  //       successCount++;
  //     }

  //     // Show appropriate message based on results
  //     if (failedItems.length === 0) {
  //       toast.success("Tạo tất cả đơn hàng thành công!");
  //       sessionStorage.removeItem("checkoutItems");
  //       router.push("/auth/order");
  //     } else if (successCount > 0) {
  //       toast.warning(
  //         `Đã tạo thành công ${successCount} đơn hàng. ${failedItems.length} đơn hàng thất bại: ${failedItems.join(", ")}`
  //       );
  //       // Keep only failed items in sessionStorage for retry
  //       const remainingItems = cartItems.filter(
  //         (item) => failedItems.includes(item.title)
  //       );
  //       if (remainingItems.length > 0) {
  //         sessionStorage.setItem("checkoutItems", JSON.stringify(remainingItems));
  //       } else {
  //         sessionStorage.removeItem("checkoutItems");
  //       }
  //     } else {
  //       toast.error("Không thể tạo bất kỳ đơn hàng nào. Vui lòng thử lại.");
  //     }
  //   } catch (err) {
  //     console.error("Checkout error:", err);
  //     toast.error("Có lỗi xảy ra khi tạo đơn hàng, vui lòng thử lại.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // ham submit mơi 

  const handleSubmit = async () => {
    if (
      !shipping.fullName ||
      !shipping.street ||
      !shipping.province ||
      !shipping.phone
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount = 0;
      const failedItems: string[] = [];
      let discountUsed = false;

      for (const item of cartItems) {

        try {
          // TẠO ĐƠN TRƯỚC
          const createPayload: CheckoutOrderPayload = {
            itemId: item.itemId,
            quantity: item.quantity,
            startAt: item.rentalStartDate,
            endAt: item.rentalEndDate,
            shippingAddress: {
              fullName: shipping.fullName,
              street: shipping.street,
              ward: shipping.ward,
              district: shipping.ward,
              province: shipping.province,
              phone: shipping.phone,
            },
            paymentMethod: "Wallet",
            note,
          };

          if (appliedDiscount && !discountUsed) {
            createPayload.discountCode = appliedDiscount.discount.code;
            createPayload.discountAmount = appliedDiscount.amount;
            createPayload.discountType = appliedDiscount.discount.type;
            discountUsed = true;
          }

          const result = await dispatch(createOrderAction(createPayload));

          if (!result?.success) {
            const errorMessage = result?.error || "Không thể tạo đơn hàng";
            toast.error(`Không thể tạo đơn cho sản phẩm: ${item.title}. ${errorMessage}`);
            failedItems.push(item.title + " (lỗi tạo đơn)");
            continue;
          }

          // Lấy orderId từ response
          const orderIdRaw = result?.data?.orderId || result?.data?._id;
          if (!orderIdRaw) {
            console.error(" Response từ createOrder:", result);
            toast.error(`Không lấy được orderId cho sản phẩm: ${item.title}`);
            failedItems.push(item.title + " (lỗi lấy orderId)");
            continue;
          }

          // Đảm bảo orderId là string
          const orderId = typeof orderIdRaw === 'string' ? orderIdRaw : String(orderIdRaw);

          // THANH TOÁN SAU KHI ĐÃ TẠO ĐƠN
          try {
            const paymentResult = await payOrderWithWallet(orderId);

            // Kiểm tra nếu response có success field
            if (paymentResult && paymentResult.success === false) {
              const errorMsg = paymentResult.error || paymentResult.message || "Thanh toán thất bại";
              toast.error(`Thanh toán thất bại cho sản phẩm: ${item.title}. ${errorMsg}`);
              failedItems.push(item.title + " (thanh toán không thành công)");
              continue;
            }

          } catch (paymentError) {
            // Xử lý lỗi từ API
            let errorMessage = "Thanh toán thất bại";

            const errorResponse =
              typeof paymentError === "object" && paymentError !== null && "response" in paymentError
                ? (paymentError as ApiError).response
                : undefined;

            if (errorResponse?.data) {
              const errorData = errorResponse.data;
              
              // Ưu tiên message chi tiết, sau đó mới đến error
              errorMessage = errorData.message || errorData.error || "Thanh toán thất bại";

              // Kiểm tra nếu là lỗi ví không đủ tiền
              const isInsufficientBalance = errorData.error === 'Ví người dùng không đủ tiền' 
                || errorMessage.includes('không đủ tiền') 
                || errorData.error?.includes('không đủ tiền')
                || errorData.error?.includes('Ví người dùng không đủ tiền');
              
              if (isInsufficientBalance) {
                // Message đơn giản
                errorMessage = "Số dư ví không đủ. Vui lòng nạp tiền vào ví.";
                setErrorModalTitle("Ví không đủ tiền");
                setErrorModalMessage(errorMessage);
                setIsErrorModalOpen(true);
              } else {
                // Các lỗi khác vẫn dùng toast
                toast.error(`${errorMessage} - Sản phẩm: ${item.title}`, {
                  duration: 5000,
                });
              }
            } else if (paymentError instanceof Error && paymentError.message) {
              errorMessage = paymentError.message;
              toast.error(`${errorMessage} - Sản phẩm: ${item.title}`, {
                duration: 5000,
              });
            } else {
              toast.error(`Thanh toán thất bại cho sản phẩm: ${item.title}`, {
                duration: 5000,
              });
            }

            failedItems.push(item.title + " (thanh toán không thành công)");
            continue;
          }

          // Xóa khỏi giỏ hàng nếu mọi thứ OK
          if (!item._id?.startsWith("temp-")) {
            try {
              await dispatch(removeItemFromCartAction(item._id));
            } catch (cartError) {
              console.error(`Error removing item from cart: ${item.title}`, cartError);
            }
          }

          successCount++;
        } catch (err) {
          console.error(`Lỗi xử lý cho sản phẩm: ${item.title}`, err);
          failedItems.push(item.title + " (lỗi không xác định)");
          continue;
        }
      }

      //  Thông báo kết quả
      if (failedItems.length === 0) {
        toast.success("Thanh toán & tạo đơn tất cả sản phẩm thành công!");
        sessionStorage.removeItem("checkoutItems");
        router.push("/auth/order");
      } else if (successCount > 0) {
        toast.warning(
          `Đã xử lý thành công ${successCount} đơn hàng. ${failedItems.length} đơn thất bại: ${failedItems.join(", ")}`
        );
        const remainingItems = cartItems.filter(
          (item) => failedItems.includes(item.title)
        );
        if (remainingItems.length > 0) {
          sessionStorage.setItem("checkoutItems", JSON.stringify(remainingItems));
        } else {
          sessionStorage.removeItem("checkoutItems");
        }
      } else {
        toast.error("Không thể xử lý đơn hàng nào. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Có lỗi xảy ra khi tạo đơn hàng, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!cartItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  // Breadcrumb data
  const breadcrumbs = [
    { label: "Trang chủ", href: "/home", icon: Home },
    { label: "Giỏ hàng", href: "/auth/cartitem", icon: ShoppingCart },
    { label: "Xác nhận thuê đồ", href: "/auth/order", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
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

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-100 rounded-2xl mb-4">
            <Truck className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Xác nhận thuê đồ
          </h1>
          <p className="text-lg text-gray-600">
            Kiểm tra thông tin trước khi thanh toán
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cột trái */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sản phẩm */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                <Package className="w-7 h-7 text-blue-600" />
                Sản phẩm thuê ({cartItems.length})
              </h2>
              <div className="space-y-4">
                {currentItems.map((item) => {
                  // Use editing data if available, otherwise use original data
                  const editingData = editingItems[item._id];
                  const displayItem: CartItem = editingData ? {
                    ...item,
                    quantity: editingData.quantity,
                    rentalStartDate: editingData.rentalStartDate,
                    rentalEndDate: editingData.rentalEndDate,
                  } : item;

                  const days = calculateRentalDays(displayItem);
                  const durationText = getRentalDurationText(
                    days,
                    displayItem.priceUnit
                  );
                  const itemTotal = displayItem.basePrice * displayItem.quantity * days;
                  const itemDeposit = displayItem.depositAmount * displayItem.quantity;

                  return (
                    <div
                      key={item._id}
                      className="group flex gap-6 p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative bg-gray-100 rounded-xl w-32 h-32 flex-shrink-0 overflow-hidden ring-2 ring-gray-200 group-hover:ring-emerald-200 transition-all">
                        {item.primaryImage ? (
                          <img
                            src={item.primaryImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-14 h-14" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {item.shortDescription}
                            </p>
                          </div>
                          {!editingItems[item._id] ? (
                            <button
                              onClick={() => startEditing(item)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveItem(item)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Lưu"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelEditing(item._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hủy"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {!editingItems[item._id] ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200">
                                <Package className="w-3.5 h-3.5" />
                                {item.quantity} cái
                              </span>
                              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-purple-200">
                                <Calendar className="w-3.5 h-3.5" />
                                {durationText}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium">
                                {format(
                                  new Date(item.rentalStartDate!),
                                  "dd/MM/yyyy HH:mm"
                                )} →{" "}
                                {format(new Date(item.rentalEndDate!), "dd/MM/yyyy HH:mm")}
                              </span>
                            </div>
                            {/* View Product Detail Button */}
                            {item.itemId && (
                              <div className="pt-2">
                                <Link
                                  href={`/products/details?id=${item.itemId}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-semibold"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Xem chi tiết sản phẩm</span>
                                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                                </Link>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            {/* Quantity Input */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Số lượng <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.availableQuantity}
                                value={editingItems[item._id].quantity}
                                onChange={(e) => updateEditingField(item._id, "quantity", parseInt(e.target.value) || 1)}
                                className={`w-full px-3 py-2 text-base border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${itemErrors[item._id]?.quantity
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300 hover:border-gray-400"
                                  }`}
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Số lượng có sẵn: {item.availableQuantity} sản phẩm
                              </p>
                              {itemErrors[item._id]?.quantity && (
                                <p className="mt-1 text-xs text-red-600">{itemErrors[item._id].quantity}</p>
                              )}
                            </div>

                            {/* Date Inputs */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Ngày bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editingItems[item._id].rentalStartDate}
                                  onChange={(e) => updateEditingField(item._id, "rentalStartDate", e.target.value)}
                                  min={getMinDateTime()}
                                  className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${itemErrors[item._id]?.rentalStartDate
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400"
                                    }`}
                                />
                                {itemErrors[item._id]?.rentalStartDate && (
                                  <p className="mt-1 text-xs text-red-600">{itemErrors[item._id].rentalStartDate}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Ngày kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editingItems[item._id].rentalEndDate}
                                  onChange={(e) => updateEditingField(item._id, "rentalEndDate", e.target.value)}
                                  min={editingItems[item._id].rentalStartDate || getMinDateTime()}
                                  className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${itemErrors[item._id]?.rentalEndDate
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400"
                                    }`}
                                />
                                {itemErrors[item._id]?.rentalEndDate && (
                                  <p className="mt-1 text-xs text-red-600">{itemErrors[item._id].rentalEndDate}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 -mx-6 px-6 pb-2 rounded-b-xl">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Giá thuê:</span>
                            <p className="text-2xl font-bold text-emerald-600">
                              {itemTotal.toLocaleString("vi-VN")}₫
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Tiền cọc:</span>
                            <p className="text-xl font-bold text-amber-600">
                              {itemDeposit.toLocaleString("vi-VN")}₫
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {cartItems.length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${currentPage === 1
                      ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                      : "text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${currentPage === pageNum
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                          : "border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${currentPage === totalPages
                      ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                      : "text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              {cartItems.length > itemsPerPage && (
                <div className="mt-3 text-center text-sm text-gray-600">
                  Trang {currentPage} / {totalPages} ({cartItems.length} sản phẩm)
                </div>
              )}
            </div>

            {/* Địa chỉ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <span>Địa chỉ nhận hàng</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Nhập họ và tên"
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm hover:border-gray-300"
                    value={shipping.fullName}
                    onChange={(e) =>
                      setShipping({ ...shipping, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Nhập số điện thoại"
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm hover:border-gray-300"
                    value={shipping.phone}
                    onChange={(e) =>
                      setShipping({ ...shipping, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Address Selector Component */}
              <div className="mt-6">
                <AddressSelector
                  selectedAddressId={selectedAddressId}
                  onSelect={(address) => {
                    setSelectedAddressId(address._id);
                    applyAddressToShipping(address);
                  }}
                />
              </div>
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  placeholder="Ví dụ: Giao giờ hành chính, vui lòng gọi trước..."
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none shadow-sm hover:border-gray-300"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-xl mb-4 flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Percent className="w-5 h-5 text-emerald-600" />
                </div>
                <span>Mã giảm giá</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Chọn một mã giảm giá phù hợp để tiết kiệm cho đơn hàng hiện tại của bạn.
              </p>
              <DiscountSelector
                rentalTotal={rentalTotal}
                selectedDiscount={appliedDiscount}
                onSelect={setAppliedDiscount}
              />
            </div>

            <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl p-8 sticky top-24 border-2 border-emerald-500/20">
              <h2 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span>Tóm tắt thanh toán</span>
              </h2>
              <div className="space-y-3 text-base bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-emerald-50">Tiền thuê</span>
                  <span className="font-semibold text-white">
                    {rentalTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-emerald-50">
                      Giảm giá ({appliedDiscount.discount.code})
                    </span>
                    <span className="font-semibold text-emerald-100">
                      -{discountAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-yellow-200">Phí dịch vụ ({taxRate}%)</span>
                  <span className="font-semibold text-yellow-100">
                    {taxAmount.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-amber-200">Tiền cọc</span>
                  <span className="font-semibold text-amber-100">
                    {depositTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-emerald-100 text-center italic">
                    (Hoàn lại tiền cọc sau khi trả đồ)
                  </p>
                </div>
              </div>
              <div className="mt-6 bg-white/20 rounded-xl p-4 backdrop-blur-sm border border-white/30">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Tổng cộng</span>
                  <span className="text-3xl font-bold text-yellow-200">
                    {grandTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-6 w-full bg-white text-emerald-700 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-all transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl border-2 border-white/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Đặt thuê ngay</span>
                  </>
                )}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-100 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Thanh toán an toàn qua Ví điện tử</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thông báo lỗi ví không đủ tiền */}
      <PopupModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        type="error"
        title={errorModalTitle}
        message={errorModalMessage}
        buttonText="Đã hiểu"
        secondaryButtonText="Đến ví"
        onSecondaryButtonClick={() => {
          setIsErrorModalOpen(false);
          router.push('/wallet');
        }}
      />

    </div>
  );
}