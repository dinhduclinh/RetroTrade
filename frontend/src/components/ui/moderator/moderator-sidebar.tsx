"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  Package,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/common/button";

interface ModeratorSidebarProps {
  activeTab:
    | "dashboard"
    | "requests"
    | "verification"
    | "blog"
    | "productManagement";
  activeProductTab?: "products" | "categories" | "highlights";
  activeBlogTab: "posts" | "categories" | "comments" | "tags";
  onTabChange: (
    tab:
      | "dashboard"
      | "requests"
      | "verification"
      | "blog"
      | "productManagement"
  ) => void;
  onProductTabChange: (tab: "products" | "categories" | "highlights") => void;
  onBlogTabChange: (tab: "posts" | "categories" | "comments" | "tags") => void;
}

export function ModeratorSidebar({
  activeTab,
  activeProductTab,
  activeBlogTab,
  onTabChange,
  onProductTabChange,
  onBlogTabChange,
}: ModeratorSidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "dashboard",
    },
    {
      id: "requests",
      label: "Yêu cầu",
      icon: FileText,
      path: "requests",
    },
    {
      id: "verification",
      label: "Xác minh",
      icon: Shield,
      path: "verification",
    },
    {
      id: "blog",
      label: "Blog",
      icon: FileText,
      path: "blog",
    },
    {
      id: "productManagement",
      label: "Sản phẩm",
      icon: Package,
      path: "productManagement",
    },
  ];

  const blogSubItems = [
    { id: "posts", label: "Bài viết", path: "posts" },
    { id: "categories", label: "Danh mục", path: "categories" },
    { id: "comments", label: "Bình luận", path: "comments" },
    { id: "tags", label: "Thẻ", path: "tags" },
  ];

  const productSubItems = [
    { id: "products", label: "Sản phẩm chờ duyệt", path: "products" },
    { id: "categories", label: "Danh mục", path: "categories" },
    { id: "highlights", label: "Top sản phẩm nổi bật", path: "highlights" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white/10 backdrop-blur-md border-r border-white/20 p-6 z-20 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Moderator</h2>
            <p className="text-sm text-white/70">Control Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasSubItems =
              item.id === "blog" || item.id === "productManagement";

            return (
              <div key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>

                {/* Sub items for blog */}
                {item.id === "blog" && isActive && (
                  <div className="ml-6 mt-2 space-y-1">
                    {blogSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => onBlogTabChange(subItem.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                          activeBlogTab === subItem.id
                            ? "bg-white/20 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <span className="text-sm">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub items for product management */}
                {item.id === "productManagement" && isActive && (
                  <div className="ml-6 mt-2 space-y-1">
                    {productSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => onProductTabChange(subItem.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                          activeProductTab === subItem.id
                            ? "bg-white/20 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <span className="text-sm">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="flex items-center gap-3 px-4 py-2 text-white/70 text-sm">
            <Settings className="w-4 h-4" />
            <span>Vai trò: Moderator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
