"use client";

import React, { useEffect, useState } from "react";
import { User, LogOut, Settings, Home, Package, Menu } from "lucide-react";
import { Button } from "@/components/ui/common/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/common/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/common/avatar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { logout } from "@/store/auth/authReducer";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DecodedToken {
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  role?: string;
  fullName?: string;
  exp?: number;
  iat: number;
}

interface OwnerHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function OwnerHeader({ onToggleSidebar, isSidebarOpen = true }: OwnerHeaderProps) {
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const { accessToken } = useSelector((state: RootState) => state.auth);

  // Decode JWT token để lấy thông tin user
  const decodedUser = React.useMemo(() => {
    if (typeof accessToken === "string" && accessToken.trim()) {
      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        return decoded;
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }
    return null;
  }, [accessToken]);

  useEffect(() => {
    if (decodedUser) {
      // Kiểm tra token có hết hạn không
      const currentTime = Date.now() / 1000;
      if (decodedUser.exp && decodedUser.exp > currentTime) {
        setUserInfo(decodedUser);
      } else {
        // Token hết hạn
        dispatch(logout());
        setUserInfo(null);
        toast.error("Phiên đăng nhập đã hết hạn");
      }
    } else {
      setUserInfo(null);
    }
  }, [decodedUser, dispatch]);

  const handleLogout = () => {
    setUserInfo(null);
    dispatch(logout());
    toast.success("Đăng xuất thành công");
    router.push("/home");
  };

  const handleGoToProfile = () => {
    router.push("/auth/profile");
  };

  const handleGoToHome = () => {
    router.push("/home");
  };

  return (
    <header
      className={`bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-[100] h-16 transition-all duration-300 ${
        isSidebarOpen ? "ml-64" : "ml-0"
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Branding */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">Bảng quản lý</span>
              <span className="text-xs text-gray-500">Quản lý sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          {userInfo ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-gray-100"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userInfo.avatarUrl} alt={userInfo.fullName || "Owner"} />
                    <AvatarFallback className="bg-indigo-500 text-white text-sm">
                      {userInfo.fullName
                        ? userInfo.fullName.charAt(0).toUpperCase()
                        : userInfo.email?.charAt(0).toUpperCase() || "O"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900 hidden sm:block">
                    {userInfo.fullName || userInfo.email || "Owner"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={handleGoToHome}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Trang chủ</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={handleGoToProfile}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Thông tin cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-900 font-medium hidden sm:block">Owner</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default OwnerHeader;
