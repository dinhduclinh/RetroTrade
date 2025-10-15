"use client"

import React, { useEffect, useState } from "react"
import { Bell, Search, User, LogOut, Settings, Activity, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/redux_store'
import { logout } from '@/store/auth/authReducer'
import { jwtDecode } from 'jwt-decode'
import { toast } from "sonner"
import { useRouter } from "next/router"

interface DecodedToken {
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  role?: string;
  fullName?: string;
  exp: number;
  iat: number;
}

export function ModeratorHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications] = useState(3); // Mock notification count
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

  const handleGoToHome = () => {
    router.push('/home');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 lg:px-8 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left side - Title and breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-white">Dashboard Moderator</h1>
            <p className="text-white/70 text-sm">Quản lý và kiểm duyệt nội dung</p>
          </div>
          <div className="lg:hidden">
            <h1 className="text-lg font-bold text-white">Moderator</h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm người dùng, nội dung..."
              className="pl-10 pr-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-3">
          {/* Activity indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/70">Online</span>
          </div>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-white hover:bg-white/10 transition-all duration-200 hover:scale-105"
          >
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* User menu */}
          {isLoggedIn && userInfo ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:scale-105 transition-all duration-200"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-white/20 hover:ring-white/40 transition-all duration-200">
                    <AvatarImage src={userInfo.avatarUrl ?? ""} alt={userInfo.email} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold">
                      {(userInfo.fullName?.charAt(0).toUpperCase() || userInfo.email?.charAt(0).toUpperCase()) ?? ""}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex flex-col space-y-2 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userInfo.avatarUrl ?? ""} alt={userInfo.email} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        {(userInfo.fullName?.charAt(0).toUpperCase() || userInfo.email?.charAt(0).toUpperCase()) ?? ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {(userInfo.fullName || userInfo.email) ?? ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {userInfo.role ?? 'moderator'}
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={handleGoToHome}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Trang chủ</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={handleGoToProfile}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Thông tin cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium hidden sm:block">Moderator</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}