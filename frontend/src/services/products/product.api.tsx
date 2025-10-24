import instance from "../customizeAPI";
import api from "../customizeAPI";

export const addProduct = async (productData: any): Promise<Response> => {
  return await instance.post("/products/add", productData);
};

export const getTopViewedItemsByOwner = async (ownerId: string, limit: number = 4) => {
  try {
    const res = await instance.get(`/products/owner/${ownerId}/top-viewed?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching top viewed items by owner:", error);
    return { data: { items: [], total: 0 } } as any;
  }
};

export const uploadImages = async (formData: FormData): Promise<Response> => {
  return await instance.post("/products/upload", formData);
};

export const getConditions = async (): Promise<Response> => {
  return await instance.get("/conditions");
};

export const getPriceUnits = async (): Promise<Response> => {
  return await instance.get("/price-units");
};

export const getUserProducts = async (): Promise<Response> => {
  return await instance.get("/products/user");
};

export const getProductById = async (id: string): Promise<Response> => {
  return await instance.get(`/products/${id}`);
};

export const updateProduct = async (id: string,productData: any): Promise<Response> => {
  return await instance.put(`/products/${id}`, productData);
};

export const deleteProduct = async (id: string): Promise<Response> => {
  return await instance.delete(`/products/${id}`);
};


//product public
export const getAllItems = async () => {
  try {
    const res = await instance.get(`/products/product/public`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching all items:", error);
    throw error;
  }
};

export const getFeaturedItems = async (params?: { page?: number; limit?: number }) => {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    const res = await instance.get(`/products/product/featured${qs ? `?${qs}` : ""}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching featured items:", error);
    throw error;
  }
};

export const getSearchTags = async () => {
  try {
    const res = await instance.get(`/products/product/tags`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching search tags:", error);
    return { data: { tags: [], total: 0 } } as any;
  }
};

export const getPublicItemById = async (id: string) => {
  try {
    const res = await instance.get(`/products/product/${id}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching item detail:", error);
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const res = await instance.get(`/categories`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching all categories:", error);
    // Fallback to empty array if categories endpoint not ready
    return { data: [] };
  }
};
