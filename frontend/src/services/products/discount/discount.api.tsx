import api from "../../customizeAPI";

export type Discount = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  startAt: string;
  endAt: string;
  usageLimit?: number;
  usedCount?: number;
  ownerId?: string;
  itemId?: string;
  active: boolean;
  isPublic?: boolean;
  allowedUsers?: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscountRequest = {
  type: "percent" | "fixed";
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  startAt: string;
  endAt: string;
  usageLimit?: number;
  ownerId?: string;
  itemId?: string;
  notes?: string;
  codeLength?: number;
  codePrefix?: string;
};

type ApiListResponse<T> = {
  status: "success" | "error";
  message: string;
  data?: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
};

type ApiSingleResponse<T> = {
  status: "success" | "error";
  message: string;
  data?: T;
};

export async function listDiscounts(page = 1, limit = 20) {
  const res = await api.get(`/discounts?page=${page}&limit=${limit}`);
  const json: ApiListResponse<Discount> = await res.json();
  return json;
}

export async function createDiscount(payload: CreateDiscountRequest) {
  const res = await api.post(`/discounts`, payload);
  const json: ApiSingleResponse<Discount> = await res.json();
  return json;
}

export async function getDiscountByCode(code: string) {
  const res = await api.get(`/discounts/${encodeURIComponent(code)}`);
  const json: ApiSingleResponse<Discount> = await res.json();
  return json;
}

export async function deactivateDiscount(id: string) {
  const res = await api.post(`/discounts/${id}/deactivate`);
  const json: ApiSingleResponse<Discount> = await res.json();
  return json;
}

export async function activateDiscount(id: string) {
  const res = await api.post(`/discounts/${id}/activate`);
  const json: ApiSingleResponse<Discount> = await res.json();
  return json;
}

export async function assignUsersToDiscount(
  id: string,
  payload: { userIds: string[]; perUserLimit?: number; effectiveFrom?: string; effectiveTo?: string }
) {
  const res = await api.post(`/discounts/${id}/assign-users`, payload);
  const json: ApiSingleResponse<Discount> = await res.json();
  return json;
}

export async function setDiscountPublic(id: string) {
  const res = await api.post(`/discounts/${id}/set-public`);
  const json: ApiSingleResponse<Discount> = await res.json();
  return json;
}

// User-facing APIs
export async function listAvailableDiscounts(page = 1, limit = 20, ownerId?: string, itemId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (ownerId) params.set("ownerId", ownerId);
  if (itemId) params.set("itemId", itemId);
  const res = await api.get(`/discounts/public/available?${params.toString()}`);
  const json: ApiListResponse<Discount> = await res.json();
  return json;
}

export async function validateDiscount(payload: { code: string; baseAmount: number; ownerId?: string; itemId?: string }) {
  const res = await api.post(`/discounts/validate`, payload);
  const json: { status: "success" | "error"; message: string; data?: { amount: number; discount: Discount } } = await res.json();
  return json;
}


