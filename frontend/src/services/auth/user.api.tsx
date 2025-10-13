import instance from "../customizeAPI";

export const getUserProfile = async (): Promise<Response> => {
    return await instance.get("/user/profile");
};

export const updateUserProfile = async (
    payload: { fullName?: string; displayName?: string; bio?: string; phone?: string | null }
): Promise<Response> => {
    return await instance.put("/user/profile", payload);
};

