import api from "../customizeAPI";
import type { UpdateProfileRequest, UpdateAvatarRequest, ChangePasswordRequest, UserProfile, ApiResponse, ProfileApiResponse } from "@iService";

// Helper function to parse response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseResponse = async (response: Response): Promise<ApiResponse<any>> => {
    try {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            // If not JSON, return error response
            const text = await response.text();
            return {
                code: response.status,
                message: text || 'Unexpected response format',
                data: undefined
            };
        }
    } catch (error) {
        console.error('Error parsing response:', error);
        return {
            code: response.status || 500,
            message: 'Failed to parse response',
            data: undefined
        };
    }
};

// Helper function to parse profile response specifically
const parseProfileResponse = async (response: Response): Promise<ProfileApiResponse> => {
    try {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data as ProfileApiResponse;
        } else {
            // If not JSON, return error response
            const text = await response.text();
            return {
                code: response.status,
                message: text || 'Unexpected response format',
                data: undefined,
                user: undefined
            };
        }
    } catch (error) {
        console.error('Error parsing profile response:', error);
        return {
            code: response.status || 500,
            message: 'Failed to parse response',
            data: undefined,
            user: undefined
        };
    }
};

// Profile APIs
export const getUserProfile = async (): Promise<ProfileApiResponse> => {
    const response = await api.get("/user/profile/me");
    return await parseProfileResponse(response);
};

export const updateUserProfile = async (payload: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    const response = await api.put("/user/profile", payload);
    return await parseResponse(response);
};

// Upload avatar file
export const uploadUserAvatar = async (file: File): Promise<ApiResponse<UserProfile>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post("/auth/profile/avatar", formData);
    return await parseResponse(response);
};

// Update avatar with URL
export const updateUserAvatar = async (payload: UpdateAvatarRequest): Promise<ApiResponse<UserProfile>> => {
    const response = await api.post("/auth/profile/avatar", payload);
    return await parseResponse(response);
};

export const changePassword = async (payload: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    const response = await api.put("/user/profile/change-password", payload);
    return await parseResponse(response);
};

// User Management APIs
export const getAllUsers = async (page: number = 1, limit: number = 10): Promise<ApiResponse<{ items: UserProfile[], totalPages: number, totalItems: number }>> => {
    const response = await api.get(`/user?page=${page}&limit=${limit}`);
    return await parseResponse(response);
};

export const getUserById = async (id: string): Promise<ApiResponse<UserProfile>> => {
    const response = await api.get(`/user/${id}`);
    return await parseResponse(response);
};

export const createUser = async (payload: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    const response = await api.post("/user", payload);
    return await parseResponse(response);
};

export const updateUser = async (id: string, payload: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    const response = await api.put(`/user/${id}`, payload);
    return await parseResponse(response);
};

export const deleteUser = async (id: string): Promise<ApiResponse<UserProfile>> => {
    const response = await api.delete(`/user/${id}`);
    return await parseResponse(response);
};

export const updateUserRole = async (id: string, role: string): Promise<ApiResponse<UserProfile>> => {
    const response = await api.put("/user/role/update", { id, role });
    return await parseResponse(response);
};

