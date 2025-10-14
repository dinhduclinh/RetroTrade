import instance from "../customizeAPI";

export const getAllPosts = async (): Promise<Response> => {
  return await instance.get("/post/posts");
};

export const getBlogDetail = async (id: string): Promise<Response> => {
  return await instance.get(`/post/posts/${id}`);
};

export const getAllCategories = async (): Promise<Response> => {
  return await instance.get(`/post/categories`);
};
export const getAllTags = async (): Promise<Response> => {
  return await instance.get(`/post/tags`);
};

