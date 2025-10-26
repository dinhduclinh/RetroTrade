import api from '../customizeAPI';

export interface OwnerRequest {
  _id: string;
  user: {
    _id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
  };
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
  additionalInfo?: string;
  reviewedBy?: {
    _id: string;
    email: string;
    fullName: string;
  };
  reviewedAt?: string;
  rejectionReason?: string;
  notes?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateOwnerRequestRequest {
  reason: string;
  additionalInfo?: string;
}

export interface RejectOwnerRequestRequest {
  rejectionReason: string;
  notes?: string;
}

export interface ApproveOwnerRequestRequest {
  notes?: string;
}

export interface OwnerRequestStats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export const ownerRequestApi = {
  // User: Create a new owner request
  createOwnerRequest: async (data: CreateOwnerRequestRequest): Promise<OwnerRequest> => {
    const response = await api.post('/owner-requests', data);
    if (!response.ok) throw new Error('Failed to create owner request');
    
    const result = await response.json();
    return result.data;
  },

  // User: Get my requests
  getMyOwnerRequests: async (): Promise<OwnerRequest[]> => {
    const response = await api.get('/owner-requests/my-requests');
    if (!response.ok) throw new Error('Failed to fetch my requests');
    
    const result = await response.json();
    return result.data.items;
  },

  // User: Get single request by ID
  getOwnerRequestById: async (id: string): Promise<OwnerRequest> => {
    const response = await api.get(`/owner-requests/${id}`);
    if (!response.ok) throw new Error('Failed to fetch request');
    
    const result = await response.json();
    return result.data;
  },

  // User: Cancel own request
  cancelOwnerRequest: async (id: string): Promise<void> => {
    const response = await api.put(`/owner-requests/${id}/cancel`, {});
    if (!response.ok) throw new Error('Failed to cancel request');
  },

  // Moderator: Get all owner requests
  getAllOwnerRequests: async (params?: { limit?: number; skip?: number; status?: string }): Promise<{ items: OwnerRequest[]; totalItems: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await api.get(`/owner-requests?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch requests');
    
    const result = await response.json();
    return result.data;
  },

  // Moderator: Approve owner request
  approveOwnerRequest: async (id: string, data?: ApproveOwnerRequestRequest): Promise<OwnerRequest> => {
    const response = await api.put(`/owner-requests/${id}/approve`, data || {});
    if (!response.ok) throw new Error('Failed to approve request');
    
    const result = await response.json();
    return result.data;
  },

  // Moderator: Reject owner request
  rejectOwnerRequest: async (id: string, data: RejectOwnerRequestRequest): Promise<OwnerRequest> => {
    const response = await api.put(`/owner-requests/${id}/reject`, data);
    if (!response.ok) throw new Error('Failed to reject request');
    
    const result = await response.json();
    return result.data;
  },

  // Moderator: Get statistics
  getOwnerRequestStats: async (): Promise<OwnerRequestStats> => {
    const response = await api.get('/owner-requests/stats/overview');
    if (!response.ok) throw new Error('Failed to fetch stats');
    
    const result = await response.json();
    return result.data;
  },
};

