import React, { useState } from "react";
import Link from "next/link";
import { Crown, Users, Package, BarChart3, Settings, Home, Wallet } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState("");

  const menus = [
    { icon: Home, label: "Trang chủ", key: "home", href: "/home" },
    { icon: Users, label: "Người dùng", key: "users", href: "/admin/users" },
    { icon: Package, label: "Sản phẩm", key: "products", href: "/admin/products" },
    { icon: Wallet, label: "Quản lý ví", key: "wallet", href: "/admin/wallet" },
    { icon: BarChart3, label: "Thống kê", key: "analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Cài đặt", key: "settings", href: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 p-6 flex flex-col fixed h-full">
        <div className="flex items-center gap-2 mb-10">
          <Crown className="w-7 h-7 text-yellow-500" />
          <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
        </div>

        <nav className="flex flex-col gap-1 text-gray-700">
          {menus.map(({ icon: Icon, label, href, key }) => (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                activePage === key
                  ? "bg-indigo-100 text-indigo-600 font-medium"
                  : "hover:bg-indigo-50 hover:text-indigo-600"
              }`}
              onClick={() => setActivePage(key)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 text-xs text-gray-500">
          © {new Date().getFullYear()} Admin Panel
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
