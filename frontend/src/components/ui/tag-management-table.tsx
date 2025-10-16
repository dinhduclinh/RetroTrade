"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

type Tag = {
  id: string
  name: string
  slug: string
  createdAt: string
}

export function TagManagementTable() {
  const [query, setQuery] = useState("")
  // Placeholder data; replace with API integration later
  const [tags] = useState<Tag[]>([
    { id: "1", name: "Javascript", slug: "javascript", createdAt: new Date().toISOString() },
    { id: "2", name: "React", slug: "react", createdAt: new Date().toISOString() },
    { id: "3", name: "NodeJS", slug: "nodejs", createdAt: new Date().toISOString() },
  ])

  const filtered = tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-white">Quản lý Tag</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm tag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button className="bg-emerald-600 hover:bg-emerald-500">Thêm tag</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tên</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Tạo lúc</th>
                <th className="px-4 py-3 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((tag) => (
                <tr key={tag.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{tag.name}</td>
                  <td className="px-4 py-3 text-white/80">{tag.slug}</td>
                  <td className="px-4 py-3 text-white/70">{new Date(tag.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" className="text-white/80 hover:bg-white/10">Sửa</Button>
                      <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default TagManagementTable


