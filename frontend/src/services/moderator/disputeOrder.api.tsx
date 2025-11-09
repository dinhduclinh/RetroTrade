
import api from "@/services/customizeAPI";
import type { ApiResponse } from "@iService";


export interface Dispute {
  _id: string;
  orderId:
    | string
    | {
        _id: string;
        orderGuid: string;
        orderStatus: string;
      };
  reporterId: { _id: string; fullName: string; email: string };
  reportedUserId: { _id: string; fullName: string; email: string };
  reason: string;
  description?: string;
  evidenceUrls?: string[];
  evidence?: string[];
  type: "dispute";
  status: "Pending" | "In Progress" | "Reviewed" | "Resolved" | "Rejected";
  resolution?: {
    decision: string;
    notes?: string;
    refundAmount: number;
  };
  assignedBy?: { _id: string; fullName: string; email: string };
  assignedAt?: string;
  handledBy?: { _id: string; fullName: string };
  handledAt?: string;
  createdAt: string;
}


export interface CreateDisputeRequest {
  orderId: string;
  reason: string;
  description?: string;
  evidenceUrls?: string[];
}

const parseResponse = async <T,>(
  response: Response
): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    code: response.status,
    message: data?.message || "Request completed",
    data: data?.data || data,
  };
};

// TẠO TRANH CHẤP (dùng DisputeController)
export const createDispute = async (
  payload: CreateDisputeRequest
): Promise<ApiResponse<Dispute>> => {
  const response = await api.post("/dispute", payload);
  return await parseResponse(response);
};

// LẤY DANH SÁCH TRANH CHẤP (của owner hoặc admin)
export const getDisputes = async (params?: {
  status?: string;
  orderId?: string;
}): Promise<ApiResponse<Dispute[]>> => {
  const query = new URLSearchParams(
    Object.entries(params || {}).reduce((acc, [k, v]) => {
      if (v) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const response = await api.get(`/dispute${query ? `?${query}` : ""}`);
  return await parseResponse(response);
};

// LẤY DANH SÁCH TRANH CHẤP CỦA USER HIỆN TẠI
export const getMyDisputes = async (params?: {
  status?: string;
}): Promise<ApiResponse<Dispute[]>> => {
  const query = new URLSearchParams(
    Object.entries(params || {}).reduce((acc, [k, v]) => {
      if (v) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const response = await api.get(`/dispute/my${query ? `?${query}` : ""}`);
  return await parseResponse(response);
};

// LẤY CHI TIẾT TRANH CHẤP
export const getDisputeById = async (
  id: string
): Promise<ApiResponse<Dispute>> => {
  const response = await api.get(`/dispute/${id}`);
  return await parseResponse(response);
};

// NHẬN TRANH CHẤP (assign)
export const assignDispute = async (
  id: string
): Promise<ApiResponse<Dispute>> => {
  const response = await api.post(`/dispute/${id}/assign`);
  return await parseResponse(response);
};

// TRẢ LẠI TRANH CHẤP (unassign)
export const unassignDispute = async (
  id: string,
  reason?: string
): Promise<ApiResponse<Dispute>> => {
  const response = await api.post(`/dispute/${id}/unassign`, { reason });
  return await parseResponse(response);
};

// XỬ LÝ TRANH CHẤP (resolve)
export const resolveDispute = async (
  id: string,
  payload: { decision: string; notes?: string; refundAmount?: number }
): Promise<ApiResponse<Dispute>> => {
  const response = await api.put(`/dispute/${id}/resolve`, payload);
  return await parseResponse(response);
};
