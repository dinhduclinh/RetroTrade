import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, BarChart3, Users, Package } from "lucide-react";
import Link from "next/link";

export default function OwnerPanel() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Owner Panel
          </h1>
          <p className="text-gray-600">Quản lý toàn bộ hệ thống và doanh thu</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Quản lý doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Theo dõi và quản lý doanh thu hệ thống</p>
              <Button className="w-full">
                <Link href="/owner/revenue" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Báo cáo tổng quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Xem báo cáo tổng quan về hoạt động hệ thống</p>
              <Button className="w-full">
                <Link href="/owner/analytics" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Quản lý nhân viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quản lý admin và moderator</p>
              <Button className="w-full">
                <Link href="/owner/staff" className="w-full">
                  Truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Quản lý sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Quản lý toàn bộ sản phẩm và danh mục</p>
              <Button className="w-full">
                <Link href="/owner/products" className="w-full">
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
              <p className="text-gray-600 mb-4">Cấu hình và cài đặt toàn bộ hệ thống</p>
              <Button className="w-full">
                <Link href="/owner/settings" className="w-full">
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
