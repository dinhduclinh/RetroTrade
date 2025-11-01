"use client";

import { useState } from "react";
import { ModeratorSidebar } from "@/components/ui/moderator/moderator-sidebar";
import { ModeratorHeader } from "@/components/ui/moderator/moderator-header";
import { ModeratorStats } from "@/components/ui/moderator/moderator-stats";
import { OwnerRequestManagement } from "@/components/ui/moderator/owner-request-management";

import { BlogManagementTable } from "@/components/ui/moderator/blog/blog-management-table";
import { CategoryManagementTable } from "@/components/ui/moderator/blog/category-management-table";
import { CommentManagementTable } from "@/components/ui/moderator/blog/comment-management-table";

export default function RequestManagementDashboard() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "requests" | "verification" | "blog"
  >("requests");
  const [activeBlogTab, setActiveBlogTab] = useState<
    "posts" | "categories" | "comments"
  >("posts");

  const handleBlogTabChange = (tab: "posts" | "categories" | "comments") => {
    setActiveBlogTab(tab);
    setActiveTab("blog");
  };

  const renderContent = () => {
    if (activeTab === "blog") {
      switch (activeBlogTab) {
        case "posts":
          return <BlogManagementTable />;
        case "categories":
          return <CategoryManagementTable />;
        case "comments":
          return <CommentManagementTable />;
        default:
          return <BlogManagementTable />;
      }
    }
    return <OwnerRequestManagement />;
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
    return "Yêu cầu kiểm duyệt";
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
    return "Duyệt và phê duyệt các yêu cầu từ người dùng";
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
          activeBlogTab={activeBlogTab}
          onTabChange={setActiveTab}
          onBlogTabChange={handleBlogTabChange}
        />

        <div className="flex-1 transition-all duration-300 moderator-content-area min-w-0">
          <ModeratorHeader />

          <main className="p-4 lg:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {getPageTitle()}
              </h2>
              <p className="text-white/70">{getPageDescription()}</p>
            </div>

            {/* Stats only on dashboard */}

            <div className="mt-8">{renderContent()}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
