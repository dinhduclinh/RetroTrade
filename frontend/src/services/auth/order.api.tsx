import api from "../customizeAPI";
import type { ApiResponse } from "@iService";


export interface Address {
  fullName: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  phone: string;
}

export interface CreateOrderRequest {
  itemId: string;
  unitCount?: number;
  startAt: string;
  endAt: string;
  paymentMethod?: string;
  shippingAddress: Address;
  note?: string;
}

export interface Order {
  _id: string;
  orderGuid: string;
  renterId: {
    _id: string;
    fullName: string;
    email: string;
  };
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  itemId: {
    _id: string;
    Title: string;
    Images: string[];
  };
  itemSnapshot: {
    title: string;
    images: string[];
    basePrice: number;
    priceUnit: string;
  };
  unitCount: number;
  startAt: string;
  endAt: string;
  totalAmount: number;
  depositAmount?: number;
  serviceFee?: number;
  currency: string;
  rentalDuration?: number;
  rentalUnit?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    ward: string;
    district?: string;
    province: string;
    phone: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  isContractSigned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  cancelReason: String;
}



const parseResponse = async (response: Response): Promise<ApiResponse<any>> => {
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


export const createOrder = async (
  payload: CreateOrderRequest
): Promise<ApiResponse<{ orderGuid: string; orderId: string }>> => {
  const response = await api.post("/order/", payload);
  return await parseResponse(response);
};


export const getOrderDetails = async (
  orderId: string
): Promise<ApiResponse<Order>> => {
  const response = await api.get(`/order/${orderId}`);
  return await parseResponse(response);
};


export const listOrders = async (): Promise<ApiResponse<Order[]>> => {
  const response = await api.get(`/order`);
  return await parseResponse(response);
};


export const confirmOrder = async (
  orderId: string
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/order/${orderId}/confirm`);
  return await parseResponse(response);
};

export const startOrder = async (
  orderId: string
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/order/${orderId}/start`);
  return await parseResponse(response);
};

export const renterReturn = async (
  orderId: string,
  notes?: string
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/order/${orderId}/return`, { notes });
  return await parseResponse(response);
};


export const ownerComplete = async (
  orderId: string,
  payload: { conditionStatus?: string; damageFee?: number; ownerNotes?: string }
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/order/${orderId}/complete`, payload);
  return await parseResponse(response);
};


export const cancelOrder = async (
  orderId: string,
  reason?: string
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/order/${orderId}/cancel`, { reason });
  return await parseResponse(response);
};


export const disputeOrder = async (
  orderId: string,
  reason?: string
): Promise<ApiResponse<any>> => {
  const response = await api.post(`/order/${orderId}/dispute`, { reason });
  return await parseResponse(response);
};
