import api from '../customizeAPI';

export interface FaceVerificationRequest {
  images: File[]; // Array of files (user image and ID card image)
  phoneNumber: string; // Phone number for verification
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
    uploadedFiles?: Array<{
      Url: string;
      IsPrimary: boolean;
      Ordinal: number;
      AltText: string;
    }>;
    userId?: string;
    phoneConfirmed?: boolean;
  };
}

export const faceVerificationAPI = {
  /**
   * Verify face images using face-api.js
   * @param images Array of files (user image and ID card image)
   * @param phoneNumber Phone number for verification
   * @returns Promise<FaceVerificationResponse>
   */
  verifyFaceImages: async (
    images: File[],
    phoneNumber: string
  ): Promise<FaceVerificationResponse> => {
    try {
      console.log('Starting face verification:', {
        imagesCount: images.length,
        phoneNumber: phoneNumber,
        imageSizes: images.map(img => ({ name: img.name, size: img.size, type: img.type }))
      });

      // Create FormData to send files and phone number
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });
      formData.append('phoneNumber', phoneNumber);

      console.log('Sending request to:', '/auth/verify-face');
      const response = await api.post('/auth/verify-face', formData);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Face verification failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Face verification error details:', errorData);
          
          // Provide more specific error messages
          if (response.status === 400) {
            if (errorMessage.includes('Không tìm thấy khuôn mặt')) {
              errorMessage = 'Không tìm thấy khuôn mặt trong ảnh. Vui lòng chụp lại ảnh rõ nét hơn.';
            } else if (errorMessage.includes('Thiếu hình ảnh')) {
              errorMessage = 'Vui lòng tải lên đầy đủ ảnh cá nhân và CCCD.';
            } else if (errorMessage.includes('Số điện thoại')) {
              errorMessage = 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.';
            }
          } else if (response.status === 500) {
            errorMessage = 'Lỗi hệ thống xác minh. Vui lòng thử lại sau.';
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Lỗi server: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Success response:', data);
      return data;
    } catch (error) {
      console.error('Face verification API error:', error);
      throw error;
    }
  }
};

export default faceVerificationAPI;
