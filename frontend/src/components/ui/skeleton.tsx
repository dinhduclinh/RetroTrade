"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-2">
              <div className="h-4 bg-white/20 rounded animate-pulse w-24" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-32" />
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-xl animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 bg-white/20 rounded animate-pulse w-16" />
              <div className="h-6 bg-white/10 rounded-full animate-pulse w-12" />
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="h-full bg-white/20 rounded-full animate-pulse w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="h-6 bg-white/20 rounded animate-pulse w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/20 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-white/10 rounded animate-pulse w-1/4" />
              </div>
              <div className="h-8 bg-white/20 rounded animate-pulse w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))] animate-pulse" />
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex">
        {/* Sidebar skeleton */}
        <div className="fixed left-0 top-0 h-full w-64 bg-white/10 backdrop-blur-md border-r border-white/20 z-20">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 bg-white/20 rounded animate-pulse w-24" />
                <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-12 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex-1 lg:ml-64">
          {/* Header skeleton */}
          <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-white/20 rounded animate-pulse w-48" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-64" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-64 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-10 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          <main className="p-4 lg:p-8">
            <div className="mb-6">
              <div className="h-8 bg-white/20 rounded animate-pulse w-64 mb-2" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-96" />
            </div>

            <StatsSkeleton />

            <div className="mt-8">
              <TableSkeleton />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
