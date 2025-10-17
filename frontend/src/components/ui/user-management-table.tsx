"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Eye, RefreshCw, ChevronLeft, ChevronRight, UserCog, Search, Filter } from "lucide-react"
import { getAllUsers, updateUserRole } from "@/services/auth/user.api"
import { toast } from "sonner"
import type { UserProfile } from "@/services/iService"
import { 
  createPaginationState, 
  generatePageNumbers, 
  formatPaginationInfo,
  type PaginationState 
} from "@/lib/pagination"
import { RoleChangeModal } from "@/components/ui/role-change-modal"

export function UserManagementTable() {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [roleChangeLoading, setRoleChangeLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 0,
    endIndex: 0
  })

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await getAllUsers(page, paginationState.itemsPerPage)
      
      // Check if response exists and has correct structure
      if (response && response.code === 200) {
        const items = response.data?.items || []
        const totalItems = response.data?.totalItems || 0
        const totalPages = response.data?.totalPages || 1
        
        setUsers(items)
        
        // Update pagination state
        const newPaginationState = createPaginationState({
          page,
          limit: paginationState.itemsPerPage,
          totalItems,
          totalPages
        })
        setPaginationState(newPaginationState)
      } else {
        const errorMessage = response?.message || "Lỗi khi tải danh sách users"
        toast.error(errorMessage)
        console.error("API Error:", response)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Lỗi khi tải danh sách users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewUser = (userId: string) => {
    router.push(`/moderator/user-management/${userId}`)
  }

  const handleRoleChangeClick = (user: UserProfile) => {
    setSelectedUser(user)
    setRoleChangeModalOpen(true)
  }

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      setRoleChangeLoading(true)
      const response = await updateUserRole(userId, newRole)
      if (response && response.code === 200) {
        toast.success("Cập nhật vai trò thành công")
        fetchUsers(paginationState.currentPage) // Refresh current page
        setRoleChangeModalOpen(false)
        setSelectedUser(null)
      } else {
        const errorMessage = response?.message || "Lỗi khi cập nhật vai trò"
        toast.error(errorMessage)
        console.error("API Error:", response)
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Lỗi khi cập nhật vai trò")
    } finally {
      setRoleChangeLoading(false)
    }
  }


  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationState.totalPages) {
      fetchUsers(page)
    }
  }

  // Client-side filtering and search
  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))

    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter

    // Status filter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "verified" && user.isEmailConfirmed && user.isPhoneConfirmed && user.isIdVerified) ||
      (statusFilter === "pending" && user.isEmailConfirmed && !(user.isPhoneConfirmed && user.isIdVerified)) ||
      (statusFilter === "unverified" && !user.isEmailConfirmed)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (user: UserProfile) => {
    if (user.isEmailConfirmed && user.isPhoneConfirmed && user.isIdVerified) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đã xác minh</Badge>
    } else if (user.isEmailConfirmed) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ xác minh</Badge>
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Chưa xác minh</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Admin</Badge>
      case "moderator":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Moderator</Badge>
      case "owner":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Owner</Badge>
      case "user":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">User</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-white/70" />
            <span className="ml-2 text-white/70">Đang tải danh sách users...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Quản lý người dùng ({filteredUsers.length} users)
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white/70 hover:bg-white/10"
              onClick={() => fetchUsers(paginationState.currentPage)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              type="text"
              placeholder="Tìm theo email hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-white/50 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả quyền</option>
              <option value="user">User</option>
              <option value="owner">Owner</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="verified">Đã xác minh</option>
              <option value="pending">Chờ xác minh</option>
              <option value="unverified">Chưa xác minh</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/70">Tên</TableHead>
                <TableHead className="text-white/70">Email</TableHead>
                <TableHead className="text-white/70">Vai trò</TableHead>
                <TableHead className="text-white/70">Trạng thái</TableHead>
                <TableHead className="text-white/70">Điểm uy tín</TableHead>
                <TableHead className="text-white/70">Ngày tạo</TableHead>
                <TableHead className="text-white/70">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow className="border-white/20">
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-white/70">
                      <Users className="w-12 h-12 mx-auto mb-4 text-white/30" />
                      <p className="text-lg font-medium mb-2">Không tìm thấy người dùng</p>
                      <p className="text-sm">
                        {searchTerm || roleFilter !== "all" || statusFilter !== "all" 
                          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" 
                          : "Chưa có người dùng nào trong hệ thống"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id} className="border-white/20">
                    <TableCell className="text-white font-medium">
                      {user.displayName || user.fullName}
                    </TableCell>
                    <TableCell className="text-white/70">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-white/70">
                      <div className="flex items-center gap-1">
                        <span>{user.reputationScore}/5</span>
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full" 
                            style={{ width: `${(user.reputationScore / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-400 hover:bg-blue-500/10"
                          title="Xem chi tiết"
                          onClick={() => handleViewUser(user._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-purple-400 hover:bg-purple-500/10"
                          onClick={() => handleRoleChangeClick(user)}
                          title="Đổi quyền"
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {paginationState.totalPages > 1 && (
          <div className="mt-6">
            {/* Pagination Info */}
            <div className="text-white/70 text-sm mb-4 text-center">
              {formatPaginationInfo({
                page: paginationState.currentPage,
                limit: paginationState.itemsPerPage,
                totalItems: paginationState.totalItems,
                totalPages: paginationState.totalPages,
                hasNextPage: paginationState.hasNextPage,
                hasPrevPage: paginationState.hasPrevPage,
                startIndex: paginationState.startIndex,
                endIndex: paginationState.endIndex
              })}
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2">
              {/* Previous Button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:bg-white/10"
                onClick={() => handlePageChange(paginationState.currentPage - 1)}
                disabled={!paginationState.hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>
              
              {/* Page Numbers */}
              {generatePageNumbers(paginationState.currentPage, paginationState.totalPages, 5).map((pageNum) => (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={pageNum === paginationState.currentPage ? "default" : "ghost"}
                  className={
                    pageNum === paginationState.currentPage
                      ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      : "text-white/70 hover:bg-white/10"
                  }
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Next Button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:bg-white/10"
                onClick={() => handlePageChange(paginationState.currentPage + 1)}
                disabled={!paginationState.hasNextPage}
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Role Change Modal */}
      <RoleChangeModal
        open={roleChangeModalOpen}
        onOpenChange={setRoleChangeModalOpen}
        user={selectedUser}
        onConfirm={handleRoleUpdate}
        loading={roleChangeLoading}
      />
    </Card>
  )
}