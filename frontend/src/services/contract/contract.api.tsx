import instance from "../customizeAPI";

export interface ContractTemplateData {
  templateName: string;
  description?: string;
  templateContent: string;
}

export interface UpdateContractTemplateData {
  templateName?: string;
  description?: string;
  templateContent?: string;
  isActive?: boolean;
}

export const createContractTemplate = async (templateData: ContractTemplateData): Promise<Response> => {
  return await instance.post("/contract/templates", templateData);
};

export const getContractTemplates = async (): Promise<Response> => {
  return await instance.get("/contract/templates");
};

export const getContractTemplateById = async (id: string): Promise<Response> => {
  return await instance.get(`/contract/templates/${id}`);
};

export const updateContractTemplate = async (id: string, templateData: UpdateContractTemplateData): Promise<Response> => {
  return await instance.put(`/contract/templates/${id}`, templateData);
};

export const deleteContractTemplate = async (id: string): Promise<Response> => {
  return await instance.delete(`/contract/templates/${id}`);
};