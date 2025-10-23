import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../common/button";

interface ResultDisplayProps {
  result: { success: boolean; message: string; details?: string } | null;
  onRestart?: () => void;
  onRetryStep?: (stepNumber: number) => void;
  failedStep?: number | null;
}

export default function ResultDisplay({ 
  result, 
  onRestart, 
  onRetryStep, 
  failedStep 
}: ResultDisplayProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };
  if (!result) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Đang xử lý...</h3>
        <p className="text-sm text-gray-600">
          Vui lòng chờ trong giây lát, chúng tôi đang xác minh thông tin của bạn
        </p>
      </div>
    );
  }

  const isSuccess = result.success;
  const IconComponent = isSuccess ? CheckCircle : XCircle;
  const iconColor = isSuccess ? "text-green-600" : "text-red-600";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";

  return (
    <div className="text-center py-6">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${bgColor} ${borderColor} border-2 mb-4`}>
        <IconComponent className={`w-8 h-8 ${iconColor}`} />
      </div>

      <h3 className={`text-xl font-semibold mb-2 ${isSuccess ? "text-green-700" : "text-red-700"}`}>
        {result.message}
      </h3>

      {result.details && (
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
          {result.details}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {isSuccess ? (
          <>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Xác minh thành công</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Tài khoản đã được kích hoạt</span>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Bạn có thể sử dụng đầy đủ các tính năng của ứng dụng
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              <span>Xác minh thất bại</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Thông tin không khớp hoặc không rõ nét</span>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Vui lòng kiểm tra lại thông tin và thử lại
            </p>
            
            {/* Show step-specific retry options */}
            {failedStep && onRetryStep && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Chọn bước để thử lại:</h4>
                <div className="space-y-2">
                  {failedStep === 1 && (
                    <Button
                      onClick={() => onRetryStep(1)}
                      variant="outline"
                      className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      🔄 Thử lại bước 1: Nhập số điện thoại
                    </Button>
                  )}
                  {failedStep === 2 && (
                    <>
                      <Button
                        onClick={() => onRetryStep(1)}
                        variant="outline"
                        className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        🔄 Thử lại bước 1: Nhập số điện thoại
                      </Button>
                      <Button
                        onClick={() => onRetryStep(2)}
                        variant="outline"
                        className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        🔄 Thử lại bước 2: Nhập mã OTP
                      </Button>
                    </>
                  )}
                  {failedStep === 3 && (
                    <>
                      <Button
                        onClick={() => onRetryStep(1)}
                        variant="outline"
                        className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        🔄 Thử lại bước 1: Nhập số điện thoại
                      </Button>
                      <Button
                        onClick={() => onRetryStep(2)}
                        variant="outline"
                        className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        🔄 Thử lại bước 2: Nhập mã OTP
                      </Button>
                      <Button
                        onClick={() => onRetryStep(3)}
                        variant="outline"
                        className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        🔄 Thử lại bước 3: Tải ảnh xác minh
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        {isSuccess ? (
          <Button
            onClick={handleGoHome}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Về trang chủ
          </Button>
        ) : (
          <div className="space-y-3">
            {onRestart && (
              <Button
                onClick={onRestart}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                🔄 Bắt đầu lại từ đầu
              </Button>
            )}
            <p className="text-xs text-gray-500 text-center">
              Hoặc chọn bước cụ thể để thử lại ở trên
            </p>
          </div>
        )}
      </div>
    </div>
  );
}