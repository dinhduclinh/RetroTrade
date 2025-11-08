import api from '../customizeAPI';

export interface FaceVerificationRequest {
  images: File[]; // Array of files (user image, front ID card, back ID card)
}

export interface ExtractedIdCardInfo {
  idNumber?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
}

export interface FaceVerificationResponse {
  code: number;
  message: string;
  data: {
    isMatch: boolean;
    similarityPercentage: number;
    distance: number;
    threshold: number;
    userFacesDetected: number;
    idCardFacesDetected: number;
    extractedIdCardInfo?: ExtractedIdCardInfo | null;
    uploadedFiles?: Array<{
      Url: string;
      IsPrimary: boolean;
      Ordinal: number;
      AltText: string;
    }>;
    userId?: string;
    idCardInfo?: {
      idNumber?: string;
      fullName?: string;
      dateOfBirth?: string;
      address?: string;
      extractionMethod?: string;
    };
  };
}

export const faceVerificationAPI = {
  /**
   * Verify face images using face-api.js
   * @param images Array of files (user image, front ID card, back ID card)
   * @returns Promise<FaceVerificationResponse>
   */
  verifyFaceImages: async (
    images: File[]
  ): Promise<FaceVerificationResponse> => {
    try {
      console.log('Starting face verification:', {
        imagesCount: images.length,
        imageSizes: images.map(img => ({ name: img.name, size: img.size, type: img.type }))
      });

      // Create FormData to send files only (no phone number)
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });

      console.log('Sending request to:', '/auth/verify-face');
      const response = await api.post('/auth/verify-face', formData);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Parse response regardless of status code
      const data = await response.json();
      
      // If response is not ok but has data with extractedIdCardInfo, return it
      // This allows user to review OCR info even if face verification fails
      if (!response.ok) {
        // If we have extracted ID card info, return it so user can review
        if (data?.data?.extractedIdCardInfo) {
          console.log('Face verification failed but OCR extracted info:', data.data.extractedIdCardInfo);
          return data; // Return the response so user can review OCR info
        }
        
        // Otherwise, throw error as before
        let errorMessage = data.message || data.error || 'Face verification failed';
        console.error('Face verification error details:', data);
        
        // Provide more specific and helpful error messages
        if (response.status === 400) {
          if (errorMessage.includes('Không tìm thấy khuôn mặt')) {
            errorMessage = '⚠️ Hệ thống không phát hiện được khuôn mặt.\n\nGợi ý:\n• Đảm bảo ảnh rõ nét, đủ ánh sáng\n• Khuôn mặt nhìn thẳng vào camera\n• Ảnh CCCD phải chụp cận và rõ\n• Không che khuôn mặt (kính râm, khẩu trang)\n• Thử chụp lại với ảnh chất lượng cao hơn';
          } else if (errorMessage.includes('Thiếu hình ảnh')) {
            errorMessage = 'Vui lòng tải lên đầy đủ ảnh cá nhân và CCCD.';
          } else if (errorMessage.includes('Số điện thoại')) {
            errorMessage = 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.';
          }
        } else if (response.status === 500) {
          errorMessage = 'Lỗi hệ thống xác minh. Vui lòng thử lại sau.';
        }
        throw new Error(errorMessage);
      }

      console.log('Success response:', data);
      return data;
    } catch (error) {
      console.error('Face verification API error:', error);
      throw error;
    }
  }
};

export default faceVerificationAPI;
