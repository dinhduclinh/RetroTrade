"use client"

import { Users, FileText, Shield, LogOut, BookOpen, Menu, X, ChevronDown, ChevronRight, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/router"
import { useState } from "react"

interface ModeratorSidebarProps {
  activeTab: "dashboard" | "users" | "requests" | "verification" | "blog"
  activeBlogTab?: "posts" | "categories" | "comments" | "tags"
  onTabChange?: (tab: "dashboard" | "users" | "requests" | "verification" | "blog") => void
  onBlogTabChange?: (tab: "posts" | "categories" | "comments" | "tags") => void
}

export function ModeratorSidebar({ activeTab, activeBlogTab, onTabChange, onBlogTabChange }: ModeratorSidebarProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false)
  
  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/moderator/dashboard",
      description: "Tổng quan hệ thống"
    },
    {
      id: "users" as const,
      label: "Quản lý người dùng",
      icon: Users,
      path: "/moderator/user-management",
      description: "Quản lý tài khoản người dùng"
    },
    {
      id: "requests" as const,
      label: "Yêu cầu kiểm duyệt",
      icon: FileText,
      path: "/moderator/request-management",
      description: "Duyệt và phê duyệt nội dung"
    },
    {
      id: "verification" as const,
      label: "Xác thực tài khoản",
      icon: Shield,
      path: "/moderator/verify-management",
      description: "Xác thực danh tính người dùng"
    },
    {
      id: "blog" as const,
      label: "Quản lý Blog",
      icon: BookOpen,
      description: "Quản lý bài viết và nội dung",
      hasSubmenu: true
    },
    

  ]

  const blogSubmenuItems = [
    {
      id: "posts" as const,
      label: "Quản lý bài viết",
      description: "Tạo, sửa, xóa bài viết",
    },
    {
      id: "categories" as const,
      label: "Quản lý danh mục",
      description: "Quản lý các danh mục bài viết",
    },
    {
      id: "comments" as const,
      label: "Quản lý bình luận",
      description: "Kiểm duyệt bình luận",
    },
    {
      id: "tags" as const,
      label: "Quản lý thẻ",
      description: "Kiểm duyệt thẻ",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  const handleTabChange = (tab: "dashboard" | "users" | "requests" | "verification" | "blog") => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      // Fallback to navigation if onTabChange is not provided
      const pathMap = {
        dashboard: "/moderator/dashboard",
        users: "/moderator/user-management",
        requests: "/moderator/request-management", 
        verification: "/moderator/verify-management",
        blog: "/moderator/blog-management"
      }
      router.push(pathMap[tab])
    }
    
   
    if (tab !== "blog") {
      setIsBlogDropdownOpen(false)
    }
    
    setIsMobileMenuOpen(false)
  }

  const handleBlogTabChange = (tab: "posts" | "categories" | "comments" | "tags") => {
    onBlogTabChange?.(tab)
    // Không đóng dropdown khi chọn submenu
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white/10 backdrop-blur-md border-r border-white/20 z-20
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Moderator</h2>
              <p className="text-sm text-white/70">Control Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-3 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const isBlogActive = activeTab === "blog"
              
              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={`
                      w-full justify-start h-14 px-4 group transition-all duration-200
                      ${isActive
                        ? "bg-white/20 text-white border border-white/30 shadow-lg scale-105"
                        : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-105"
                      }
                    `}
                    onClick={() => {
                      if (item.hasSubmenu) {
                        // Chỉ toggle dropdown khi click vào menu chính
                        setIsBlogDropdownOpen(!isBlogDropdownOpen)
                        handleTabChange("blog")
                      } else {
                        handleTabChange(item.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`
                        p-2 rounded-lg transition-all duration-200
                        ${isActive 
                          ? "bg-white/20" 
                          : "bg-white/5 group-hover:bg-white/15"
                        }
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                      {item.hasSubmenu && (
                        <div className="ml-auto">
                          {isBlogDropdownOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </Button>

                  {/* Blog submenu */}
                  {item.hasSubmenu && isBlogDropdownOpen && (
                    <div className="ml-8 mt-2 space-y-2 animate-slide-in-left">
                      {blogSubmenuItems.map((subItem) => {
                        const isSubActive = isBlogActive && activeBlogTab === subItem.id
                        return (
                          <Button
                            key={subItem.id}
                            variant="ghost"
                            className={`
                              w-full justify-start h-12 px-4 text-sm transition-all duration-200
                              ${isSubActive
                                ? "bg-white/15 text-white border border-white/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                              }
                            `}
                            onClick={() => handleBlogTabChange(subItem.id)}
                          >
                            <div className="text-left">
                              <div className="font-medium">{subItem.label}</div>
                              <div className="text-xs opacity-70">{subItem.description}</div>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 hover:scale-105"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}