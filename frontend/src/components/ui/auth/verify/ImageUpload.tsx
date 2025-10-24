import { Button } from "../../common/button";
import { Input } from "../../common/input";
import { useState } from "react";
import { Upload, X, Camera, CreditCard, CheckCircle, AlertCircle, Image as ImageIcon, Shield, User } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  images: File[];
  setImages: (files: File[]) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

interface ImagePreview {
  file: File;
  preview: string;
}

export default function ImageUpload({ images, setImages, onNext, onBack, isLoading = false }: ImageUploadProps) {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [errors, setErrors] = useState<string[]>(['', '', '']);
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState<boolean>(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const imageTypes = [
    { 
      id: 0, 
      label: "Ảnh cá nhân", 
      description: "Ảnh chân dung rõ nét, nhìn thẳng",
      icon: Camera,
      required: true
    },
    { 
      id: 1, 
      label: "Mặt trước CCCD", 
      description: "Ảnh mặt trước căn cước công dân",
      icon: CreditCard,
      required: true
    },
    { 
      id: 2, 
      label: "Mặt sau CCCD", 
      description: "Ảnh mặt sau căn cước công dân",
      icon: CreditCard,
      required: true
    }
  ];

  const validateImage = (file: File): string => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return "Chỉ chấp nhận file JPG, JPEG, PNG";
    }
    if (file.size > maxSize) {
      return "Kích thước file không được vượt quá 5MB";
    }
    return "";
  };

  const processFile = (file: File, index: number) => {
    const error = validateImage(file);
    const newErrors = [...errors];
    newErrors[index] = error;
    setErrors(newErrors);

    if (error) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      
      // Update images array
      const newImages = [...images];
      newImages[index] = file;
      setImages(newImages);

      // Update previews
      setImagePreviews(prev => {
        const newPreviews = [...prev];
        newPreviews[index] = { file, preview };
        return newPreviews;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file, index);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processFile(imageFile, index);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = undefined as unknown as File;
    setImages(newImages);

    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews[index] = undefined as unknown as ImagePreview;
      return newPreviews;
    });

    const newErrors = [...errors];
    newErrors[index] = "";
    setErrors(newErrors);

    // Reset file input
    const input = document.getElementById(`file-input-${index}`) as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleSubmit = () => {
    const hasErrors = errors.some(error => error !== "");
    const hasAllImages = images.length === 3 && images.every(img => img);
    
    if (hasErrors) {
      return;
    }
    
    if (!hasAllImages) {
      const newErrors = errors.map((error, index) => 
        !images[index] ? "Vui lòng tải lên ảnh này" : error
      );
      setErrors(newErrors);
      return;
    }

    if (!isPrivacyAccepted) {
      alert("Vui lòng chấp nhận chia sẻ thông tin cá nhân để tiếp tục");
      return;
    }

    onNext();
  };

  const allImagesUploaded = images.length === 3 && images.every(img => img);

  return (
    <div className="space-y-6">
      {/* Guidelines Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ImageIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-800">Hướng dẫn tải ảnh xác minh</h4>
            
            {/* Ảnh cá nhân */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-purple-800">Ảnh cá nhân</span>
              </div>
              <div className="space-y-1 text-sm text-purple-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Chụp rõ khuôn mặt, chỉ nguyên khuôn mặt</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Nhìn thẳng camera, không đeo kính râm</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span>Không chụp toàn thân, chỉ tập trung vào khuôn mặt</span>
                </div>
              </div>
            </div>

            {/* Ảnh CCCD */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-green-600" />
                <span className="font-medium text-purple-800">Ảnh căn cước công dân</span>
              </div>
              <div className="space-y-1 text-sm text-purple-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Chụp rõ nét, không bị mờ thông tin</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Đầy đủ thông tin, không bị che khuất</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Định dạng: JPG, JPEG, PNG (tối đa 5MB)</span>
                </div>
              </div>
            </div>

            {/* Drag & Drop tip */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-purple-800">Cách tải ảnh</span>
              </div>
              <div className="space-y-1 text-sm text-purple-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Kéo thả ảnh trực tiếp vào vùng upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Hoặc nhấp "Chọn ảnh" để duyệt file</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Tải lên ảnh xác minh <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Vui lòng tải lên đầy đủ 3 ảnh để hoàn tất quá trình xác minh
        </p>
      </div>

      <div className="space-y-4">
        {/* Ảnh cá nhân - Full width */}
        {imageTypes.slice(0, 1).map((imageType, index) => {
          const IconComponent = imageType.icon;
          const preview = imagePreviews[index];
          const error = errors[index];

          return (
            <div key={index} className={`border rounded-lg p-4 ${
              preview ? 'border-green-300 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <IconComponent className={`w-5 h-5 ${preview ? 'text-green-600' : 'text-blue-600'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">{imageType.label}</h4>
                    {preview && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <p className="text-sm text-gray-600">{imageType.description}</p>
                </div>
              </div>

              {preview ? (
                <div className="relative">
                  <Image
                    src={preview.preview}
                    alt={imageType.label}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    dragOverIndex === index 
                      ? 'border-blue-500 bg-blue-50 scale-105' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${
                    dragOverIndex === index ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm mb-2 ${
                    dragOverIndex === index ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}>
                    {dragOverIndex === index 
                      ? `Thả ảnh vào đây để tải lên ${imageType.label.toLowerCase()}`
                      : `Kéo thả hoặc nhấp để tải lên ${imageType.label.toLowerCase()}`
                    }
                  </p>
                  <Input
                    id={`file-input-${index}`}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, index)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`file-input-${index}`)?.click()}
                    className={dragOverIndex === index ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}
                  >
                    Chọn ảnh
                  </Button>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          );
        })}

        {/* 2 ảnh CCCD - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {imageTypes.slice(1, 3).map((imageType, index) => {
            const actualIndex = index + 1; // Adjust index for CCCD images
            const IconComponent = imageType.icon;
            const preview = imagePreviews[actualIndex];
            const error = errors[actualIndex];

            return (
              <div key={actualIndex} className={`border rounded-lg p-4 ${
                preview ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <IconComponent className={`w-5 h-5 ${preview ? 'text-green-600' : 'text-blue-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">{imageType.label}</h4>
                      {preview && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-600">{imageType.description}</p>
                  </div>
                </div>

                {preview ? (
                  <div className="relative">
                    <Image
                      src={preview.preview}
                      alt={imageType.label}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(actualIndex)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                      dragOverIndex === actualIndex 
                        ? 'border-blue-500 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={(e) => handleDragOver(e, actualIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                  >
                    <Upload className={`w-6 h-6 mx-auto mb-2 ${
                      dragOverIndex === actualIndex ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-xs mb-2 ${
                      dragOverIndex === actualIndex ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {dragOverIndex === actualIndex 
                        ? `Thả ảnh vào đây`
                        : `Kéo thả hoặc nhấp để tải lên`
                      }
                    </p>
                    <Input
                      id={`file-input-${actualIndex}`}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, actualIndex)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`file-input-${actualIndex}`)?.click()}
                      className={`text-xs ${
                        dragOverIndex === actualIndex ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                      }`}
                    >
                      Chọn ảnh
                    </Button>
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-xs mt-2">{error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Consent */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-800">Xác nhận chia sẻ thông tin cá nhân</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <p>Tôi xác nhận và đồng ý:</p>
              <ul className="space-y-1 ml-4">
                <li>• Chia sẻ thông tin cá nhân từ ảnh CCCD cho mục đích xác minh danh tính</li>
                <li>• Hệ thống sử dụng ảnh cá nhân để đối chiếu với CCCD</li>
                <li>• Thông tin được bảo mật và chỉ sử dụng cho mục đích xác minh</li>
                <li>• Có thể từ chối chia sẻ thông tin bất cứ lúc nào</li>
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="privacy-consent"
                checked={isPrivacyAccepted}
                onChange={(e) => setIsPrivacyAccepted(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="privacy-consent" className="text-sm font-medium text-blue-800">
                Tôi đồng ý chia sẻ thông tin cá nhân cho hệ thống xác minh danh tính
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="w-1/2"
          >
            Quay lại
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allImagesUploaded || !isPrivacyAccepted || isLoading}
            className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              "Hoàn tất xác minh"
            )}
          </Button>
        </div>
        
        {!allImagesUploaded && (
          <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <p className="text-orange-600 text-sm font-medium">Vui lòng tải lên đầy đủ 3 ảnh để tiếp tục</p>
          </div>
        )}
        
        {allImagesUploaded && !isPrivacyAccepted && (
          <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-yellow-600 text-sm font-medium">Vui lòng chấp nhận chia sẻ thông tin cá nhân để tiếp tục</p>
          </div>
        )}
        
        {allImagesUploaded && isPrivacyAccepted && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-green-600 text-sm font-medium">Đã tải lên đầy đủ 3 ảnh và chấp nhận chia sẻ thông tin. Sẵn sàng để xác minh!</p>
          </div>
        )}
      </div>
    </div>
  );
}