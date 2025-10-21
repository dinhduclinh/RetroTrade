"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { ModeratorSidebar } from "@/components/ui/moderator/moderator-sidebar";
import { ModeratorHeader } from "@/components/ui/moderator/moderator-header";
import { ModeratorStats } from "@/components/ui/moderator/moderator-stats";
import { UserManagementTable } from "@/components/ui/moderator/user-management-table";
import { RequestManagementTable } from "@/components/ui/moderator/request-management-table";
import { VerificationQueue } from "@/components/ui/moderator/verification-queue";
import { BlogManagementTable } from "@/components/ui/moderator/blog/blog-management-table";
import { CommentManagementTable } from "@/components/ui/moderator/blog/comment-management-table";
import { TagManagementTable } from "@/components/ui/moderator/blog/tag-management";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Shield,
  AlertTriangle,
  Activity,
} from "lucide-react";
import ProductCategoryManager from "@/components/ui/moderator/categories/category-management-table";

// JWT token payload interface
interface JwtPayload {
  _id?: string;
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  role?: string;
  fullName?: string;
  exp: number;
  iat: number;
}

export default function ModeratorDashboard() {
  console.log(
    "🚀 ModeratorDashboard component loaded at:",
    new Date().toISOString()
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "requests"
    | "verification"
    | "blog"
    | "productManagement"
  >("dashboard");
  const [activeBlogTab, setActiveBlogTab] = useState<
    "posts" | "categories" | "comments" | "tags"
  >("posts");
  const [activeProductTab, setActiveProductTab] = useState<
    "products" | "categories"
  >("products");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (
    tab:
      | "dashboard"
      | "users"
      | "requests"
      | "verification"
      | "blog"
      | "productManagement"
  ) => {
    console.log("Moderator handleTabChange called with:", tab);
    setActiveTab(tab);
    console.log("State updated: activeTab=", tab);
  };

  const handleProductTabChange = (tab: "products" | "categories") => {
    console.log("Moderator handleProductTabChange called with:", tab);
    setActiveProductTab(tab);
    setActiveTab("productManagement");
  };

  const handleBlogTabChange = (
    tab: "posts" | "categories" | "comments" | "tags"
  ) => {
    console.log("Moderator handleBlogTabChange called with:", tab);
    setActiveBlogTab(tab);
    setActiveTab("blog");
  };

  // Debug: Track state changes
  useEffect(() => {
    console.log(
      "State changed - activeTab:",
      activeTab,
      "activeBlogTab:",
      activeBlogTab,
      "activeProductTab:",
      activeProductTab
    );
  }, [activeTab, activeBlogTab, activeProductTab]);

  // Check URL query parameter for tab navigation
  useEffect(() => {
    const tab = searchParams.get("tab");
    console.log("URL query parameter 'tab':", tab);

    if (
      tab &&
      [
        "dashboard",
        "users",
        "requests",
        "verification",
        "blog",
        "productManagement",
      ].includes(tab)
    ) {
      console.log("Setting activeTab from URL query parameter:", tab);
      setActiveTab(
        tab as
          | "dashboard"
          | "users"
          | "requests"
          | "verification"
          | "blog"
          | "productManagement"
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (!accessToken) {
      toast.error("Bạn cần đăng nhập để truy cập trang này");
      router.push("/auth/login");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        toast.error("Phiên đăng nhập đã hết hạn");
        router.push("/auth/login");
        return;
      }

      // Check if user has moderator role
      if (decoded.role !== "moderator" && decoded.role !== "admin") {
        toast.error("Bạn không có quyền truy cập trang moderator");
        router.push("/home");
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Token decode error:", error);
      toast.error("Token không hợp lệ");
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, router]);

  // Show loading while checking authorization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-lg">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  const renderContent = () => {
    if (activeTab === "blog") {
      switch (activeBlogTab) {
        case "posts":
          return <BlogManagementTable />;
        case "categories":
          return (
            <div className="text-white p-8 text-center">
              Quản lý danh mục blog (Chưa triển khai)
            </div>
          );
        case "comments":
          return <CommentManagementTable />;
        case "tags":
          return <TagManagementTable />;
        default:
          return <BlogManagementTable />;
      }
    }

    if (activeTab === "productManagement") {
      switch (activeProductTab) {
        case "categories":
          return <ProductCategoryManager />;
        case "products":
          return (
            <div className="text-white p-8 text-center">
              Quản lý sản phẩm (Chưa triển khai)
            </div>
          );
        default:
          return <ProductCategoryManager />;
      }
    }

    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "users":
        return <UserManagementTable />;
      case "requests":
        return <RequestManagementTable />;
      case "verification":
        return <VerificationQueue />;
      default:
        return <DashboardOverview />;
    }
  };

  const getPageTitle = () => {
    if (activeTab === "blog") {
      switch (activeBlogTab) {
        case "posts":
          return "Quản lý bài viết";
        case "categories":
          return "Quản lý danh mục";
        case "comments":
          return "Quản lý bình luận";
        default:
          return "Quản lý bài viết";
      }
    }

    if (activeTab === "productManagement") {
      switch (activeProductTab) {
        case "categories":
          return "Quản lý danh mục sản phẩm";
        case "products":
          return "Quản lý sản phẩm";
        default:
          return "Quản lý danh mục sản phẩm";
      }
    }

    switch (activeTab) {
      case "dashboard":
        return "Dashboard Tổng quan";
      case "users":
        return "Quản lý người dùng";
      case "requests":
        return "Yêu cầu kiểm duyệt";
      case "verification":
        return "Xác thực tài khoản";
      default:
        return "Dashboard Tổng quan";
    }
  };

  const getPageDescription = () => {
    if (activeTab === "blog") {
      switch (activeBlogTab) {
        case "posts":
          return "Tạo, chỉnh sửa và quản lý các bài viết trong hệ thống";
        case "categories":
          return "Quản lý các danh mục và phân loại bài viết";
        case "comments":
          return "Kiểm duyệt và quản lý bình luận từ người dùng";
        default:
          return "Tạo, chỉnh sửa và quản lý các bài viết trong hệ thống";
      }
    }

    if (activeTab === "productManagement") {
      switch (activeProductTab) {
        case "categories":
          return "Tạo, chỉnh sửa và quản lý danh mục sản phẩm";
        case "products":
          return "Duyệt và quản lý sản phẩm từ người dùng";
        default:
          return "Tạo, chỉnh sửa và quản lý danh mục sản phẩm";
      }
    }

    switch (activeTab) {
      case "dashboard":
        return "Tổng quan về hoạt động và thống kê hệ thống";
      case "users":
        return "Theo dõi và quản lý tài khoản người dùng trong hệ thống";
      case "requests":
        return "Duyệt và phê duyệt các yêu cầu từ người dùng";
      case "verification":
        return "Xác thực danh tính và thông tin người dùng";
      default:
        return "Tổng quan về hoạt động và thống kê hệ thống";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.2),rgba(255,255,255,0))] animate-pulse" />
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex">
        <ModeratorSidebar
          activeTab={activeTab}
          activeProductTab={activeProductTab}
          activeBlogTab={activeBlogTab}
          onTabChange={handleTabChange}
          onProductTabChange={handleProductTabChange}
          onBlogTabChange={handleBlogTabChange}
        />

        <div className="flex-1 lg:ml-72">
          <ModeratorHeader />

          <main className="p-4 lg:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {getPageTitle()}
              </h2>
              <p className="text-white/70">{getPageDescription()}</p>
            </div>

            {activeTab === "dashboard" && <ModeratorStats />}

            <div className="mt-8">{renderContent()}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview() {
  const quickActions = [
    {
      title: "Người dùng mới",
      value: "24",
      change: "+12%",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Trong 24h qua",
    },
    {
      title: "Bài viết chờ duyệt",
      value: "8",
      change: "+3",
      icon: FileText,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "Cần xem xét",
    },
    {
      title: "Báo cáo vi phạm",
      value: "5",
      change: "-2",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      description: "Chưa xử lý",
    },
    {
      title: "Hoạt động hệ thống",
      value: "98%",
      change: "+1%",
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "Uptime",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "renter",
      action: "Người thuê mới đăng ký",
      user: "Nguyễn Văn A",
      time: "5 phút trước",
      status: "success",
    },
    {
      id: 2,
      type: "post",
      action: "Bài viết mới được tạo",
      user: "Trần Thị B",
      time: "12 phút trước",
      status: "pending",
    },
    {
      id: 3,
      type: "report",
      action: "Báo cáo vi phạm mới",
      user: "Lê Văn C",
      time: "25 phút trước",
      status: "warning",
    },
    {
      id: 4,
      type: "verification",
      action: "Tài khoản được xác thực",
      user: "Phạm Thị D",
      time: "1 giờ trước",
      status: "success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card
              key={index}
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover-lift group cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-white/80 group-hover:text-white transition-colors duration-200">
                    {action.title}
                  </CardTitle>
                  <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">
                    {action.description}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${action.bgColor} group-hover:bg-white/20`}
                >
                  <Icon
                    className={`w-5 h-5 ${action.color} group-hover:text-white transition-colors duration-200`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-white transition-colors duration-200">
                  {action.value}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  <span className="text-green-400">{action.change}</span> so với
                  hôm qua
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === "success"
                      ? "bg-green-500/20 text-green-400"
                      : activity.status === "warning"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {activity.type === "renter" && <Users className="w-5 h-5" />}
                  {activity.type === "post" && <FileText className="w-5 h-5" />}
                  {activity.type === "report" && (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  {activity.type === "verification" && (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-white/70 text-sm">{activity.user}</p>
                </div>
                <div className="text-white/60 text-sm">{activity.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Thống kê hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Tổng người dùng</span>
                <span className="text-white font-semibold">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Bài viết đã duyệt</span>
                <span className="text-white font-semibold">856</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Tài khoản xác thực</span>
                <span className="text-white font-semibold">892</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Báo cáo đã xử lý</span>
                <span className="text-white font-semibold">156</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Trạng thái hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Server Status</span>
                <span className="text-green-400 font-semibold">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Database</span>
                <span className="text-green-400 font-semibold">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">API Response</span>
                <span className="text-green-400 font-semibold">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Last Backup</span>
                <span className="text-white font-semibold">2h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
