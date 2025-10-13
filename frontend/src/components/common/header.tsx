"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, User, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/redux_store';
import { logout } from '@/store/auth/authReducer';
import { jwtDecode } from 'jwt-decode';
import { toast } from "sonner";
import Image from "next/image";

interface DecodedToken {
  email: string;
  userGuid?: string;
  role?: string;
  exp: number;
  iat: number;
}

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const { accessToken } = useSelector((state: RootState) => state.auth);

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
  }, [decodedUser, dispatch]);

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
    router.push('/orders');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
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
            <span className="text-xl font-bold text-gray-900">Retro Trade</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/home"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Product
            </Link>
            <Link
              href="/blog"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              About & Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Shopping Cart */}
            <Button
              onClick={() => router.push("/cart")}
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
              {/* Badge count sẽ được thêm sau khi có cart system */}
            </Button>

            {isLoggedIn && userInfo ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={userInfo.email} />
                      <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        {userInfo.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {userInfo.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userInfo.role || "user"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
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
                  className="text-gray-700 hover:text-indigo-600 transition-colors"
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
