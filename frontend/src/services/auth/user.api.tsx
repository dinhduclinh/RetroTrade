import instance from "../customizeAPI";

export const getUserProfile = async (): Promise<Response> => {
    return await instance.get("/user/profile");
};

