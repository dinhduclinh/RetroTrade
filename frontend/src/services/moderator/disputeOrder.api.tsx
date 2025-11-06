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
  evidence?: string[];
  type: "dispute";
  status: "Pending" | "Reviewed" | "Resolved" | "Rejected";
  resolution?: {
    decision: string;
    notes?: string;
    refundAmount: number;
  };
  handledBy?: { _id: string; fullName: string };
  handledAt?: string;
  createdAt: string;
}


export interface CreateDisputeRequest {
  orderId: string;
  reason: string;
  description?: string;
  evidenceFiles?: File[];
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

export const createDispute = async (
  payload: CreateDisputeRequest
): Promise<ApiResponse<Dispute>> => {
  const formData = new FormData();

  formData.append("orderId", payload.orderId);
  formData.append("reason", payload.reason);
  if (payload.description?.trim()) {
    formData.append("description", payload.description.trim());
  }

  if (payload.evidenceFiles && payload.evidenceFiles.length > 0) {
    if (payload.evidenceFiles.length > 5) {
      throw new Error("Chỉ được upload tối đa 5 ảnh bằng chứng.");
    }

    payload.evidenceFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File "${file.name}" quá lớn. Tối đa 10MB.`);
      }
      formData.append("evidence", file);
    });
  }

  const response = await api.post("/dispute", formData);
  return await parseResponse<Dispute>(response);
};

// Các hàm khác giữ nguyên
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

export const getDisputeById = async (
  id: string
): Promise<ApiResponse<Dispute>> => {
  const response = await api.get(`/dispute/${id}`);
  return await parseResponse(response);
};

export const resolveDispute = async (
  id: string,
  payload: { decision: string; notes?: string; refundAmount?: number }
): Promise<ApiResponse<Dispute>> => {
  const response = await api.post(`/dispute/${id}/resolve`, payload);
  return await parseResponse(response);
};
