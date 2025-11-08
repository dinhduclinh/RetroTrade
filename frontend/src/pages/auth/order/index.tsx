import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { createOrderAction } from "@/store/order/orderActions";
import { removeItemFromCartAction } from "@/store/cart/cartActions";
import type { CartItem } from "@/services/auth/cartItem.api";
import { format } from "date-fns";
import { RootState } from "@/store/redux_store";
import { decodeToken } from "@/utils/jwtHelper";
import { getUserProfile } from "@/services/auth/user.api";
import {
  Package,
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
  Plus,
  Check,
  MapPin,
} from "lucide-react";
// import { getCurrentTax } from "@/services/tax/tax.api";
import Link from "next/link";
import { toast } from "sonner";
import {
  type UserAddress,
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  type CreateAddressRequest,
} from "@/services/auth/userAddress.api";
import { AddressSelector } from "@/components/ui/auth/address/address-selector";
import { validateDiscount, listAvailableDiscounts, type Discount } from "@/services/products/discount/discount.api";

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

export default function Checkout() {
  const dispatch = useDispatch<any>();
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
  
  // Address management state
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    Address: "",
    City: "",
    District: "",
    IsDefault: false,
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
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

        // Load user addresses
        const addressesResponse = await getUserAddresses();
        if (addressesResponse?.data && Array.isArray(addressesResponse.data)) {
          setUserAddresses(addressesResponse.data);
          
          // Auto-select default address if available
          const defaultAddress = addressesResponse.data.find(addr => addr.IsDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress._id);
            applyAddressToShipping(defaultAddress);
          }
        }
      } catch (error) {
        console.error("Error loading user info:", error);
      }
    };

    if (accessToken) {
      loadUserInfo();
    }
  }, [accessToken]);

  // Load available discounts for user
  useEffect(() => {
    const loadAvailableDiscounts = async () => {
      if (!accessToken) return;
      
      setLoadingDiscounts(true);
      try {
        const response = await listAvailableDiscounts(1, 50);
        if (response.status === "success" && response.data) {
          setAvailableDiscounts(response.data);
        }
      } catch (error) {
        console.error("Error loading available discounts:", error);
      } finally {
        setLoadingDiscounts(false);
      }
    };

    if (accessToken && cartItems.length > 0) {
      loadAvailableDiscounts();
    }
  }, [accessToken, cartItems.length]);

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


  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = userAddresses.find(addr => addr._id === addressId);
    if (address) {
      applyAddressToShipping(address);
    }
    setIsEditingAddress(false);
    setEditingAddressId(null);
  };

  // Handle create new address
  const handleCreateAddress = async () => {
    if (!newAddress.Address || !newAddress.City || !newAddress.District) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }

    // Địa chỉ mới luôn được set làm mặc định (backend sẽ tự động xử lý)
    // Không cần truyền IsDefault vì backend sẽ luôn set = true

    setAddressLoading(true);
    try {
      // Backend sẽ tự động set địa chỉ mới làm mặc định
      const response = await createUserAddress(newAddress);
      if (response?.data) {
        // Reload all addresses to ensure sync with backend (especially for default addresses)
        const addressesResponse = await getUserAddresses();
        if (addressesResponse?.data && Array.isArray(addressesResponse.data)) {
          setUserAddresses(addressesResponse.data);
          
          // Select the newly created address
          const newAddressData = addressesResponse.data.find(addr => addr._id === (response.data as UserAddress)._id);
          if (newAddressData) {
            setSelectedAddressId(newAddressData._id);
            applyAddressToShipping(newAddressData);
          }
        } else {
          // Fallback: use the response data
          const updatedAddresses = [...userAddresses, response.data as UserAddress];
          setUserAddresses(updatedAddresses);
          setSelectedAddressId(response.data._id);
          applyAddressToShipping(response.data as UserAddress);
        }
        
        setNewAddress({ Address: "", City: "", District: "", IsDefault: false });
        setIsEditingAddress(false);
        toast.success("Tạo địa chỉ thành công");
      } else {
        toast.error(response?.message || "Có lỗi xảy ra khi tạo địa chỉ");
      }
    } catch (error) {
      console.error("Error creating address:", error);
      toast.error("Có lỗi xảy ra khi tạo địa chỉ");
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle update address
  const handleUpdateAddress = async (addressId: string) => {
    const address = userAddresses.find(addr => addr._id === addressId);
    if (!address) return;

    // Check if trying to unset default and this is the only default address
    const defaultAddresses = userAddresses.filter(addr => addr.IsDefault && addr._id !== addressId);
    if (address.IsDefault && !newAddress.IsDefault && defaultAddresses.length === 0) {
      toast.error("Phải có ít nhất một địa chỉ mặc định. Vui lòng chọn một địa chỉ khác làm mặc định trước.");
      return;
    }

    setAddressLoading(true);
    try {
      const updateData = {
        Address: newAddress.Address || address.Address,
        City: newAddress.City || address.City,
        District: newAddress.District || address.District,
        IsDefault: newAddress.IsDefault,
      };

      const response = await updateUserAddress(addressId, updateData);
      if (response?.data) {
        // Reload all addresses to ensure sync with backend (especially when default changes)
        const addressesResponse = await getUserAddresses();
        if (addressesResponse?.data && Array.isArray(addressesResponse.data)) {
          setUserAddresses(addressesResponse.data);
          
          // Select the updated address if it was selected before
          const updatedAddress = addressesResponse.data.find(addr => addr._id === addressId);
          if (selectedAddressId === addressId && updatedAddress) {
            applyAddressToShipping(updatedAddress);
          }
          
          // If we set a new default, select it
          if (updateData.IsDefault) {
            const newDefault = addressesResponse.data.find(addr => addr.IsDefault);
            if (newDefault) {
              setSelectedAddressId(newDefault._id);
              applyAddressToShipping(newDefault);
            }
          }
        } else {
          // Fallback: use the response data
          const updatedAddresses = userAddresses.map(addr =>
            addr._id === addressId ? (response.data as UserAddress) : 
            updateData.IsDefault ? { ...addr, IsDefault: false } : addr
          );
          setUserAddresses(updatedAddresses);
          if (selectedAddressId === addressId) {
            applyAddressToShipping(response.data as UserAddress);
          }
        }
        
        setNewAddress({ Address: "", City: "", District: "", IsDefault: false });
        setIsEditingAddress(false);
        setEditingAddressId(null);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        toast.error(response?.message || "Có lỗi xảy ra khi cập nhật địa chỉ");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Có lỗi xảy ra khi cập nhật địa chỉ");
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = (addressId: string) => {
    const address = userAddresses.find(addr => addr._id === addressId);
    if (!address) return;

    
    const otherAddresses = userAddresses.filter(addr => addr._id !== addressId);
    if (address.IsDefault && otherAddresses.length > 0) {
      toast.error("Không thể xóa địa chỉ mặc định. Vui lòng chọn một địa chỉ khác làm mặc định trước khi xóa.");
      return;
    }

    setConfirmPopup({
      isOpen: true,
      title: "Xác nhận xóa địa chỉ",
      message: "Bạn có chắc chắn muốn xóa địa chỉ này?",
      onConfirm: async () => {
        setAddressLoading(true);
        try {
          const response = await deleteUserAddress(addressId);
          if (response?.code === 200 || response?.code === 201) {
            toast.success("Xóa địa chỉ thành công");
            const updatedAddresses = userAddresses.filter(addr => addr._id !== addressId);
            setUserAddresses(updatedAddresses);
            
            // If we deleted the default and there are other addresses, set the first one as default
            if (address.IsDefault && updatedAddresses.length > 0) {
              try {
                await updateUserAddress(updatedAddresses[0]._id, {
                  IsDefault: true,
                });
                // Reload addresses to get updated default
                const addressesResponse = await getUserAddresses();
                if (addressesResponse?.data && Array.isArray(addressesResponse.data)) {
                  setUserAddresses(addressesResponse.data);
                  const defaultAddr = addressesResponse.data.find(addr => addr.IsDefault);
                  if (defaultAddr) {
                    setSelectedAddressId(defaultAddr._id);
                    applyAddressToShipping(defaultAddr);
                  }
                }
              } catch (error) {
                console.error("Error setting new default:", error);
              }
            }
            
            if (selectedAddressId === addressId) {
              // Select another address or clear
              if (updatedAddresses.length > 0) {
                const defaultAddr = updatedAddresses.find(addr => addr.IsDefault) || updatedAddresses[0];
                handleAddressSelect(defaultAddr._id);
              } else {
                setSelectedAddressId(null);
                setShipping(prev => ({
                  ...prev,
                  street: "",
                  ward: "",
                  province: "",
                }));
              }
            }
          } else {
            toast.error(response?.message || "Có lỗi xảy ra khi xóa địa chỉ");
          }
        } catch (error) {
          console.error("Error deleting address:", error);
          toast.error("Có lỗi xảy ra khi xóa địa chỉ");
        } finally {
          setAddressLoading(false);
        }
      },
    });
  };

  // Start editing address
  const startEditingAddress = (addressId: string) => {
    const address = userAddresses.find(addr => addr._id === addressId);
    if (address) {
      setEditingAddressId(addressId);
      setNewAddress({
        Address: address.Address,
        City: address.City,
        District: address.District,
        IsDefault: address.IsDefault,
      });
    }
  };


  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ lấy vị trí");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log("Getting location for:", latitude, longitude);
          
          // Use Nominatim (OpenStreetMap) for reverse geocoding (free, no API key needed)
          // Add language=vi for Vietnamese results
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`,
            {
              method: 'GET',
              headers: {
                'User-Agent': 'RetroTrade/1.0', // Required by Nominatim
                'Accept': 'application/json',
              }
            }
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Reverse geocoding response:", data);
          
          if (data && data.address) {
            const addr = data.address;
            
           
            const street = addr.road || addr.street || addr.pedestrian || "";
            const houseNumber = addr.house_number || "";
            const fullStreet = houseNumber && street ? `${houseNumber} ${street}`.trim() : (street || houseNumber);
            
    
            const ward = addr.ward || addr.suburb || addr.neighbourhood || "";
            const district = addr.district || addr.county || addr.city_district || "";
            const city = addr.city || addr.town || addr.municipality || "";
            const province = addr.state || addr.province || "";
            
            // Build full address
            const finalWard = ward || district || "";
            const finalCity = city || province || "";
            
            // Update shipping address form
            setShipping(prev => ({
              ...prev,
              street: fullStreet || prev.street,
              ward: finalWard || prev.ward,
              province: finalCity || prev.province,
            }));

            // Update new address form if editing
            if (isEditingAddress || editingAddressId) {
              setNewAddress(prev => ({
                ...prev,
                Address: fullStreet || prev.Address,
                District: finalWard || prev.District,
                City: finalCity || prev.City,
              }));
            }

            toast.success("Đã lấy địa chỉ hiện tại thành công!");
          } else {
            console.warn("No address data in response:", data);
            // Fallback: show display_name if available
            if (data.display_name) {
              setShipping(prev => ({
                ...prev,
                street: data.display_name.split(',')[0] || prev.street,
              }));
              toast.success("Đã lấy một phần địa chỉ. Vui lòng kiểm tra và chỉnh sửa thêm.");
            } else {
              throw new Error("Không thể lấy địa chỉ từ tọa độ");
            }
          }
        } catch (error) {
          console.error("Error getting address from coordinates:", error);
          const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi lấy địa chỉ";
          toast.error(`${errorMessage}. Vui lòng thử lại hoặc nhập thủ công.`);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = "Không thể lấy vị trí hiện tại.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Bạn cần cấp quyền truy cập vị trí để sử dụng tính năng này.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Thông tin vị trí không khả dụng.";
            break;
          case error.TIMEOUT:
            message = "Yêu cầu lấy vị trí hết thời gian chờ.";
            break;
        }
        toast.error(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };


  // Pagination calculations
  const totalPages = Math.ceil(cartItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = cartItems.slice(startIndex, endIndex);
 
  const rentalTotal = cartItems.reduce((sum, item) => {
    const days = calculateRentalDays(item);
    return sum + item.basePrice * item.quantity * days;
  }, 0);
  
  console.log("Render - rentalTotal:", rentalTotal, "cartItems:", cartItems.length);

  const taxAmount = (rentalTotal * taxRate) / 100;
  const depositTotal = cartItems.reduce(
    (sum, item) => sum + item.depositAmount * item.quantity,
    0
  );
  const totalDiscountAmount = publicDiscountAmount + privateDiscountAmount;
  const grandTotal = Math.max(0, rentalTotal + taxAmount + depositTotal - totalDiscountAmount);

  // Tính lại discount amount khi cartItems thay đổi (vì rentalTotal và depositTotal phụ thuộc vào cartItems)
  // Sử dụng useMemo để tính totalAmountForDiscount trước, sau đó useEffect sẽ sử dụng giá trị này
  const totalAmountForDiscountMemo = useMemo(() => {
    const rental = cartItems.reduce((sum, item) => {
      const days = calculateRentalDays(item);
      return sum + item.basePrice * item.quantity * days;
    }, 0);
    const deposit = cartItems.reduce((sum, item) => sum + item.depositAmount * item.quantity, 0);
    return rental + deposit;
  }, [cartItems]);

  useEffect(() => {
    const recalculateDiscounts = async () => {
      if (!accessToken || cartItems.length === 0 || totalAmountForDiscountMemo <= 0) return;

      console.log("Recalculating discounts - totalAmountForDiscountMemo:", totalAmountForDiscountMemo, "cartItems:", cartItems.length);

      // Tính lại public discount amount (dựa trên tổng tiền thuê + tiền cọc)
      if (publicDiscount) {
        try {
          const response = await validateDiscount({
            code: publicDiscount.code.toUpperCase(),
            baseAmount: totalAmountForDiscountMemo,
          });
          if (response.status === "success" && response.data) {
            const newAmount = response.data.amount || 0;
            setPublicDiscountAmount(newAmount);
            console.log("Recalculated public discount amount:", newAmount, "for totalAmount:", totalAmountForDiscountMemo, "discount:", publicDiscount);
          }
        } catch (e) {
          console.error("Error recalculating public discount:", e);
        }
      }

      // Tính lại private discount amount (dựa trên baseAmount sau khi trừ public discount)
      if (privateDiscount) {
        try {
          // Sử dụng publicDiscountAmount hiện tại từ state (sẽ được update nếu public discount được recalculate trước)
          const currentPublicAmount = publicDiscountAmount;
          const baseAmountAfterPublic = Math.max(0, totalAmountForDiscountMemo - currentPublicAmount);
          const response = await validateDiscount({
            code: privateDiscount.code.toUpperCase(),
            baseAmount: baseAmountAfterPublic,
          });
          if (response.status === "success" && response.data) {
            const newAmount = response.data.amount || 0;
            setPrivateDiscountAmount(newAmount);
            console.log("Recalculated private discount amount:", newAmount);
          }
        } catch (e) {
          console.error("Error recalculating private discount:", e);
        }
      }
    };

    if (publicDiscount || privateDiscount) {
      recalculateDiscounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmountForDiscountMemo, publicDiscount, privateDiscount, accessToken]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle discount code
  const handleApplyDiscount = async (code?: string) => {
    const codeToApply = code || discountCode.trim();
    if (!codeToApply) {
      setDiscountError("Vui lòng nhập mã giảm giá");
      return;
    }

    setDiscountLoading(true);
    setDiscountError(null);

    try {
      // Tính discount dựa trên tổng tiền (tiền thuê + tiền cọc)
      const baseAmountForDiscount = rentalTotal + depositTotal;
      const response = await validateDiscount({
        code: codeToApply.toUpperCase(),
        baseAmount: baseAmountForDiscount,
      });

      if (response.status === "success" && response.data) {
        const discount = response.data.discount;
        let amount = response.data.amount || 0;
        
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
        setDiscountError(response.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      setDiscountError("Có lỗi xảy ra khi áp dụng mã giảm giá");
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

    for (const item of cartItems) {
      console.log("Tạo đơn hàng:", item.title);

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
        failedItems.push(item.title);
        console.error(`Order failed for ${item.title}:`, result?.error);
        continue; // Continue processing other items instead of throwing
      }

      // Only remove from cart if order was successful
      if (!item._id?.startsWith("temp-")) {
        try {
          await dispatch(removeItemFromCartAction(item._id));
        } catch (cartError) {
          console.error(`Error removing item from cart: ${item.title}`, cartError);
          // Don't fail the entire process if cart removal fails
        }
      }

      successCount++;
    }

    // Show appropriate message based on results
    if (failedItems.length === 0) {
      toast.success("Tạo tất cả đơn hàng thành công!");
      sessionStorage.removeItem("checkoutItems");
      router.push("/auth/order");
    } else if (successCount > 0) {
      toast.warning(
        `Đã tạo thành công ${successCount} đơn hàng. ${failedItems.length} đơn hàng thất bại: ${failedItems.join(", ")}`
      );
      // Keep only failed items in sessionStorage for retry
      const remainingItems = cartItems.filter(
        (item) => failedItems.includes(item.title)
      );
      if (remainingItems.length > 0) {
        sessionStorage.setItem("checkoutItems", JSON.stringify(remainingItems));
      } else {
        sessionStorage.removeItem("checkoutItems");
      }
    } else {
      toast.error("Không thể tạo bất kỳ đơn hàng nào. Vui lòng thử lại.");
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
                                  className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                                    itemErrors[item._id]?.rentalStartDate
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
                                  className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                                    itemErrors[item._id]?.rentalEndDate
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

              {/* Address selector */}
                <div className="mt-6">
                <AddressSelector
                  selectedAddressId={selectedAddressId}
                  onSelect={(addr) => {
                    setSelectedAddressId(addr._id);
                    applyAddressToShipping(addr);
                  }}
                            />
                          </div>
                          

              {/* No Address Message */}
              {userAddresses.length === 0 && !isEditingAddress && !editingAddressId && (
                <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        Vui lòng nhập địa chỉ
                      </p>
                      <p className="text-xs text-amber-700 mb-3">
                        Bạn chưa có địa chỉ đã lưu. Vui lòng thêm địa chỉ mới hoặc nhập địa chỉ bên dưới.
                      </p>
                      <button
                        onClick={() => {
                          setIsEditingAddress(true);
                          setEditingAddressId(null);
                          setNewAddress({ Address: "", City: "", District: "", IsDefault: false });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm địa chỉ mới
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Address Form - After name and phone */}
              {(isEditingAddress || editingAddressId) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      {editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsEditingAddress(false);
                        setEditingAddressId(null);
                        setNewAddress({ Address: "", City: "", District: "", IsDefault: false });
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Đóng"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-700">
                          Địa chỉ (số nhà, đường...) <span className="text-red-500">*</span>
                        </label>
                        <button
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Lấy địa chỉ hiện tại từ vị trí GPS"
                        >
                          {locationLoading ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang lấy...</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Lấy địa chỉ hiện tại</span>
                            </>
                          )}
                        </button>
                      </div>
                <input
                        type="text"
                        placeholder="Nhập địa chỉ chi tiết"
                        value={newAddress.Address}
                        onChange={(e) => setNewAddress({ ...newAddress, Address: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Phường/Xã <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập phường/xã"
                          value={newAddress.District}
                          onChange={(e) => setNewAddress({ ...newAddress, District: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Tỉnh/Thành phố <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập tỉnh/thành phố"
                          value={newAddress.City}
                          onChange={(e) => setNewAddress({ ...newAddress, City: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                    </div>
                    {/* Chỉ hiển thị checkbox khi đang sửa địa chỉ, không hiển thị khi thêm mới */}
                    {editingAddressId && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const address = userAddresses.find(addr => addr._id === editingAddressId);
                          const defaultAddresses = userAddresses.filter(addr => addr.IsDefault && addr._id !== editingAddressId);
                          const isOnlyDefault = address?.IsDefault && defaultAddresses.length === 0;
                          const isDisabled = isOnlyDefault;
                          const isChecked = isOnlyDefault ? true : newAddress.IsDefault;
                          
                          return (
                            <>
                              <input
                                type="checkbox"
                                id="isDefault"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={(e) => {
                                  if (!isDisabled) {
                                    setNewAddress({ ...newAddress, IsDefault: e.target.checked });
                                  }
                                }}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <label htmlFor="isDefault" className="text-sm text-gray-700 cursor-pointer">
                                Đặt làm địa chỉ mặc định
                                {isOnlyDefault && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (bắt buộc - đây là địa chỉ mặc định duy nhất)
                                  </span>
                                )}
                              </label>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {!editingAddressId && (
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <Check className="w-4 h-4 text-emerald-600 mr-2" />
                          <span className="text-sm text-emerald-700 font-medium">
                            Địa chỉ mới sẽ tự động được đặt làm mặc định
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (editingAddressId) {
                            handleUpdateAddress(editingAddressId);
                          } else {
                            handleCreateAddress();
                          }
                        }}
                        disabled={addressLoading}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addressLoading ? "Đang xử lý..." : editingAddressId ? "Cập nhật" : "Thêm mới"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAddress(false);
                          setEditingAddressId(null);
                          setNewAddress({ Address: "", City: "", District: "", IsDefault: false });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              )}


             
              {!isEditingAddress && !editingAddressId && !selectedAddressId && (
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

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl p-8 sticky top-24 border-2 border-emerald-500/20">
              <h2 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span>Tóm tắt thanh toán</span>
              </h2>
              
              {/* Discount Code Section */}
              <div className="mb-4 bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 relative" style={{ zIndex: showDiscountList ? 50 : 1, overflow: showDiscountList ? 'visible' : 'visible' }}>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Mã giảm giá (Tối đa: 1 công khai + 1 riêng tư)
                </label>
                {(publicDiscount || privateDiscount) ? (
                  <div className="space-y-1.5">
                    {/* Public Discount */}
                    {publicDiscount && (
                      <div className="flex items-center justify-between p-2 bg-blue-500/20 rounded-lg border border-blue-300/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                            <span className="font-semibold text-white text-sm truncate">{publicDiscount.code}</span>
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Công khai</span>
                          </div>
                          <p className="text-[10px] text-blue-100 mt-0.5">
                            {publicDiscount.type === "percent" 
                              ? `Giảm ${publicDiscount.value}%` 
                              : `Giảm ${publicDiscount.value.toLocaleString("vi-VN")}₫`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemovePublicDiscount}
                          className="p-0.5 text-white hover:text-red-200 transition-colors flex-shrink-0"
                          title="Xóa mã giảm giá công khai"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {/* Private Discount */}
                    {privateDiscount && (
                      <div className="flex items-center justify-between p-2 bg-purple-500/20 rounded-lg border border-purple-300/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />
                            <span className="font-semibold text-white text-sm truncate">{privateDiscount.code}</span>
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded">Riêng tư</span>
                          </div>
                          <p className="text-[10px] text-purple-100 mt-0.5">
                            {privateDiscount.type === "percent" 
                              ? `Giảm ${privateDiscount.value}%` 
                              : `Giảm ${privateDiscount.value.toLocaleString("vi-VN")}₫`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemovePrivateDiscount}
                          className="p-0.5 text-white hover:text-red-200 transition-colors flex-shrink-0"
                          title="Xóa mã giảm giá riêng tư"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {/* Input field - hiển thị nếu chưa có đủ 2 mã */}
                    {(!publicDiscount || !privateDiscount) && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <div className="flex-1 relative discount-input-container min-w-0" style={{ zIndex: showDiscountList ? 100 : 1 }}>
                            <input
                              type="text"
                              placeholder={publicDiscount ? "Nhập mã riêng tư" : privateDiscount ? "Nhập mã công khai" : "Nhập mã giảm giá"}
                              value={discountCode}
                              onChange={(e) => {
                                setDiscountCode(e.target.value.toUpperCase());
                                setDiscountError(null);
                              }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleApplyDiscount();
                                }
                              }}
                              onFocus={() => setShowDiscountList(true)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white/20 border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50"
                            />
                            {/* Available Discounts Dropdown */}
                            {showDiscountList && availableDiscounts.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-[10000] w-full mt-1 bg-white rounded-lg shadow-2xl border-2 border-emerald-200 max-h-48 overflow-y-auto" style={{ zIndex: 10000, position: 'absolute' }}>
                                <div className="p-1.5 border-b border-gray-200">
                                  <p className="text-[10px] font-semibold text-gray-600">Mã giảm giá có sẵn</p>
                                </div>
                                {loadingDiscounts ? (
                                  <div className="p-3 text-center text-gray-500 text-xs">Đang tải...</div>
                                ) : (
                                  <div className="divide-y divide-gray-100">
                                    {availableDiscounts.map((discount) => (
                                      <button
                                        key={discount._id}
                                        onClick={() => handleSelectDiscount(discount)}
                                        className="w-full p-2 text-left hover:bg-emerald-50 transition-colors"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-semibold text-emerald-600 text-xs">{discount.code}</span>
                                              {discount.type === "percent" ? (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                                  -{discount.value}%
                                                </span>
                                              ) : (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                                  -{discount.value.toLocaleString("vi-VN")}₫
                                                </span>
                                              )}
                                              {discount.isPublic && discount.isClaimed && (
                                                <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded">
                                                  Đã lấy
                                                </span>
                                              )}
                                              {discount.isPublic && !discount.isClaimed && (
                                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                                  Công khai
                                                </span>
                                              )}
                                            </div>
                                            {discount.minOrderAmount && (
                                              <p className="text-[10px] text-gray-500 mt-0.5">
                                                Đơn tối thiểu: {discount.minOrderAmount.toLocaleString("vi-VN")}₫
                                              </p>
                                            )}
                                          </div>
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                        </div>
                                      </button>
                                    ))}
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
                              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Áp dụng"
                            )}
                          </button>
                        </div>
                        {availableDiscounts.length > 0 && (
                          <button
                            onClick={() => setShowDiscountList(!showDiscountList)}
                            className="text-[10px] text-white/80 hover:text-white transition-colors underline"
                          >
                            {showDiscountList ? "Ẩn" : "Xem"} mã giảm giá có sẵn ({availableDiscounts.length})
                          </button>
                        )}
                        {discountError && (
                          <p className="text-[10px] text-red-200">{discountError}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <div className="flex-1 relative discount-input-container min-w-0" style={{ zIndex: showDiscountList ? 100 : 1 }}>
                        <input
                          type="text"
                          placeholder="Nhập mã giảm giá"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value.toUpperCase());
                            setDiscountError(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleApplyDiscount();
                            }
                          }}
                          onFocus={() => setShowDiscountList(true)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white/20 border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50"
                        />
                        {/* Available Discounts Dropdown */}
                        {showDiscountList && availableDiscounts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-[10000] w-full mt-1 bg-white rounded-lg shadow-2xl border-2 border-emerald-200 max-h-48 overflow-y-auto" style={{ zIndex: 10000, position: 'absolute' }}>
                            <div className="p-1.5 border-b border-gray-200">
                              <p className="text-[10px] font-semibold text-gray-600">Mã giảm giá có sẵn</p>
                            </div>
                            {loadingDiscounts ? (
                              <div className="p-3 text-center text-gray-500 text-xs">Đang tải...</div>
                            ) : (
                              <div className="divide-y divide-gray-100">
                                {availableDiscounts.map((discount) => (
                                  <button
                                    key={discount._id}
                                    onClick={() => handleSelectDiscount(discount)}
                                    className="w-full p-2 text-left hover:bg-emerald-50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-emerald-600 text-xs">{discount.code}</span>
                                          {discount.type === "percent" ? (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                              -{discount.value}%
                                            </span>
                                          ) : (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                              -{discount.value.toLocaleString("vi-VN")}₫
                                            </span>
                                          )}
                                          {discount.isPublic && discount.isClaimed && (
                                            <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded">
                                              Đã lấy
                                            </span>
                                          )}
                                          {discount.isPublic && !discount.isClaimed && (
                                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                              Công khai
                                            </span>
                                          )}
                                        </div>
                                        {discount.minOrderAmount && (
                                          <p className="text-[10px] text-gray-500 mt-0.5">
                                            Đơn tối thiểu: {discount.minOrderAmount.toLocaleString("vi-VN")}₫
                                          </p>
                                        )}
                                      </div>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    </div>
                                  </button>
                                ))}
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
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Áp dụng"
                        )}
                      </button>
                    </div>
                    {availableDiscounts.length > 0 && (
                      <button
                        onClick={() => setShowDiscountList(!showDiscountList)}
                        className="text-[10px] text-white/80 hover:text-white transition-colors underline"
                      >
                        {showDiscountList ? "Ẩn" : "Xem"} mã giảm giá có sẵn ({availableDiscounts.length})
                      </button>
                    )}
                    {discountError && (
                      <p className="text-[10px] text-red-200">{discountError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 text-base bg-white/10 rounded-xl p-4 backdrop-blur-sm relative" style={{ zIndex: 1 }}>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-emerald-50">Tiền thuê</span>
                  <span className="font-semibold text-white">
                    {rentalTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
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
                {publicDiscount && publicDiscountAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-blue-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Giảm giá công khai ({publicDiscount.code})
                    </span>
                    <span className="font-semibold text-blue-100">
                      -{publicDiscountAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                )}
                {privateDiscount && privateDiscountAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-purple-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Giảm giá riêng tư ({privateDiscount.code})
                    </span>
                    <span className="font-semibold text-purple-100">
                      -{privateDiscountAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                )}
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-green-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Tổng giảm giá
                    </span>
                    <span className="font-semibold text-green-100">
                      -{totalDiscountAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                )}
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

      {/* Confirm Popup removed – handled inside AddressSelector */}
    </div>
  );
}
