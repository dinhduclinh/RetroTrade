"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card";
import { Badge } from "@/components/ui/common/badge";
import { Button } from "@/components/ui/common/button";
import { Input } from "@/components/ui/common/input";
import { Textarea } from "@/components/ui/common/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/common/dialog";
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  MessageSquare,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Phone,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { ownerRequestApi, OwnerRequest } from "@/services/moderator/ownerRequest.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/common/avatar";

export function OwnerRequestManagement() {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<OwnerRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "approve" | "reject" | null }>({ 
    open: false, 
    type: null 
  });
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; request: OwnerRequest | null }>({
    open: false,
    request: null
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching requests with filter:", statusFilter);
      console.log("Calling API: getAllOwnerRequests");
      const data = await ownerRequestApi.getAllOwnerRequests({ 
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter 
      });
      console.log("API response received:", data);
      console.log("Items count:", data?.items?.length);
      setRequests(data?.items || []);
      if (!data?.items || data.items.length === 0) {
        console.log("No requests found in database");
      } else {
        console.log("Successfully loaded", data.items.length, "requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      console.error("Error details:", error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách yêu cầu';
      setError(errorMessage);
      toast.error(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await ownerRequestApi.approveOwnerRequest(selectedRequest._id, { notes });
      toast.success("Đã duyệt yêu cầu thành công");
      setActionDialog({ open: false, type: null });
      setSelectedRequest(null);
      setNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Không thể duyệt yêu cầu");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await ownerRequestApi.rejectOwnerRequest(selectedRequest._id, {
        rejectionReason,
        notes
      });
      toast.success("Đã từ chối yêu cầu thành công");
      setActionDialog({ open: false, type: null });
      setSelectedRequest(null);
      setRejectionReason("");
      setNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Không thể từ chối yêu cầu");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đã duyệt</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Đã từ chối</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Đã hủy</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const filteredRequests = requests.filter(req =>
    searchTerm === "" ||
    req.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-4">{error}</p>
          <Button onClick={fetchRequests} variant="outline" className="text-white">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Yêu cầu cấp quyền Owner</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 bg-white/10 border border-white/20 rounded text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Đã từ chối</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <Button onClick={fetchRequests} variant="ghost" size="icon" className="text-white">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-white/70">
              Không có yêu cầu nào
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.user.avatarUrl} />
                        <AvatarFallback className="bg-blue-500/20 text-white">
                          {request.user.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold">
                            {request.user.fullName || "Unknown"}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="space-y-1 text-sm text-white/70">
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {request.user.email}
                          </p>
                          <p className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">Lý do:</span> {request.reason}
                          </p>
                          {request.additionalInfo && (
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Thông tin thêm:</span> {request.additionalInfo}
                            </p>
                          )}
                          <p className="text-xs text-white/50">
                            Yêu cầu vào: {formatDate(request.CreatedAt)}
                          </p>
                          {request.reviewedAt && (
                            <p className="text-xs text-white/50">
                              Đã xử lý vào: {formatDate(request.reviewedAt)}
                              {request.reviewedBy && ` bởi ${request.reviewedBy.fullName}`}
                            </p>
                          )}
                          {request.rejectionReason && (
                            <p className="text-red-400 text-sm">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              Lý do từ chối: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setDetailDialog({ open: true, request })}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                      {request.status === "pending" && (
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionDialog({ open: true, type: "approve" });
                          }}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Duyệt
                        </Button>
                      )}
                      {request.status === "pending" && (
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionDialog({ open: true, type: "reject" });
                          }}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Từ chối
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === "approve"} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu cấp quyền Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Bạn có chắc muốn duyệt yêu cầu này?</p>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Ghi chú (tùy chọn)</label>
              <Textarea
                placeholder="Nhập ghi chú..."
                className="bg-white/10 border-white/20 text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null })}
              className="bg-gray-600 hover:bg-gray-500 text-white border-gray-500"
            >
              Hủy
            </Button>
            <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, request: null })}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin người dùng
            </DialogTitle>
          </DialogHeader>
          {detailDialog.request && (
            <div className="space-y-6 mt-4">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={detailDialog.request.user.avatarUrl} />
                    <AvatarFallback className="bg-blue-500/20 text-white text-xl">
                      {detailDialog.request.user.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {detailDialog.request.user.fullName || "Unknown"}
                    </p>
                    <p className="text-sm text-white/60">Role: {detailDialog.request.user.role}</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-white/60 flex-shrink-0" />
                    <span className="text-white break-all">{detailDialog.request.user.email}</span>
                  </div>
                  {detailDialog.request.user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-white/60 flex-shrink-0" />
                      <span className="text-white">{detailDialog.request.user.phone}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-sm text-white/60 mb-2">Thời gian</p>
                  <p className="text-xs text-white/50">
                    {formatDate(detailDialog.request.CreatedAt)}
                  </p>
                </div>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-white/60">Lý do yêu cầu</h3>
                  <p className="text-white">{detailDialog.request.reason}</p>
                </div>
                {detailDialog.request.additionalInfo && (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2 text-white/60">Thông tin thêm</h3>
                    <p className="text-white">{detailDialog.request.additionalInfo}</p>
                  </div>
                )}
              </div>

              {/* Documents - Căn cước công dân */}
              {detailDialog.request.user.documents && detailDialog.request.user.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Giấy tờ tùy thân (Căn cước công dân)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {detailDialog.request.user.documents.map((doc, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
                        <div className="aspect-square bg-white/10 rounded-lg overflow-hidden border border-white/10 mb-3 cursor-pointer hover:border-white/30 transition-colors"
                             onClick={() => window.open(doc.fileUrl, '_blank')}>
                          <img
                            src={doc.fileUrl}
                            alt={doc.documentType || `Document ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm text-white font-medium capitalize">
                            {doc.documentType === 'selfie' && '📸 Ảnh chân dung'}
                            {doc.documentType === 'idCardFront' && '🆔 Mặt trước căn cước'}
                            {doc.documentType === 'idCardBack' && '🆔 Mặt sau căn cước'}
                          </p>
                          <p className="text-xs text-white/50">
                            {doc.status === 'approved' && '✓ Đã duyệt'}
                            {doc.status === 'pending' && '⏳ Đang chờ'}
                            {doc.status === 'rejected' && '✗ Đã từ chối'}
                          </p>
                          <button
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                          >
                            Mở ảnh đầy đủ →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!detailDialog.request.user.documents || detailDialog.request.user.documents.length === 0) && (
                <div className="border-t border-white/10 pt-4">
                  <div className="text-center py-8 bg-white/5 rounded-lg">
                    <CreditCard className="h-12 w-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60">Người dùng chưa upload giấy tờ tùy thân</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialog({ open: false, request: null })}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white border-gray-500"
            >
              Đóng
            </Button>
            {detailDialog.request?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    setDetailDialog({ open: false, request: null });
                    setSelectedRequest(detailDialog.request);
                    setActionDialog({ open: true, type: "approve" });
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Duyệt
                </Button>
                <Button
                  onClick={() => {
                    setDetailDialog({ open: false, request: null });
                    setSelectedRequest(detailDialog.request);
                    setActionDialog({ open: true, type: "reject" });
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === "reject"} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu cấp quyền Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Lý do từ chối *</label>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                className="bg-white/10 border-white/20 text-white"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Ghi chú (tùy chọn)</label>
              <Textarea
                placeholder="Nhập ghi chú..."
                className="bg-white/10 border-white/20 text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null })}
              className="bg-gray-600 hover:bg-gray-500 text-white border-gray-500"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600"
              disabled={!rejectionReason}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

