import { AuditLogsTable } from "@/components/ui/admin/audit/audit-logs-table"

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lịch sử thay đổi</h1>
        <p className="text-gray-600">
          Xem tất cả các thay đổi đã được thực hiện trong hệ thống
        </p>
      </div>

      <AuditLogsTable />
    </div>
  )
}

