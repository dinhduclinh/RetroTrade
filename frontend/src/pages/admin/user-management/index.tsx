"use client";

import React from "react";
import { UserManagementTable } from "@/components/ui/admin/user-management-table";

export default function UserManagementDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý người dùng
        </h2>
        <p className="text-gray-600">
          Theo dõi và quản lý tài khoản người dùng trong hệ thống
        </p>
      </div>

      <div className="mt-8">
        <UserManagementTable />
      </div>
    </div>
  );
}
