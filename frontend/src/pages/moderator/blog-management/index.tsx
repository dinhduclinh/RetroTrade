"use client";

import { useState } from "react";
import { BlogSidebar } from "@/components/ui/moderator/blog/blog-sidebar";
import { BlogHeader } from "@/components/ui/moderator/blog/blog-header";
import { BlogStats } from "@/components/ui/moderator/blog/blog-stats";
import { BlogManagementTable } from "@/components/ui/moderator/blog/blog-management-table";
import { CategoryManagementTable } from "@/components/ui/moderator/blog/category-management-table";
import { CommentManagementTable } from "@/components/ui/moderator/blog/comment-management-table";
import  { TagManagementTable } from "@/components/ui/moderator/blog/tag-management";


export default function BlogManagementDashboard() {
  const [activeTab, setActiveTab] = useState<
    "posts" | "categories" | "comments" | "tags"
  >("posts");

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="relative z-10 flex">
        <BlogSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 ml-64 bg-gray-50">
          <BlogHeader />

          <main className="p-8">
            <BlogStats />

            <div className="mt-8">
              {activeTab === "posts" && <BlogManagementTable />}
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
