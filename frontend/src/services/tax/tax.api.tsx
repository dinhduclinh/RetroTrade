import api from "../customizeAPI";

export interface TaxSetting {
  _id: string;
  taxRate: number;
  description?: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  history?: Array<{
    taxRate: number;
    description?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    changedAt: string;
    changedBy?: {
      _id: string;
      fullName: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRequest {
  taxRate: number;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateTaxRequest {
  taxRate?: number;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface TaxApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Helper function to parse response
const parseResponse = async <T>(
  response: Response
): Promise<TaxApiResponse<T>> => {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      const text = await response.text();
      return {
        success: false,
        message: text || "Unexpected response format",
        data: undefined,
      };
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    return {
      success: false,
      message: "Failed to parse response",
      data: undefined,
    };
  }
};

// Get current tax setting (public)
export const getCurrentTax = async (): Promise<
  TaxApiResponse<{
    taxRate: number;
    description?: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo?: string;
    createdAt: string;
    updatedAt: string;
  }>
> => {
  const response = await api.get("/tax/current");
  return await parseResponse(response);
};

// Get all tax settings (admin only)
export const getAllTaxSettings = async (
  page: number = 1,
  limit: number = 20,
  includeInactive: boolean = false
): Promise<TaxApiResponse<TaxSetting[]>> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(includeInactive && { includeInactive: "true" }),
  });
  const response = await api.get(`/tax?${queryParams}`);
  return await parseResponse(response);
};

// Create new tax setting (admin only)
export const createTaxSetting = async (
  payload: CreateTaxRequest
): Promise<TaxApiResponse<TaxSetting>> => {
  const response = await api.post("/tax", payload);
  return await parseResponse(response);
};

// Update tax setting (admin only)
export const updateTaxSetting = async (
  id: string,
  payload: UpdateTaxRequest
): Promise<TaxApiResponse<TaxSetting>> => {
  const response = await api.put(`/tax/${id}`, payload);
  return await parseResponse(response);
};

// Delete tax setting (admin only)
export const deleteTaxSetting = async (
  id: string
): Promise<TaxApiResponse<null>> => {
  const response = await api.delete(`/tax/${id}`);
  return await parseResponse(response);
};

// Get tax history (admin only)
export const getTaxHistory = async (
  id: string
): Promise<
  TaxApiResponse<{
    currentTax: {
      taxRate: number;
      description?: string;
      effectiveFrom: string;
      effectiveTo?: string;
    };
    history: Array<{
      taxRate: number;
      description?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
      changedAt: string;
      changedBy?: {
        _id: string;
        fullName: string;
        email: string;
      };
    }>;
  }>
> => {
  const response = await api.get(`/tax/${id}/history`);
  return await parseResponse(response);
};

// Get all tax history (admin only) - tất cả lịch sử của tất cả tax
export const getAllTaxHistory = async (): Promise<
  TaxApiResponse<{
    timeline: Array<{
      type: "create" | "update";
      taxId: string;
      taxRate: number;
      description?: string;
      effectiveFrom: string;
      effectiveTo?: string;
      isActive?: boolean;
      createdAt?: string;
      changedAt?: string;
      changedBy?: {
        _id: string;
        fullName: string;
        email: string;
      };
      taxInfo: {
        _id: string;
        taxRate: number;
        description?: string;
      };
    }>;
    totalEvents: number;
    totalTaxes: number;
  }>
> => {
  const response = await api.get("/tax/history/all");
  return await parseResponse(response);
};

// Activate tax setting (admin only)
export const activateTaxSetting = async (
  id: string
): Promise<TaxApiResponse<TaxSetting>> => {
  const response = await api.post(`/tax/${id}/activate`);
  return await parseResponse(response);
};

