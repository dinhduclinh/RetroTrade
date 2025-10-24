import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card";
import { Button } from "@/components/ui/common/button";
import { Crown, Users, Package, BarChart3, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-600" />
            Admin Panel
          </h1>
          <p className="text-gray-600">Quản lý hệ thống và người dùng</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Quản lý người dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quản lý tài khoản người dùng, phân quyền và trạng thái</p>
              <Button className="w-full">
                <Link href="/admin/user-management" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Quản lý sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quản lý danh mục sản phẩm và kiểm duyệt</p>
              <Button className="w-full">
                <Link href="/admin/products" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Thống kê
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Xem báo cáo và thống kê hệ thống</p>
              <Button className="w-full">
                <Link href="/admin/analytics" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Cài đặt hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Cấu hình và cài đặt hệ thống</p>
              <Button className="w-full">
                <Link href="/admin/settings" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
