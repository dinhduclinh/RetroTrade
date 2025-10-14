import instance from "../customizeAPI";

export const getCategories = async (): Promise<Response> => {
  return await instance.get("/categories");};

export const addCategory = async (name: string,slug: string,description: string,parentCategoryId: string | null,isActive: boolean): Promise<Response> => {
  const data = {name: name,slug: slug,description: description,parentCategoryId: parentCategoryId,isActive: isActive,};
  return await instance.post("/categories", data);};


export const updateCategory = async (id: string,name: string,slug: string,description: string,parentCategoryId: string | null,isActive: boolean): Promise<Response> => {
  const data = {name: name,slug: slug,description: description,parentCategoryId: parentCategoryId,isActive: isActive,};
  return await instance.put(`/categories/${id}`, data);};


export const deleteCategory = async (id: string): Promise<Response> => {
  return await instance.delete(`/categories/${id}`);};


export const cascadeDeactivateCategory = async (id: string,isActive: boolean):Promise<Response> => {
  const data = {isActive: isActive,};return await instance.put(`/categories/cascade-deactivate/${id}`, data);};