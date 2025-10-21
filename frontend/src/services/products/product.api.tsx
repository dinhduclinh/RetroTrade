import instance from "../customizeAPI";

export const addProduct = async (productData: any): Promise<Response> => {
  return await instance.post("/products/add", productData);
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
