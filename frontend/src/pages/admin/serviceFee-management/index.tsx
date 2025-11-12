"use client";

import React from "react";
import { ServiceFeeManagementTable } from "@/components/ui/admin/serviceFee/serviceFee-management-table";

export default function ServiceFeeManagementPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý cấu hình phí dịch vụ
        </h2>
        <p className="text-gray-600">
          Quản lý và cấu hình phí dịch vụ suất cho hệ thống
        </p>
      </div>

      <div className="mt-8">
        <ServiceFeeManagementTable />
      </div>
    </div>
  );
}

