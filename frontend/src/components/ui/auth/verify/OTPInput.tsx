import { Button } from "../../common/button";
import { Input } from "../../common/input";
import { useState, useRef, useEffect } from "react";
import { CheckCircle, AlertCircle, Clock, Smartphone } from "lucide-react";

interface OTPInputProps {
  otp: string;
  setOtp: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function OTPInput({ otp, setOtp, onNext, onBack, isLoading = false }: OTPInputProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Update otpDigits when otp prop changes
    const digits = otp.split('').slice(0, 6);
    const paddedDigits = [...digits, ...Array(6 - digits.length).fill('')];
    setOtpDigits(paddedDigits);
  }, [otp]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    
    const newOtp = newDigits.join('');
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move to previous input if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = pastedData.split('');
    const paddedDigits = [...digits, ...Array(6 - digits.length).fill('')];
    setOtpDigits(paddedDigits);
    setOtp(pastedData);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = paddedDigits.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const isValidOTP = (otp: string) => /^\d{6}$/.test(otp);

  const handleVerifyOTP = () => {
    if (!isValidOTP(otp)) {
      setError("Vui lòng nhập đầy đủ 6 chữ số");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Guidelines Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800">Hướng dẫn nhập mã OTP</h4>
            <div className="space-y-1 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Kiểm tra tin nhắn SMS trên điện thoại</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Nhập đầy đủ 6 chữ số từ tin nhắn</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>Mã OTP có hiệu lực trong 5 phút</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span>Có thể dán mã OTP trực tiếp vào ô đầu tiên</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mã xác thực OTP (6 chữ số) <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Nhập mã OTP đã được gửi đến số điện thoại của bạn
        </p>
        
        <div className="flex gap-2 justify-center">
          {otpDigits.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-12 text-center text-lg font-semibold ${
                error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'
              }`}
            />
          ))}
        </div>
        
        {error && (
          <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {otp && isValidOTP(otp) && (
          <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-green-600 text-sm">Mã OTP hợp lệ</p>
          </div>
        )}
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
            onClick={handleVerifyOTP}
            disabled={!isValidOTP(otp) || isLoading}
            className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang xác minh...</span>
              </div>
            ) : (
              "Xác minh OTP"
            )}
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Không nhận được mã? 
            <button className="text-blue-600 hover:text-blue-800 ml-1 underline">
              Gửi lại mã OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}