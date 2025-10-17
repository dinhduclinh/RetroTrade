"use client";

import { useState } from "react";
import { BlogSidebar } from "@/components/ui/blog/blog-sidebar";
import { BlogHeader } from "@/components/ui/blog/blog-header";
import { BlogStats } from "@/components/ui/blog/blog-stats";
import { PostManagementTable } from "@/components/ui/post-management-table";
import { CategoryManagementTable } from "@/components/ui/blog/category-management-table";
import { CommentManagementTable } from "@/components/ui/blog/comment-management-table";
import  { TagManagementTable } from "@/components/ui/blog/tag-management";


export default function BlogManagementDashboard() {
  const [activeTab, setActiveTab] = useState<
    "posts" | "categories" | "comments" | "tags"
  >("posts");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.3),rgba(255,255,255,0))] animate-pulse" />
      <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex">
        <BlogSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 ml-64">
          <BlogHeader />

          <main className="p-8">
            <BlogStats />

            <div className="mt-8">
              {activeTab === "posts" && <PostManagementTable />}
              {activeTab === "categories" && <CategoryManagementTable />}
              {activeTab === "comments" && <CommentManagementTable />}
              {activeTab === "tags" && <TagManagementTable/>}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
