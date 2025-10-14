import instance from "../customizeAPI";
import type { UpdateProfileRequest, UpdateAvatarRequest, ChangePasswordRequest } from "@iService";

export const getUserProfile = async (): Promise<Response> => {
    return await instance.get("/user/profile");
};

export const updateUserProfile = async (payload: UpdateProfileRequest): Promise<Response> => {
    return await instance.put("/user/profile", payload);
};

export const updateUserAvatar = async (payload: UpdateAvatarRequest): Promise<Response> => {
    return await instance.put("/user/profile/avatar", payload);
};

export const changePassword = async (payload: ChangePasswordRequest): Promise<Response> => {
    return await instance.put("/user/profile/change-password", payload);
};

