import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";

interface SignaturePadProps {
  onSave: (signatureUrl: string) => void;
  onClear: () => void;
  className?: string;
  disabled?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClear,
  className = "",
  disabled = false,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const checkIsEmpty = () => {
    return sigCanvas.current?.isEmpty() ?? true;
  };

  const handleBegin = () => {
    if (disabled) return;
    setIsEmpty(false);
  };

  const handleEnd = () => {
    setIsEmpty(checkIsEmpty());
  };

  useEffect(() => {
    setIsEmpty(checkIsEmpty());
  }, []);

  const validateSignature = (dataURL: string): boolean => {
    // 1: Không rỗng 
    if (checkIsEmpty()) {
      return false;
    }

    // 2: Độ dài dataURL tối thiểu 
    const minDataLength = 1000; // Ngưỡng tùy chỉnh
    if (dataURL.length < minDataLength) {
      toast.error("Chữ ký quá ngắn. Vui lòng vẽ rõ ràng và đầy đủ hơn!");
      return false;
    }

    // 3: Kiểm tra số lượng điểm vẽ 
    const data = sigCanvas.current?.toData();
    if (!data || data.length === 0 || data[0].length < 5) {
      toast.error("Chữ ký cần ít nhất một nét vẽ rõ ràng!");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (disabled) return;

    const dataURL = sigCanvas.current?.toDataURL("image/png");
    if (!dataURL) {
      toast.error("Không thể tạo chữ ký. Vui lòng thử lại!");
      return;
    }

    if (!validateSignature(dataURL)) {
      return;
    }

    onSave(dataURL);
  };

  const handleClear = () => {
    if (disabled) return;
    sigCanvas.current?.clear();
    setIsEmpty(true);
    onClear();
  };

  return (
    <div className={`signature-pad ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Vẽ chữ ký điện tử của bạn</h3>
      <p className="text-sm text-gray-500 mb-4">
        Sử dụng chuột hoặc ngón tay để vẽ. Bạn có thể xóa và vẽ lại.
      </p>

      <SignatureCanvas
        ref={sigCanvas}
        onBegin={handleBegin}
        onEnd={handleEnd}
        penColor="black"
        canvasProps={{
          className: `border border-gray-300 rounded-lg w-full h-48 bg-white ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`,
          width: window.innerWidth < 768 ? window.innerWidth - 40 : 500,
          height: 200,
          style: {
            touchAction: "none",
            pointerEvents: disabled ? "none" : "auto",
          },
          onTouchStart: (e) => {
            if (!disabled) e.preventDefault();
          },
        }}
      />

      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Xóa
        </button>
        <button
          onClick={handleSave}
          disabled={disabled || isEmpty}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Lưu chữ ký
        </button>
      </div>

      <style jsx>{`
        .signature-pad {
          max-width: 500px;
          margin: 0 auto;
          padding: 1rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 768px) {
          .signature-pad canvas {
            width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SignaturePad;
