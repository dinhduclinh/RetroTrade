"use client"

import { Bell, Search, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function BlogHeader() {
  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Management</h1>
          <p className="text-white/70">Quản lý nội dung blog và bài viết</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 w-64"
            />
          </div>

          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tạo bài viết
          </Button>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-medium">Blog Manager</span>
          </div>
        </div>
      </div>
    </header>
  )
}
