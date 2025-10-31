"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/common/button";
import { LogOut, User, Package, Settings, Shield, Crown, Moon, Sun, Wallet ,BoxIcon, Bookmark} from "lucide-react";
import { NotificationIcon } from "@/components/ui/common/notification-icon";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/common/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/common/avatar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/redux_store';
import { logout, toggleDarkMode } from '@/store/auth/authReducer';
import { fetchCartItemCount } from '@/store/cart/cartActions';
import { jwtDecode } from 'jwt-decode';
import { toast } from "sonner";
import Image from "next/image";

interface DecodedToken {
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  role?: string;
  fullName?: string;
  exp: number;
  iat: number;
}

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { accessToken, isDarkMode } = useSelector((state: RootState) => state.auth);
  const { count: cartCount } = useSelector((state: RootState) => state.cart);

  // Decode JWT token để lấy thông tin user
  const decodedUser = React.useMemo(() => {
    if (typeof accessToken === 'string' && accessToken.trim()) {
      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        return decoded;
      } catch (error) {
        console.error('Invalid token:', error);
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
        setIsLoggedIn(true);
        setUserInfo(decodedUser);

        // Fetch cart count when user is logged in
        dispatch(fetchCartItemCount());

        // Chuyển hướng dựa trên role
        const currentPath = router.pathname;

        // Redirect logic dựa trên role
        if (currentPath === '/') {
          router.push('/home');
        }
      } else {
        // Token hết hạn
        dispatch(logout());
        setIsLoggedIn(false);
        setUserInfo(null);
        toast.error("Phiên đăng nhập đã hết hạn");
      }
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  }, [decodedUser, dispatch, router]);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    dispatch(logout());
    toast.success("Đăng xuất thành công");
    router.push('/');
  };

  const handleGoToProfile = () => {
    router.push('/auth/profile');
  };

  const handleGoToOrders = () => {
    router.push('/order');
  };

  const handleGoToAdminPanel = () => {
    router.push('/admin');
  };

  const handleGoToModeratorPanel = () => {
    router.push('/moderator');
  };

  const handleGoToOwnerPanel = () => {
    router.push('/owner/myproducts');
  };

    const handleGoToMyfavirite = () => {
      router.push("/products/myfavorite");
    };

  // Render menu items dựa trên role
  const renderRoleSpecificMenuItems = () => {
    if (!userInfo?.role) return null;

    const role = userInfo.role;
    const items = [];

    switch (role) {
      case "admin":
        items.push(
          <DropdownMenuItem
            key="admin-panel"
            className="cursor-pointer"
            onClick={handleGoToAdminPanel}
          >
            <Crown className="mr-2 h-4 w-4" />
            <span>Bảng điều khiển Admin</span>
          </DropdownMenuItem>
        );
        break;
      case "moderator":
        items.push(
          <DropdownMenuItem
            key="moderator-panel"
            className="cursor-pointer"
            onClick={handleGoToModeratorPanel}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Bảng điều khiển Điều hành viên</span>
          </DropdownMenuItem>
        );
        break;
      case "owner":
        items.push(
          <DropdownMenuItem
            key="owner-panel"
            className="cursor-pointer"
            onClick={handleGoToOwnerPanel}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Sản phẩm của tôi</span>
          </DropdownMenuItem>
        );

        items.push(
          <DropdownMenuItem
            key="renter-requests"
            className="cursor-pointer"
            onClick={() => router.push("/owner/renter-requests")}
          >
            <BoxIcon className="mr-2 h-4 w-4" />
            <span>Yêu cầu thuê hàng</span>
          </DropdownMenuItem>
        );
        break;
    }

    return items;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/retrologo.png"
              alt="Retro Trade Logo"
              width={60}
              height={60}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Retro Trade</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/home"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/products"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Sản phẩm
            </Link>
            <Link
              href="/blog"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Giới thiệu & Liên hệ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Giỏ hàng - chỉ hiển thị khi đã đăng nhập */}
            {isLoggedIn && (
              <>
                <Button
                  onClick={() => router.push("/auth/cartitem")}
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <Image
                    src="/market.png"
                    alt="Retro Trade Logo"
                    width={25}
                    height={25}
                    className="rounded-lg"
                  />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
                <NotificationIcon />
              </>
            )}

            {isLoggedIn && userInfo ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userInfo.avatarUrl ?? ""} alt={userInfo.email} />
                      <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        {userInfo.email?.charAt(0).toUpperCase() ?? ""}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {userInfo.email ?? ""}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userInfo.role === 'renter' ? 'Người thuê' :
                        userInfo.role === 'owner' ? 'Chủ sở hữu' :
                          userInfo.role === 'admin' ? 'Quản trị viên' :
                            userInfo.role === 'moderator' ? 'Điều hành viên' : 'Người dùng'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Dark Mode Toggle */}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleToggleDarkMode}
                  >
                    {isDarkMode ? (
                      <Sun className="mr-2 h-4 w-4 text-yellow-500" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4 text-gray-600" />
                    )}
                    <span>{isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                  </DropdownMenuItem>


                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleGoToProfile}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Thông tin cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleGoToOrders}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <span>Đơn hàng của tôi</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleGoToMyfavirite}
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Danh sách yêu thích</span>
                  </DropdownMenuItem>

                  {(userInfo?.role === 'renter' || userInfo?.role === 'owner') && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/wallet')}>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Ví của tôi</span>
                    </DropdownMenuItem>
                  )}



                  {/* Render role-specific menu items */}
                  {renderRoleSpecificMenuItems()}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link
                    href="/auth/register"
                    className="text-white hover:text-white"
                  >
                    Đăng ký
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
