import instance from "../customizeAPI";
import type { ApiResponse } from "@iService";

interface SubmitComplaintRequest {
  email: string;
  subject?: string;
  message: string;
}

interface ComplaintResponse {
  complaintId: string;
  status: string;
}

// Submit complaint about locked account
export const submitComplaint = async (
  payload: SubmitComplaintRequest
): Promise<ApiResponse<ComplaintResponse>> => {
  try {
    const response = await instance.post("/auth/complaint", payload);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error submitting complaint:", error);
    throw error;
  }
};

