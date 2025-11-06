"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card";
import { Button } from "@/components/ui/common/button";
import { Badge } from "@/components/ui/common/badge";
import {
  getLoyaltyStats,
  getLoyaltyHistory,
  claimDailyLoginPoints,
  type LoyaltyPointTransaction,
  type LoyaltyStats,
} from "@/services/auth/loyalty.api";
import {
  Gift,
  TrendingUp,
  TrendingDown,
  History,
  Clock,
  ShoppingBag,
  LogIn,
  Gamepad2,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getTypeIcon = (type: LoyaltyPointTransaction["type"]) => {
  switch (type) {
    case "daily_login":
      return <LogIn className="w-4 h-4" />;
    case "order_completed":
      return <ShoppingBag className="w-4 h-4" />;
    case "game_reward":
      return <Gamepad2 className="w-4 h-4" />;
    case "referral":
      return <Sparkles className="w-4 h-4" />;
    default:
      return <Gift className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: LoyaltyPointTransaction["type"]) => {
  const labels: Record<LoyaltyPointTransaction["type"], string> = {
    daily_login: "Đăng nhập",
    order_completed: "Đặt hàng",
    order_cancelled: "Hủy đơn",
    referral: "Giới thiệu",
    game_reward: "Mini Game",
    admin_adjustment: "Điều chỉnh",
    expired: "Hết hạn",
  };
  return labels[type] || type;
};

const getTypeColor = (type: LoyaltyPointTransaction["type"]) => {
  switch (type) {
    case "daily_login":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "order_completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "game_reward":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "referral":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export function LoyaltyManagement() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [history, setHistory] = useState<LoyaltyPointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadStats = async () => {
    try {
      const res = await getLoyaltyStats();
      if (res.code === 200 && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Error loading loyalty stats:", error);
    }
  };

  const loadHistory = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const res = await getLoyaltyHistory(pageNum, 20);
      if (res.code === 200 && res.data) {
        setHistory(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error loading loyalty history:", error);
      toast.error("Không thể tải lịch sử RT Points");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadHistory();
  }, []);

  const handleClaimDailyLogin = async () => {
    setClaiming(true);
    try {
      const res = await claimDailyLoginPoints();
      if (res.code === 200 && res.data) {
        if (res.data.alreadyClaimed) {
          toast.info("Bạn đã nhận điểm đăng nhập hôm nay rồi!");
        } else {
          toast.success(`Nhận ${res.data.points} RT Points thành công!`);
          await loadStats();
          await loadHistory(1);
          setPage(1);
        }
      } else {
        toast.error(res.message || "Không thể nhận điểm đăng nhập");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi nhận điểm đăng nhập");
    } finally {
      setClaiming(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadHistory(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Số dư hiện tại</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats?.currentBalance.toLocaleString("vi-VN") || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">RT Points</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Coins className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng đã nhận</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.totalEarned.toLocaleString("vi-VN") || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">RT Points</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tổng đã dùng</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats?.totalSpent.toLocaleString("vi-VN") || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">RT Points</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingDown className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Login Claim */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            Nhận điểm đăng nhập hàng ngày
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Đăng nhập hàng ngày</p>
              <p className="text-sm text-gray-600">Nhận 10 RT Points mỗi ngày khi đăng nhập</p>
            </div>
            <Button
              onClick={handleClaimDailyLogin}
              disabled={claiming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Nhận ngay
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Lịch sử RT Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Chưa có lịch sử RT Points</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          transaction.points > 0 ? "bg-emerald-100" : "bg-red-100"
                        )}
                      >
                        <div className={cn("text-emerald-600", transaction.points < 0 && "text-red-600")}>
                          {getTypeIcon(transaction.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{transaction.description}</p>
                          <Badge variant="secondary" className={getTypeColor(transaction.type)}>
                            {getTypeLabel(transaction.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(transaction.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-bold text-lg",
                          transaction.points > 0 ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {transaction.points > 0 ? "+" : ""}
                        {transaction.points.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-gray-500">Số dư: {transaction.balance.toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Trang {page} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

