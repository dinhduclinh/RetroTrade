import instance from "../customizeAPI";

//owner
export const getUserAddresses = async (): Promise<Response> => {
  return await instance.get("/products/user/addresses");
};

export const getProductsByCategoryId = async (
  categoryId: string,
  params?: { page?: number; limit?: number }
) => {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    const res = await instance.get(`/products/product/category/${categoryId}${qs ? `?${qs}` : ""}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return { data: { items: [], total: 0 } } as any;
  }
};
export const setDefaultAddress = (addressData: {Address: string;City: string;District: string;}) => {
  return instance.post("/products/addresses/default", addressData);
};
export const addProduct = async (productData: any): Promise<Response> => {
  return await instance.post("/products/user/add", productData);
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
  return await instance.get(`/products/user/${id}`);
};

export const updateProduct = async (id: string,productData: any): Promise<Response> => {
  return await instance.put(`/products/user/${id}`, productData);
};

export const deleteProduct = async (id: string): Promise<Response> => {
  return await instance.delete(`/products/user/${id}`);
};

//moderator
export const getPendingProducts = async (): Promise<Response> => {
  return await instance.get("/products/pending"); 
};

export const getPendingProductDetails = async (id: string): Promise<Response> => {
  return await instance.get(`/products/pending/${id}`);
};

export const approveProduct = async (id: string): Promise<Response> => {
  return await instance.put(`/products/pending/${id}/approve`);
};

export const rejectProduct = async (id: string, reason?: string): Promise<Response> => {
  return await instance.put(`/products/pending/${id}/reject`, { reason });
};

export const getTopProductsForHighlight = async (): Promise<Response> => {
  return await instance.get("/products/top-for-highlight");
};

export const toggleProductHighlight = async (id: string, isHighlighted?: boolean): Promise<Response> => {
  const body = isHighlighted !== undefined ? { isHighlighted } : {};
  return await instance.put(`/products/approve/${id}/highlight`, body);
};

//product public

export const addToFavorites = async (productId: string): Promise<Response> => {
  return await instance.post(`/products/${productId}/favorite`);
};

export const removeFromFavorites = async (
  productId: string
): Promise<Response> => {
  return await instance.delete(`/products/${productId}/favorite`);
};

export const getFavorites = async (): Promise<Response> => {
  return await instance.get("/products/favorites");
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
