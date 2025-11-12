'use client';

import { useCallback, useEffect, useState } from "react";
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
  Truck,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Check,
  Home,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Edit2,
  X,
  Save,
  Eye,
  ExternalLink,
} from "lucide-react";
import { 
  type Discount, 
  validateDiscount, 
  listAvailableDiscounts 
} from "@/services/products/discount/discount.api";
import api from "../../../services/customizeAPI";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  type UserAddress,
} from "@/services/auth/userAddress.api";
import { payOrderWithWallet } from "@/services/wallet/wallet.api";
import PopupModal from "@/components/ui/common/PopupModal";

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

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
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
  const [serviceFeeRate, setServiceFeeRate] = useState<number>(3); // Default 3%
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
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [confirmPopup, setConfirmPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "Xác nhận",
    message: "",
    onConfirm: () => { },
  });
  // thanh toan 
  const [modal, setModal] = useState({ open: false, title: "", message: "" });


  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [publicDiscount, setPublicDiscount] = useState<Discount | null>(null);
  const [privateDiscount, setPrivateDiscount] = useState<Discount | null>(null);
  const [publicDiscountAmount, setPublicDiscountAmount] = useState(0);
  const [privateDiscountAmount, setPrivateDiscountAmount] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [showDiscountList, setShowDiscountList] = useState(false);
  const [discountListError, setDiscountListError] = useState<string | null>(null);

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
      toast.error(`Sản phẩm "${invalid.title}" chưa có ngày thuê hợp lệ.`);
      router.push("/auth/cartitem");
      return;
    }
    setCartItems(items);
    setSelectedItemIds(items.map((item) => item._id));
    setHasInitializedSelection(true);
  }, [router]);


  useEffect(() => {
    const fetchServiceFeeRate = async () => {
      try {
        const response = await api.get("/serviceFee/current");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (data?.success && data?.data?.serviceFeeRate !== undefined) {
          setServiceFeeRate(data.data.serviceFeeRate);
        }
      } catch (error) {
        console.error("Error fetching serviceFee rate:", error);

      }
    };
    fetchServiceFeeRate();
  }, []);
  // Note: Using default serviceFeeRate; dynamic fetch can be re-enabled when needed

  // Apply address to shipping form
  const applyAddressToShipping = (address: UserAddress) => {
    setShipping(prev => ({
      ...prev,
      street: address.Address,
      ward: address.District,
      province: address.City,
    }));
  };

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

  useEffect(() => {
    if (!hasInitializedSelection) return;
    setSelectedItemIds((prev) =>
      prev.filter((id) => cartItems.some((item) => item._id === id))
    );
  }, [cartItems, hasInitializedSelection]);

  const loadAvailableDiscounts = useCallback(async () => {
      if (!accessToken) return;

      setLoadingDiscounts(true);
    setDiscountListError(null);
      try {
        const response = await listAvailableDiscounts(1, 50);
        if (response.status === "success" && response.data) {
          // Hiển thị tất cả discount active - logic validate sẽ kiểm tra thời gian khi áp dụng
          setAvailableDiscounts(response.data);
      } else {
        setDiscountListError(response.message || "Không thể tải danh sách mã giảm giá.");
        }
      } catch (error) {
        console.error("Error loading available discounts:", error);
      setDiscountListError("Không thể tải danh sách mã giảm giá. Vui lòng thử lại.");
      } finally {
        setLoadingDiscounts(false);
      }
  }, [accessToken]);

  // Load available discounts for user
  useEffect(() => {
    if (accessToken && cartItems.length > 0) {
      loadAvailableDiscounts();
    }
  }, [accessToken, cartItems.length, loadAvailableDiscounts]);

  // Close discount dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.discount-input-container')) {
        setShowDiscountList(false);
      }
    };

    if (showDiscountList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDiscountList]);


  // Pagination calculations
  const totalPages = Math.ceil(cartItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = cartItems.slice(startIndex, endIndex);
  const selectedCartItems = cartItems.filter((item) =>
    selectedItemIds.includes(item._id)
  );

  const rentalTotal = selectedCartItems.reduce((sum, item) => {
    const days = calculateRentalDays(item);
    return sum + item.basePrice * item.quantity * days;
  }, 0);

  console.log("Render - rentalTotal:", rentalTotal, "cartItems:", cartItems.length);

  // Tính depositTotal
  const depositTotal = selectedCartItems.reduce(
    (sum, item) => sum + item.depositAmount * item.quantity,
    0
  );

  // Tính serviceFee trên rentalTotal (trước discount) - theo logic backend
  const serviceFeeAmount = (rentalTotal * serviceFeeRate) / 100;

  // Tính totalDiscountAmount từ public và private discount (chỉ áp dụng khi có sản phẩm được chọn)
  const effectivePublicDiscountAmount = selectedCartItems.length > 0 ? publicDiscountAmount : 0;
  const effectivePrivateDiscountAmount = selectedCartItems.length > 0 ? privateDiscountAmount : 0;
  const totalDiscountAmount = effectivePublicDiscountAmount + effectivePrivateDiscountAmount;

  // Tính grandTotal theo logic backend: totalAmount + serviceFee + depositAmount - totalDiscountAmount
  const grandTotal = Math.max(0, rentalTotal + serviceFeeAmount + depositTotal - totalDiscountAmount);

  // Kiểm tra minOrderAmount cho public discount
  useEffect(() => {
    if (
      publicDiscount &&
      publicDiscount.minOrderAmount &&
      (rentalTotal + depositTotal) < publicDiscount.minOrderAmount
    ) {
      setPublicDiscount(null);
      setPublicDiscountAmount(0);
      toast.info("Đơn hàng không còn đáp ứng điều kiện tối thiểu của mã giảm giá công khai đã chọn.");
    }
  }, [publicDiscount, rentalTotal, depositTotal]);

  // Kiểm tra minOrderAmount cho private discount
  useEffect(() => {
    if (
      privateDiscount &&
      privateDiscount.minOrderAmount
    ) {
      const baseAmountAfterPublic = Math.max(0, (rentalTotal + depositTotal) - publicDiscountAmount);
      if (baseAmountAfterPublic < privateDiscount.minOrderAmount) {
        setPrivateDiscount(null);
        setPrivateDiscountAmount(0);
        toast.info("Đơn hàng không còn đáp ứng điều kiện tối thiểu của mã giảm giá riêng tư đã chọn.");
      }
    }
  }, [privateDiscount, rentalTotal, depositTotal, publicDiscountAmount]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAllItems = () => {
    setSelectedItemIds(cartItems.map((item) => item._id));
  };

  const handleDeselectAllItems = () => {
    setSelectedItemIds([]);
  };

  // Helper function to calculate discount amount (same logic as backend)
  const calculateDiscountAmount = (
    type: "percent" | "fixed",
    value: number,
    baseAmount: number,
    maxDiscountAmount?: number
  ): number => {
    let amount = type === "percent" ? (baseAmount * value) / 100 : value;
    if (maxDiscountAmount && maxDiscountAmount > 0) {
      amount = Math.min(amount, maxDiscountAmount);
    }
    amount = Math.max(0, Math.min(baseAmount, Math.floor(amount)));
    return amount;
  };

  // Handle discount code
  const handleApplyDiscount = async (code?: string) => {
    const codeToApply = code || discountCode.trim();
    if (!codeToApply) {
      setDiscountError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (selectedCartItems.length === 0) {
      setDiscountError("Vui lòng chọn ít nhất một sản phẩm để áp dụng mã giảm giá");
      return;
    }

    setDiscountLoading(true);
    setDiscountError(null);

    try {
      // Tính discount dựa trên tổng tiền (tiền thuê + tiền cọc)
      const baseAmountForDiscount = rentalTotal + depositTotal;
      
      console.log("Validating discount:", {
        code: codeToApply.toUpperCase(),
        baseAmount: baseAmountForDiscount,
        rentalTotal,
        depositTotal,
        selectedItemsCount: selectedCartItems.length
      });
      
      const response = await validateDiscount({
        code: codeToApply.toUpperCase(),
        baseAmount: baseAmountForDiscount,
      });
      
      console.log("Validation response:", response);

      if (response.status === "success" && response.data) {
        const discount = response.data.discount;
        let amount = response.data.amount || 0;

        // Tính lại discount amount để đảm bảo chính xác
        const calculatedAmount = calculateDiscountAmount(
          discount.type,
          discount.value,
          baseAmountForDiscount,
          discount.maxDiscountAmount
        );
        
        // Sử dụng amount từ backend, nhưng log để debug
        console.log("Discount calculation:", {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          baseAmount: baseAmountForDiscount,
          maxDiscountAmount: discount.maxDiscountAmount || 0,
          backendAmount: amount,
          calculatedAmount: calculatedAmount,
          match: Math.abs(amount - calculatedAmount) < 0.01
        });

        console.log("Applying discount:", {
          code: discount.code,
          isPublic: discount.isPublic,
          type: discount.type,
          value: discount.value,
          maxDiscountAmount: discount.maxDiscountAmount,
          minOrderAmount: discount.minOrderAmount,
          amount: amount,
          rentalTotal: rentalTotal,
          depositTotal: depositTotal,
          totalAmountForDiscount: rentalTotal + depositTotal,
          expectedAmount: discount.type === "percent"
            ? ((rentalTotal + depositTotal) * discount.value) / 100
            : discount.value,
          discount: discount
        });

        // Kiểm tra loại discount (public hay private)
        if (discount.isPublic) {
          // Mã công khai - chỉ cho phép 1 mã công khai
          if (publicDiscount) {
            setDiscountError("Bạn đã áp dụng mã công khai. Chỉ được áp dụng 1 mã công khai.");
            setDiscountLoading(false);
            return;
          }
          // Không được có mã công khai nếu đã có mã private có cùng code
          if (privateDiscount && privateDiscount.code === discount.code) {
            setDiscountError("Mã này đã được áp dụng");
            setDiscountLoading(false);
            return;
          }
          setPublicDiscount(discount);
          setPublicDiscountAmount(amount);
          console.log("Set public discount amount:", amount);

          // Nếu đã có mã private, tính lại mã private với baseAmount mới
          if (privateDiscount) {
            const baseAmountAfterPublic = Math.max(0, baseAmountForDiscount - amount);
            try {
              const revalidatePrivateResponse = await validateDiscount({
                code: privateDiscount.code.toUpperCase(),
                baseAmount: baseAmountAfterPublic,
              });
              if (revalidatePrivateResponse.status === "success" && revalidatePrivateResponse.data) {
                setPrivateDiscountAmount(revalidatePrivateResponse.data.amount);
              }
            } catch (e) {
              console.error("Error revalidating private discount:", e);
            }
          }

          toast.success("Áp dụng mã giảm giá công khai thành công!");
        } else {
          // Mã riêng tư - chỉ cho phép 1 mã riêng tư
          if (privateDiscount) {
            setDiscountError("Bạn đã áp dụng mã riêng tư. Chỉ được áp dụng 1 mã riêng tư.");
            setDiscountLoading(false);
            return;
          }
          // Không được có mã private nếu đã có mã public có cùng code
          if (publicDiscount && publicDiscount.code === discount.code) {
            setDiscountError("Mã này đã được áp dụng");
            setDiscountLoading(false);
            return;
          }
          // Tính lại discount amount dựa trên baseAmount sau khi đã trừ mã công khai
          const baseAmountAfterPublic = Math.max(0, baseAmountForDiscount - publicDiscountAmount);
          // Validate lại với baseAmount mới
          try {
            const revalidateResponse = await validateDiscount({
              code: discount.code.toUpperCase(),
              baseAmount: baseAmountAfterPublic,
            });
            if (revalidateResponse.status === "success" && revalidateResponse.data) {
              amount = revalidateResponse.data.amount;
            }
          } catch (e) {
            console.error("Error revalidating discount:", e);
          }
          setPrivateDiscount(discount);
          setPrivateDiscountAmount(amount);
          toast.success("Áp dụng mã giảm giá riêng tư thành công!");
        }

        setDiscountCode("");
        setShowDiscountList(false);
      } else {
        // Hiển thị lý do cụ thể từ backend nếu có
        const errorMessage = response.message || "Mã giảm giá không hợp lệ";
        const reason = (response as { reason?: string }).reason;
        
        let detailedMessage = errorMessage;
        if (reason) {
          switch (reason) {
            case "INVALID_CODE":
              detailedMessage = "Mã giảm giá không tồn tại";
              break;
            case "NOT_STARTED":
              detailedMessage = "Mã giảm giá chưa đến thời gian sử dụng";
              break;
            case "EXPIRED":
              detailedMessage = "Mã giảm giá đã hết hạn";
              break;
            case "USAGE_LIMIT":
              detailedMessage = "Mã giảm giá đã hết lượt sử dụng";
              break;
            case "BELOW_MIN_ORDER":
              const baseAmount = rentalTotal + depositTotal;
              // Try to get minOrderAmount from available discounts
              const discountInfo = availableDiscounts.find(d => d.code === codeToApply.toUpperCase());
              if (discountInfo?.minOrderAmount) {
                const needed = discountInfo.minOrderAmount - baseAmount;
                detailedMessage = `Đơn hàng cần thêm ${needed.toLocaleString("vi-VN")}₫ để áp dụng mã này (Tối thiểu: ${discountInfo.minOrderAmount.toLocaleString("vi-VN")}₫, Hiện tại: ${baseAmount.toLocaleString("vi-VN")}₫)`;
              } else {
                detailedMessage = `Đơn hàng chưa đạt mức tối thiểu để áp dụng mã này (Hiện tại: ${baseAmount.toLocaleString("vi-VN")}₫)`;
              }
              break;
            case "NOT_ALLOWED_USER":
              detailedMessage = "Bạn không có quyền sử dụng mã giảm giá này";
              break;
            case "PER_USER_LIMIT":
              detailedMessage = "Bạn đã sử dụng hết số lần cho phép của mã này";
              break;
            case "OWNER_NOT_MATCH":
              detailedMessage = "Mã giảm giá này chỉ áp dụng cho sản phẩm của chủ sở hữu cụ thể";
              break;
            case "ITEM_NOT_MATCH":
              detailedMessage = "Mã giảm giá này chỉ áp dụng cho sản phẩm cụ thể";
              break;
            case "ASSIGN_NOT_STARTED":
              detailedMessage = "Mã giảm giá riêng tư chưa đến thời gian sử dụng";
              break;
            case "ASSIGN_EXPIRED":
              detailedMessage = "Mã giảm giá riêng tư đã hết thời gian sử dụng";
              break;
            default:
              detailedMessage = errorMessage;
          }
        }
        
        // Log chi tiết để debug
        console.error("Discount validation failed:", {
          code: codeToApply,
          reason,
          message: detailedMessage,
          baseAmount: baseAmountForDiscount,
          response
        });
        
        setDiscountError(detailedMessage);
      }
    } catch (error: unknown) {
      console.error("Error applying discount:", error);
      let errorMessage = "Có lỗi xảy ra khi áp dụng mã giảm giá";
      if (error && typeof error === "object") {
        const apiError = error as ApiError;
        errorMessage = apiError?.response?.data?.message || 
                      apiError?.message || 
                      errorMessage;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      setDiscountError(errorMessage);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemovePublicDiscount = () => {
    setPublicDiscount(null);
    setPublicDiscountAmount(0);
    setDiscountError(null);
    toast.info("Đã xóa mã giảm giá công khai");
  };

  const handleRemovePrivateDiscount = () => {
    setPrivateDiscount(null);
    setPrivateDiscountAmount(0);
    setDiscountError(null);
    toast.info("Đã xóa mã giảm giá riêng tư");
  };

  const handleSelectDiscount = (discount: Discount) => {
    setDiscountCode(discount.code);
    handleApplyDiscount(discount.code);
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

    if (selectedCartItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để đặt thuê");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToProcess = selectedCartItems;
      const unselectedItems = cartItems.filter(
        (item) => !selectedItemIds.includes(item._id)
      );
      const failedItemIds: string[] = [];
      const failedItemMessages: string[] = [];

      for (const item of itemsToProcess) {
        console.log("Bắt đầu xử lý cho:", item.title);

        const result = await dispatch(
          createOrderAction({
            itemId: item.itemId,
            quantity: item.quantity,
            startAt: item.rentalStartDate,
            endAt: item.rentalEndDate,
            shippingAddress: shipping,
            paymentMethod: "Wallet",
            note,
            publicDiscountCode: publicDiscount?.code || null,
            privateDiscountCode: privateDiscount?.code || null,
          })
        );

        if (!result?.success) {
          const errorMessage = result?.error || "Không thể tạo đơn hàng";
          toast.error(`Không thể tạo đơn cho sản phẩm: ${item.title}. ${errorMessage}`);
          failedItemMessages.push(item.title);
          failedItemIds.push(item._id);
          console.error(`Order failed for ${item.title}:`, result?.error);
          continue;
        }
        const orderData = result?.data as
          | { orderId?: string; _id?: string; userId?: string }
          | undefined;
        const orderIdRaw = orderData?.orderId ?? orderData?._id;
        const userId = orderData?.userId;

        if (!orderIdRaw) {
          console.error("Response từ createOrder:", result);
          toast.error(`Không lấy được orderId cho sản phẩm: ${item.title}`);
          failedItemMessages.push(item.title + " (lỗi lấy orderId)");
          failedItemIds.push(item._id);
          continue;
        }

        const orderId =
          typeof orderIdRaw === "string" ? orderIdRaw : String(orderIdRaw);
        console.log(" Đã tạo order với ID:", orderId, "Bắt đầu thanh toán...");
        console.log(" Order data:", result?.data);

        try {
          const paymentResult = await payOrderWithWallet(orderId, userId);

          if (paymentResult && paymentResult.success === false) {
            const errorMsg =
              paymentResult.error ||
              paymentResult.message ||
              "Thanh toán thất bại";
            toast.error(
              `Thanh toán thất bại cho sản phẩm: ${item.title}. ${errorMsg}`
            );
            failedItemMessages.push(item.title + " (thanh toán không thành công)");
            failedItemIds.push(item._id);
            continue;
          }

          console.log(" Thanh toán thành công cho order:", orderId);
        } catch (paymentError: unknown) {
          let errorMessage = "Thanh toán thất bại";

          if (paymentError && typeof paymentError === "object") {
            const error = paymentError as ApiError;
            const errorData = error.response?.data;

            if (errorData) {
              console.log(" Error data từ backend:", errorData);

              errorMessage =
                errorData.message || errorData.error || "Thanh toán thất bại";

              const isInsufficientBalance =
                errorData.error === "Ví người dùng không đủ tiền" ||
                errorMessage.includes("không đủ tiền") ||
                errorData.error?.includes("không đủ tiền") ||
                errorData.error?.includes("Ví người dùng không đủ tiền");

              console.log(
                " Is insufficient balance?",
                isInsufficientBalance,
                "error:",
                errorData.error
              );

              if (isInsufficientBalance) {
                errorMessage = "Số dư ví không đủ. Vui lòng nạp tiền vào ví.";

                console.log(" Đang mở modal với message:", errorMessage);
                setErrorModalTitle("Ví không đủ tiền");
                setErrorModalMessage(errorMessage);
                setIsErrorModalOpen(true);
                console.log(" Modal state đã được set:", {
                  title: "Ví không đủ tiền",
                  message: errorMessage,
                });
              } else {
                toast.error(`${errorMessage} - Sản phẩm: ${item.title}`, {
                  duration: 5000,
                });
              }
              failedItemMessages.push(item.title + " (thanh toán không thành công)");
              failedItemIds.push(item._id);
              continue;
            }

            if (typeof error.message === "string") {
              errorMessage = error.message;
              toast.error(`${errorMessage} - Sản phẩm: ${item.title}`, {
                duration: 5000,
              });
              failedItemMessages.push(item.title + " (thanh toán không thành công)");
              failedItemIds.push(item._id);
              continue;
            }
          }

          if (typeof paymentError === "string") {
            errorMessage = paymentError;
          }

          toast.error(`Thanh toán thất bại cho sản phẩm: ${item.title}`, {
            duration: 5000,
          });
          console.error(" Lỗi thanh toán:", paymentError);
          failedItemMessages.push(item.title + " (thanh toán không thành công)");
          failedItemIds.push(item._id);
          continue;
        }

        if (!item._id?.startsWith("temp-")) {
          try {
            await dispatch(removeItemFromCartAction(item._id));
          } catch (cartError) {
            console.error(
              `Error removing item from cart: ${item.title}`,
              cartError
            );
          }
        }
      }

      const successCount = itemsToProcess.length - failedItemIds.length;

      if (failedItemIds.length === 0) {
        toast.success("Thanh toán & tạo đơn tất cả sản phẩm đã chọn thành công!");
        const remainingItems = unselectedItems;
        if (remainingItems.length > 0) {
          sessionStorage.setItem("checkoutItems", JSON.stringify(remainingItems));
        } else {
          sessionStorage.removeItem("checkoutItems");
        }
        router.push("/auth/order");
      } else if (successCount > 0) {
        toast.warning(
          `Đã xử lý thành công ${successCount} đơn hàng. ${failedItemMessages.length} đơn thất bại: ${failedItemMessages.join(", ")}`
        );
        const remainingItems = [
          ...unselectedItems,
          ...itemsToProcess.filter((item) => failedItemIds.includes(item._id)),
        ];
        sessionStorage.setItem(
          "checkoutItems",
          JSON.stringify(remainingItems)
        );
      } else {
        toast.error(
          `Không thể xử lý đơn hàng nào. Chi tiết: ${failedItemMessages.join(", ")}`
        );
        const remainingItems = [...unselectedItems, ...itemsToProcess];
        sessionStorage.setItem(
          "checkoutItems",
          JSON.stringify(remainingItems)
        );
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
    <>
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
            {/* Left column: products + address */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                  <Package className="w-7 h-7 text-blue-600" />
                  Sản phẩm thuê ({cartItems.length})
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-sm">
                      <CheckCircle2 className={`w-4 h-4 ${selectedItemIds.length > 0 ? "text-emerald-600" : "text-gray-400"}`} />
                      <span className="text-sm font-semibold text-gray-700">
                        Đã chọn <span className="text-emerald-600">{selectedItemIds.length}</span>/{cartItems.length} sản phẩm
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSelectAllItems}
                      disabled={cartItems.length === 0 || selectedItemIds.length === cartItems.length}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      Chọn tất cả
                    </button>
                    <button
                      onClick={handleDeselectAllItems}
                      disabled={selectedItemIds.length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentItems.map((item) => {
                    const editingData = editingItems[item._id];
                    const displayItem: CartItem = editingData
                      ? {
                          ...item,
                          quantity: editingData.quantity,
                          rentalStartDate: editingData.rentalStartDate,
                          rentalEndDate: editingData.rentalEndDate,
                        }
                      : item;
                    const isSelected = selectedItemIds.includes(item._id);

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
                        className={`group relative flex gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                          isSelected
                            ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-xl ring-2 ring-emerald-200"
                            : "bg-white border-gray-200 hover:border-emerald-300 hover:shadow-lg"
                        }`}
                      >
                        {/* Checkbox at the beginning */}
                        <div className="flex-shrink-0 pt-1">
                          <label className="relative flex items-center justify-center cursor-pointer group/checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItemSelection(item._id)}
                              className="sr-only peer"
                              aria-label={`Chọn sản phẩm ${item.title}`}
                            />
                            <div className={`relative w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 shadow-md scale-110"
                                : "bg-white border-gray-300 group-hover/checkbox:border-emerald-400 group-hover/checkbox:bg-emerald-50"
                            }`}>
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </label>
                        </div>

                        {/* Product Image */}
                        <div className={`relative bg-gray-100 rounded-xl w-32 h-32 flex-shrink-0 overflow-hidden ring-2 transition-all ${
                          isSelected
                            ? "ring-emerald-300 shadow-md"
                            : "ring-gray-200 group-hover:ring-emerald-200"
                        }`}>
                          {item.primaryImage ? (
                            <Image
                              src={item.primaryImage}
                              alt={item.title}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-14 h-14" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-lg animate-pulse">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Product Content */}
                        <div className="flex-1 space-y-4 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-xl font-bold line-clamp-2 mb-2 transition-colors ${
                                isSelected
                                  ? "text-emerald-800"
                                  : "text-gray-800 group-hover:text-emerald-700"
                              }`}>
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {item.shortDescription}
                              </p>
                            </div>
                            {!editingItems[item._id] ? (
                              <button
                                onClick={() => startEditing(item)}
                                className="flex-shrink-0 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="flex gap-2 flex-shrink-0">
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
                                  )} → {format(new Date(item.rentalEndDate!), "dd/MM/yyyy HH:mm")}
                                </span>
                              </div>
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
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Số lượng <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.availableQuantity}
                                  value={editingItems[item._id].quantity}
                                  onChange={(e) =>
                                    updateEditingField(
                                      item._id,
                                      "quantity",
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className={`w-full px-3 py-2 text-base border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                                    itemErrors[item._id]?.quantity
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400"
                                    }`}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Số lượng có sẵn: {item.availableQuantity} sản phẩm
                                </p>
                                {itemErrors[item._id]?.quantity && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {itemErrors[item._id].quantity}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ngày bắt đầu <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={editingItems[item._id].rentalStartDate}
                                    onChange={(e) =>
                                      updateEditingField(item._id, "rentalStartDate", e.target.value)
                                    }
                                    min={getMinDateTime()}
                                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                                      itemErrors[item._id]?.rentalStartDate
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-300 hover:border-gray-400"
                                      }`}
                                  />
                                  {itemErrors[item._id]?.rentalStartDate && (
                                    <p className="mt-1 text-xs text-red-600">
                                      {itemErrors[item._id].rentalStartDate}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ngày kết thúc <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={editingItems[item._id].rentalEndDate}
                                    onChange={(e) =>
                                      updateEditingField(item._id, "rentalEndDate", e.target.value)
                                    }
                                    min={editingItems[item._id].rentalStartDate || getMinDateTime()}
                                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                                      itemErrors[item._id]?.rentalEndDate
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-300 hover:border-gray-400"
                                      }`}
                                  />
                                  {itemErrors[item._id]?.rentalEndDate && (
                                    <p className="mt-1 text-xs text-red-600">
                                      {itemErrors[item._id].rentalEndDate}
                                    </p>
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

                {cartItems.length > itemsPerPage && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        currentPage === 1
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
                          className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                            currentPage === pageNum
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
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        currentPage === totalPages
                        ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                        : "text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {cartItems.length > itemsPerPage && (
                  <div className="mt-3 text-center text-sm text-gray-600">
                    Trang {currentPage} / {totalPages} ({cartItems.length} sản phẩm)
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg" />
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

                <div className="mt-6">
                <AddressSelector
                  selectedAddressId={selectedAddressId}
                  onSelect={(address) => {
                    setSelectedAddressId(address._id);
                    applyAddressToShipping(address);
                  }}
                />
              </div>

                {!selectedAddressId && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Địa chỉ (số nhà, đường...) <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder="Nhập địa chỉ chi tiết"
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm hover:border-gray-300"
                      value={shipping.street}
                      onChange={(e) =>
                        setShipping({ ...shipping, street: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Phường/Xã
                    </label>
                    <input
                      placeholder="Nhập phường/xã"
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm hover:border-gray-300"
                      value={shipping.ward}
                      onChange={(e) =>
                        setShipping({ ...shipping, ward: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder="Nhập tỉnh/thành phố"
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm hover:border-gray-300"
                      value={shipping.province}
                      onChange={(e) =>
                        setShipping({ ...shipping, province: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

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

            {/* Right column: payment summary */}
            <aside className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl p-8 sticky top-24 border-2 border-emerald-500/20">
              <h2 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span>Tóm tắt thanh toán</span>
              </h2>

              {/* Discount Code Section */}
                <div
                  className="mb-4 bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 relative"
                  style={{ zIndex: showDiscountList ? 50 : 1, overflow: showDiscountList ? "visible" : "visible" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-semibold text-white">
                  Mã giảm giá (Tối đa: 1 công khai + 1 riêng tư)
                </label>
                    <button
                      type="button"
                      onClick={loadAvailableDiscounts}
                      className="text-[10px] font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingDiscounts}
                    >
                      {loadingDiscounts ? "Đang tải..." : "Làm mới"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {publicDiscount && (
                      <div className="flex items-center justify-between p-2.5 bg-blue-500/20 rounded-lg border border-blue-300/30 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <CheckCircle2 className="w-4 h-4 text-blue-300 flex-shrink-0" />
                            <span className="font-bold text-white text-sm truncate">
                              {publicDiscount.code}
                            </span>
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                              Công khai
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              publicDiscount.type === "percent"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {publicDiscount.type === "percent"
                                ? `-${publicDiscount.value}%`
                                : `-${publicDiscount.value.toLocaleString("vi-VN")}₫`}
                            </span>
                          </div>
                          <p className="text-[10px] text-blue-100/90 font-medium">
                            Đã giảm: <span className="font-bold">{effectivePublicDiscountAmount.toLocaleString("vi-VN")}₫</span>
                          </p>
                        </div>
                        <button
                          onClick={handleRemovePublicDiscount}
                          className="p-1 text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                          title="Xóa mã công khai"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {privateDiscount && (
                      <div className="flex items-center justify-between p-2.5 bg-purple-500/20 rounded-lg border border-purple-300/30 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <CheckCircle2 className="w-4 h-4 text-purple-300 flex-shrink-0" />
                            <span className="font-bold text-white text-sm truncate">
                              {privateDiscount.code}
                            </span>
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                              Riêng tư
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              privateDiscount.type === "percent"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {privateDiscount.type === "percent"
                                ? `-${privateDiscount.value}%`
                                : `-${privateDiscount.value.toLocaleString("vi-VN")}₫`}
                            </span>
                          </div>
                          <p className="text-[10px] text-purple-100/90 font-medium">
                            Đã giảm: <span className="font-bold">{effectivePrivateDiscountAmount.toLocaleString("vi-VN")}₫</span>
                          </p>
                        </div>
                        <button
                          onClick={handleRemovePrivateDiscount}
                          className="p-1 text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                          title="Xóa mã riêng tư"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                        <div className="flex gap-1.5">
                      <div
                        className="flex-1 relative discount-input-container min-w-0"
                        style={{ zIndex: showDiscountList ? 100 : 1 }}
                      >
                            <input
                              type="text"
                          placeholder={
                            publicDiscount && !privateDiscount
                              ? "Nhập mã riêng tư"
                              : !publicDiscount && privateDiscount
                              ? "Nhập mã công khai"
                              : "Nhập mã giảm giá"
                          }
                              value={discountCode}
                              onChange={(e) => {
                                setDiscountCode(e.target.value.toUpperCase());
                                setDiscountError(null);
                              }}
                          onKeyDown={(e) => {
                                if (e.key === "Enter") {
                              e.preventDefault();
                                  handleApplyDiscount();
                                }
                              }}
                              onFocus={() => setShowDiscountList(true)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white/20 border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50"
                            />

                        {showDiscountList && (
                          <div className="absolute top-full left-0 right-0 z-[10000] w-full mt-1 bg-white rounded-lg shadow-2xl border-2 border-emerald-200 max-h-64 overflow-y-auto">
                                <div className="sticky top-0 bg-emerald-50 p-2 border-b border-emerald-200">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-emerald-700">Mã giảm giá có sẵn</p>
                                    <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      {availableDiscounts.length} mã
                                    </span>
                                  </div>
                                </div>
                                {loadingDiscounts ? (
                                  <div className="p-4 text-center">
                                    <div className="inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <p className="text-xs text-gray-500">Đang tải mã giảm giá...</p>
                                  </div>
                            ) : availableDiscounts.length > 0 ? (
                                  <div className="divide-y divide-gray-100">
                                    {availableDiscounts.map((discount) => {
                                      const now = new Date();
                                      const start = new Date(discount.startAt);
                                      const end = new Date(discount.endAt);
                                      const isInTimeWindow = start <= now && end >= now;
                                      const isUpcoming = start > now;
                                      const isExpired = end < now;
                                      const isAlreadyApplied = Boolean(
                                        (publicDiscount && publicDiscount.code === discount.code) ||
                                        (privateDiscount && privateDiscount.code === discount.code)
                                      );
                                      const canUse = discount.active && isInTimeWindow && !isAlreadyApplied;
                                      
                                      return (
                                        <button
                                          key={discount._id}
                                          onClick={() => canUse && handleSelectDiscount(discount)}
                                          disabled={!canUse}
                                          className={`w-full p-3 text-left transition-all ${
                                            !canUse
                                              ? "bg-gray-50 opacity-60 cursor-not-allowed"
                                              : "hover:bg-emerald-50 hover:shadow-sm"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <span className={`font-bold text-sm ${
                                                  !canUse ? "text-gray-500" : "text-emerald-600"
                                                }`}>
                                                  {discount.code}
                                                </span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                                  discount.type === "percent"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : "bg-blue-100 text-blue-700"
                                                }`}>
                                                  {discount.type === "percent"
                                                    ? `-${discount.value}%`
                                                    : `-${discount.value.toLocaleString("vi-VN")}₫`}
                                                </span>
                                                {discount.isPublic ? (
                                                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                    Công khai
                                                  </span>
                                                ) : (
                                                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                                                    Riêng tư
                                                  </span>
                                                )}
                                                {isUpcoming && (
                                                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                    Sắp tới
                                                  </span>
                                                )}
                                                {isExpired && (
                                                  <span className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                                                    Đã hết hạn
                                                  </span>
                                                )}
                                                {!discount.active && (
                                                  <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                                                    Đã tắt
                                                  </span>
                                                )}
                                                {isAlreadyApplied && (
                                                  <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                                    Đã áp dụng
                                                  </span>
                                                )}
                                              </div>
                                              {discount.minOrderAmount && (
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                  <span className="font-medium">Đơn tối thiểu:</span> {discount.minOrderAmount.toLocaleString("vi-VN")}₫
                                                </p>
                                              )}
                                              {discount.maxDiscountAmount && discount.maxDiscountAmount > 0 && (
                                                <p className="text-[10px] text-gray-600">
                                                  <span className="font-medium">Giảm tối đa:</span> {discount.maxDiscountAmount.toLocaleString("vi-VN")}₫
                                                </p>
                                              )}
                                              {canUse && (() => {
                                                const baseAmount = rentalTotal + depositTotal;
                                                const previewAmount = calculateDiscountAmount(
                                                  discount.type,
                                                  discount.value,
                                                  baseAmount,
                                                  discount.maxDiscountAmount
                                                );
                                                return (
                                                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5">
                                                    Sẽ giảm: <span className="text-emerald-700">{previewAmount.toLocaleString("vi-VN")}₫</span>
                                                  </p>
                                                );
                                              })()}
                                            </div>
                                            {canUse && (
                                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                            ) : (
                              <div className="p-4 text-center">
                                <div className="text-gray-400 mb-2">
                                  <Package className="w-8 h-8 mx-auto opacity-50" />
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Hiện chưa có mã giảm giá khả dụng
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Vui lòng thử lại sau
                                </p>
                        </div>
                        )}
                      </div>
                    )}
                  </div>

                      <button
                        onClick={() => handleApplyDiscount()}
                        disabled={discountLoading || !discountCode.trim()}
                        className="px-3 py-1.5 bg-white text-emerald-600 rounded-lg hover:bg-white/90 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {discountLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </button>
                    </div>

                    {availableDiscounts.length > 0 && (
                      <button
                        onClick={() => setShowDiscountList((prev) => !prev)}
                        className="text-[10px] text-white/80 hover:text-white transition-colors underline"
                      >
                        {showDiscountList ? "Ẩn" : "Xem"} mã giảm giá có sẵn ({availableDiscounts.length})
                      </button>
                    )}

                    {discountError && <p className="text-[10px] text-red-200">{discountError}</p>}
                    {discountListError && <p className="text-[10px] text-red-200">{discountListError}</p>}
                    {!loadingDiscounts && availableDiscounts.length === 0 && !discountListError && (
                      <p className="text-[10px] text-white/70">Hiện chưa có mã giảm giá khả dụng.</p>
                    )}
                  </div>
              </div>

              <div className="space-y-3 text-base bg-white/10 rounded-xl p-4 backdrop-blur-sm relative" style={{ zIndex: 1 }}>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-emerald-50">Tiền thuê</span>
                  <span className="font-semibold text-white">
                    {rentalTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>

                  {totalDiscountAmount > 0 && (
                    <div className="space-y-1">
                      {effectivePublicDiscountAmount > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span className="text-emerald-50 text-sm">
                            Giảm giá công khai ({publicDiscount?.code})
                      </span>
                          <span className="font-semibold text-emerald-100 text-sm">
                            -{effectivePublicDiscountAmount.toLocaleString("vi-VN")}₫
                          </span>
                        </div>
                      )}
                      {effectivePrivateDiscountAmount > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-white/10">
                          <span className="text-emerald-50 text-sm">
                            Giảm giá riêng tư ({privateDiscount?.code})
                          </span>
                          <span className="font-semibold text-emerald-100 text-sm">
                            -{effectivePrivateDiscountAmount.toLocaleString("vi-VN")}₫
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-white/20">
                        <span className="text-emerald-50 font-semibold">Tổng giảm giá</span>
                    <span className="font-semibold text-emerald-100">
                          -{totalDiscountAmount.toLocaleString("vi-VN")}₫
                    </span>
                      </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-yellow-200">Phí dịch vụ ({serviceFeeRate}%)</span>
                  <span className="font-semibold text-yellow-100">
                      {serviceFeeAmount.toLocaleString("vi-VN")}₫
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
            </aside>
          </div>
        </div>
      </div>
     
      {/* Confirm Popup */}
      {confirmPopup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setConfirmPopup({
                isOpen: false,
                title: "",
                message: "",
                onConfirm: () => { },
              })
            }
          />

          {/* Popup */}
          <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 transform transition-all duration-300 scale-100 opacity-100">
            {/* Content */}
            <div className="p-6 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-emerald-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                {confirmPopup.title}
              </h3>

              {/* Message */}
              <p className="text-base mb-6 leading-relaxed text-gray-700">
                {confirmPopup.message}
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmPopup({
                      isOpen: false,
                      title: "",
                      message: "",
                      onConfirm: () => { },
                    })
                  }
                  className="flex-1 py-2.5 px-5 text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    confirmPopup.onConfirm();
                    setConfirmPopup({
                      isOpen: false,
                      title: "",
                      message: "",
                      onConfirm: () => { },
                    });
                  }}
                  className="flex-1 py-2.5 px-5 text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-4 text-emerald-700">{modal.title}</h3>
            <p className="text-gray-800 mb-6">{modal.message}</p>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl" onClick={() => setModal({ ...modal, open: false })}>
              Đóng
            </button>
          </div>
        </div>
      )}

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
          router.push("/wallet");
        }}
      />
    </>
  );
}