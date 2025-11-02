"use client";

import React from "react";
import { TaxManagementTable } from "@/components/ui/admin/tax/tax-management-table";

export default function TaxManagementPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý cấu hình thuế
        </h2>
        <p className="text-gray-600">
          Quản lý và cấu hình thuế suất cho hệ thống
        </p>
      </div>

      <div className="mt-8">
        <TaxManagementTable />
      </div>
    </div>
  );
}

