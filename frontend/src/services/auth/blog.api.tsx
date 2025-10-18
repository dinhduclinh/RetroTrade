import instance from "../customizeAPI";
import api from "../customizeAPI";

export const getAllPosts = async (page: number = 1, limit: number = 10) => {
  const res = await instance.get(`/post/posts?page=${page}&limit=${limit}`);
  return await res.json();
};

export const getBlogDetail = async (id: string) => {
  const res = await instance.get(`/post/posts/${id}`);
  return await res.json();
};

export const getAllCategories = async () => {
  const res = await instance.get(`/post/categories`);
  return await res.json();
};

export const getAllTags = async () => {
  const res = await instance.get(`/post/tags`);
  return await res.json();
};

export const getPostsByCategory = async (
  id: string,
  page: number = 1,
  limit: number = 6
) => {
  const res = await api.get(
    `/post/posts/category/${id}?page=${page}&limit=${limit}`
  );
  return await res.json();
};


export const getPostsByTag = async (
  id: string,
  page: number = 1,
  limit: number = 6
) => {
  const res = await api.get(
    `/post/posts/tag/${id}?page=${page}&limit=${limit}`
  );
  return await res.json();
};