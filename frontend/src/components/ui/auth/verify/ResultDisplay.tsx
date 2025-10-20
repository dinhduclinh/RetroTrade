import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../common/button";

interface ResultDisplayProps {
  result: { success: boolean; message: string; details?: string } | null;
  onRestart?: () => void;
}

export default function ResultDisplay({ result, onRestart }: ResultDisplayProps) {
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
          onRestart && (
            <Button
              onClick={onRestart}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Thử lại
            </Button>
          )
        )}
      </div>
    </div>
  );
}