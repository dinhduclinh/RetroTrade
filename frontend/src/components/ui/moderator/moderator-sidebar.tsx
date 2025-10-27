"use client";

import {
  Users,
  FileText,
  Shield,
  LogOut,
  BookOpen,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/common/button";
import { useState } from "react";

interface ModeratorSidebarProps {
  activeTab:
    | "dashboard"
    | "users"
    | "requests"
    | "verification"
    | "productManagement"
    | "blog";
  activeProductTab?: "products" | "categories";
  activeBlogTab?: "posts" | "categories" | "comments" | "tags";
  onTabChange?: (
    tab:
      | "dashboard"
      | "users"
      | "requests"
      | "verification"
      | "productManagement"
      | "blog"
  ) => void;
  onProductTabChange?: (tab: "products" | "categories") => void;
  onBlogTabChange?: (tab: "posts" | "categories" | "comments" | "tags") => void;
}

export function ModeratorSidebar({
  activeTab,
  activeProductTab,
  activeBlogTab,
  onTabChange,
  onProductTabChange,
  onBlogTabChange,
}: ModeratorSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/moderator/dashboard",
      description: "Tổng quan hệ thống",
    },
    {
      id: "requests" as const,
      label: "Yêu cầu kiểm duyệt",
      icon: FileText,
      path: "/moderator/request-management",
      description: "Duyệt và phê duyệt nội dung",
    },
    {
      id: "verification" as const,
      label: "Xác thực tài khoản",
      icon: Shield,
      path: "/moderator/verify-management",
      description: "Xác thực danh tính người dùng",
    },
    {
      id: "productManagement" as const,
      label: "Quản lý sản phẩm",
      icon: Package,
      description: "Quản lý sản phẩm và danh mục",
      hasSubmenu: true,
    },
    {
      id: "blog" as const,
      label: "Quản lý Blog",
      icon: BookOpen,
      description: "Quản lý bài viết và nội dung",
      hasSubmenu: true,
    },
  ];

  const productSubmenuItems: {
    id: "products" | "categories";
    label: string;
    description: string;
  }[] = [
    {
      id: "products",
      label: "Quản lý sản phẩm",
      description: "Duyệt và phê duyệt sản phẩm",
    },
    {
      id: "categories",
      label: "Quản lý danh mục",
      description: "Quản lý danh mục sản phẩm",
    },
  ];

  const blogSubmenuItems: {
    id: "posts" | "categories" | "comments" | "tags";
    label: string;
    description: string;
  }[] = [
    {
      id: "posts",
      label: "Quản lý bài viết",
      description: "Tạo, sửa, xóa bài viết",
    },
    {
      id: "categories",
      label: "Quản lý danh mục",
      description: "Quản lý các danh mục bài viết",
    },
    {
      id: "comments",
      label: "Quản lý bình luận",
      description: "Kiểm duyệt bình luận",
    },
    {
      id: "tags",
      label: "Quản lý thẻ",
      description: "Kiểm duyệt thẻ",
    },
  ];

  const handleTabChange = (
    tab:
      | "dashboard"
      | "users"
      | "requests"
      | "verification"
      | "productManagement"
      | "blog"
  ) => {
    if (onTabChange) {
      onTabChange(tab);
    }

    if (tab !== "blog") setIsBlogDropdownOpen(false);
    if (tab !== "productManagement") setIsProductDropdownOpen(false);

    setIsMobileMenuOpen(false);
  };

  const handleProductTabChange = (tab: "products" | "categories") => {
    if (onProductTabChange) onProductTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const handleBlogTabChange = (
    tab: "posts" | "categories" | "comments" | "tags"
  ) => {
    if (onBlogTabChange) onBlogTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const renderSubmenu = (
    item: (typeof menuItems)[number],
    submenuItems: typeof productSubmenuItems | typeof blogSubmenuItems,
    isDropdownOpen: boolean,
    dropdownKey: "product" | "blog",
    activeSubTab?: string,
    onSubTabChange?: (tab: any) => void
  ) => {
    if (!item.hasSubmenu || !isDropdownOpen) return null;

    const activeTabKey =
      dropdownKey === "product" ? activeProductTab : activeBlogTab;

    return (
      <div className="ml-8 mt-2 space-y-2 animate-slide-in-left">
        {submenuItems.map((subItem) => {
          const isSubActive =
            activeTab === item.id && activeTabKey === subItem.id;
          return (
            <Button
              key={subItem.id}
              variant="ghost"
              className={`w-full justify-start h-12 px-4 text-sm transition-all duration-200 ${
                isSubActive
                  ? "bg-white/15 text-white border border-white/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => onSubTabChange?.(subItem.id)}
            >
              <div className="text-left">
                <div className="font-medium">{subItem.label}</div>
                <div className="text-xs opacity-70">{subItem.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      <div
        className={`fixed left-0 top-0 h-full w-72 bg-white/10 backdrop-blur-md border-r border-white/20 z-20
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Moderator</h2>
              <p className="text-sm text-white/70">Control Panel</p>
            </div>
          </div>

          <nav className="space-y-3 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              const isProduct = item.id === "productManagement";
              const isBlog = item.id === "blog";

              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-14 px-4 group transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white border border-white/30 shadow-lg scale-105"
                        : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-105"
                    }`}
                    onClick={() => {
                      if (item.hasSubmenu) {
                        if (isProduct)
                          setIsProductDropdownOpen(!isProductDropdownOpen);
                        if (isBlog) setIsBlogDropdownOpen(!isBlogDropdownOpen);
                        handleTabChange(item.id);
                      } else {
                        handleTabChange(item.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-white/20"
                            : "bg-white/5 group-hover:bg-white/15"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-70">
                          {item.description}
                        </div>
                      </div>
                      {item.hasSubmenu && (
                        <div className="ml-auto">
                          {(
                            isProduct
                              ? isProductDropdownOpen
                              : isBlogDropdownOpen
                          ) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </Button>

                  {isProduct &&
                    renderSubmenu(
                      item,
                      productSubmenuItems,
                      isProductDropdownOpen,
                      "product",
                      activeProductTab,
                      handleProductTabChange
                    )}

                  {isBlog &&
                    renderSubmenu(
                      item,
                      blogSubmenuItems,
                      isBlogDropdownOpen,
                      "blog",
                      activeBlogTab,
                      handleBlogTabChange
                    )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto"></div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
