import api from "../customizeAPI";
import type { ApiResponse } from "@iService";

export interface AuditLog {
  _id: string;
  TableName: string;
  PrimaryKeyValue: string;
  Operation: "INSERT" | "UPDATE" | "DELETE";
  ChangedByUserId?: {
    _id: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
  ChangedAt: string;
  ChangeSummary?: string;
}

export interface AuditLogFilters {
  tableName?: string;
  operation?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Get all audit logs (admin only)
export const getAllAuditLogs = async (
  filters: AuditLogFilters = {}
): Promise<ApiResponse<{ items: AuditLog[]; totalPages: number; totalItems: number }>> => {
  const queryParams = new URLSearchParams();
  
  if (filters.tableName && filters.tableName !== 'all') {
    queryParams.append('tableName', filters.tableName);
  }
  if (filters.operation && filters.operation !== 'all') {
    queryParams.append('operation', filters.operation);
  }
  if (filters.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters.page) {
    queryParams.append('page', filters.page.toString());
  }
  if (filters.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  const response = await api.get(`/audit?${queryParams}`);
  const data = await response.json();
  return data;
};

// Get audit logs for a specific entity
export const getAuditLogsByEntity = async (
  tableName: string,
  primaryKeyValue: string
): Promise<ApiResponse<AuditLog[]>> => {
  const response = await api.get(`/audit/${tableName}/${primaryKeyValue}`);
  const data = await response.json();
  return data;
};

