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
