"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/common/dialog"
import { Textarea } from "@/components/ui/common/textarea"
import { Edit, Shield, Wallet, Settings, ChevronRight, Key, Store, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ownerRequestApi } from "@/services/auth/ownerRequest.api"

interface QuickActionsCardProps {
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onRegisterRental?: () => void;
  userRole?: string;
  isPhoneConfirmed?: boolean;
  isIdVerified?: boolean;
}

export function QuickActionsCard({ 
  onEditProfile, 
  onChangePassword, 
  onRegisterRental, 
  userRole,
  isPhoneConfirmed = false,
  isIdVerified = false
}: QuickActionsCardProps) {
  // Check if user meets verification requirements
  const isVerified = isPhoneConfirmed && isIdVerified;
  const router = useRouter();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    // Check if user has pending request
    if (userRole === "renter") {
      fetchUserRequests();
    }
  }, [userRole]);

  const fetchUserRequests = async () => {
    try {
      const requests = await ownerRequestApi.getMyOwnerRequests();
      const pending = requests.some(req => req.status === "pending");
      setHasPendingRequest(pending);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleRequestOwner = () => {
    console.log("handleRequestOwner called", { hasPendingRequest, userRole });
    if (hasPendingRequest) {
      toast.info("Bạn đã có yêu cầu đang chờ xử lý");
      return;
    }
    console.log("Opening dialog...");
    setShowRequestDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do yêu cầu");
      return;
    }

    try {
      setIsSubmitting(true);
      await ownerRequestApi.createOwnerRequest({
        reason: reason.trim(),
        additionalInfo: additionalInfo.trim() || undefined
      });
      toast.success("Yêu cầu đã được gửi thành công. Vui lòng chờ moderator xử lý.");
      setShowRequestDialog(false);
      setReason("");
      setAdditionalInfo("");
      fetchUserRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      const errorMessage = error instanceof Error ? error.message : "Không thể gửi yêu cầu";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdentityVerification = () => {
    router.push('/auth/verify');
  };

  const actions = [
    { icon: Edit, label: "Chỉnh sửa hồ sơ", color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-600", action: onEditProfile },
    { icon: Key, label: "Đổi mật khẩu", color: "from-green-500/20 to-emerald-500/20", iconColor: "text-green-600", action: onChangePassword },
    { 
      icon: Store, 
      label: hasPendingRequest 
        ? "Đăng ký cho thuê (Đã gửi)" 
        : userRole === "owner"
          ? "Tạo sản phẩm cho thuê"
          : userRole === "renter"
            ? "Yêu cầu cấp quyền cho thuê"
            : "Đăng ký cho thuê", 
      color: "from-indigo-500/20 to-purple-500/20", 
      iconColor: "text-indigo-600", 
      action: () => {
        console.log("Button clicked", { userRole, hasPendingRequest });
        
        // For renter - show rental request dialog
        if (userRole === "renter") {
          if (hasPendingRequest) {
            toast.info("Bạn đã có yêu cầu đang chờ xử lý");
          } else {
            console.log("Opening rental request dialog...");
            handleRequestOwner();
          }
        } 
        // For owner - go to create product
        else if (userRole === "owner" && onRegisterRental) {
          onRegisterRental();
        }
        // For other roles - show detailed info
        else {
          toast.error(
            "Chỉ tài khoản người dùng mới có thể yêu cầu nâng cấp quyền cho thuê. " +
            "Vui lòng liên hệ admin để biết thêm chi tiết.",
            { duration: 5000 }
          );
        }
      },
      disabled: hasPendingRequest
    },
    {
      icon: Shield,
      label: "Xác thực danh tính",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-600",
      action: handleIdentityVerification,
    },
    { icon: Wallet, label: "Quản lý ví", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-600" },
    {
      icon: Settings,
      label: "Cài đặt bảo mật",
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={action.action}
            disabled={action.disabled}
            className={`w-full justify-between bg-white border border-gray-200 hover:border-gray-300 text-gray-900 hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-lg group ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg bg-gray-100 ${action.iconColor}`}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="font-medium">{action.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </Button>
        ))}
      </CardContent>

      {/* Rental Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={(open) => {
        setShowRequestDialog(open);
        if (!open) {
          setReason("");
          setAdditionalInfo("");
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yêu cầu quyền cho thuê</DialogTitle>
            <DialogDescription>
              Vui lòng điền thông tin để yêu cầu quyền cho thuê
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Điều kiện yêu cầu:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Đã xác minh số điện thoại</li>
                  <li>Đã xác minh danh tính</li>
                  <li>Chỉ dành cho tài khoản Renter</li>
                </ul>
              </div>
            </div>

            {/* Verification Status */}
            <div className={`border rounded-lg p-3 ${isVerified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-semibold mb-2 text-sm">Trạng thái xác minh của bạn:</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span>Số điện thoại:</span>
                  <span className={`font-medium ${isPhoneConfirmed ? 'text-green-600' : 'text-red-600'}`}>
                    {isPhoneConfirmed ? '✓ Đã xác minh' : '✗ Chưa xác minh'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Danh tính:</span>
                  <span className={`font-medium ${isIdVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {isIdVerified ? '✓ Đã xác minh' : '✗ Chưa xác minh'}
                  </span>
                </div>
              </div>
              {!isVerified && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-600 mb-2 italic">
                    Vui lòng hoàn tất xác minh để có thể gửi yêu cầu
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowRequestDialog(false);
                      router.push('/auth/verify');
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs py-1.5"
                  >
                    Chuyển đến trang xác minh
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Lý do yêu cầu <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ví dụ: Tôi muốn cho thuê laptop của mình để kiếm thêm thu nhập..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Thông tin bổ sung (tùy chọn)
              </label>
              <Textarea
                placeholder="Ví dụ: Có kinh nghiệm 5 năm sử dụng, thiết bị đã được bảo hành..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                setReason("");
                setAdditionalInfo("");
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRequest}
              disabled={isSubmitting || !reason.trim() || !isVerified}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isVerified ? "Hoàn tất xác minh trước" : isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
