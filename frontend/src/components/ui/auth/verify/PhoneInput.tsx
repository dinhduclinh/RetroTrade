import { Button } from "../../common/button";
import { Input } from "../../common/input";
import { useState, useEffect, useRef } from "react";
import { Info, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

interface PhoneInputProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export default function PhoneInput({ phoneNumber, setPhoneNumber, onNext, isLoading = false }: PhoneInputProps) {
  const [error, setError] = useState<string>("");
  const [countryCode, setCountryCode] = useState<'VN' | 'INT'>('VN');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isValidVietnamesePhone = (phone: string) => {
    // Vietnamese phone number patterns
    const patterns = [
      /^(\+84|84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/, // +84 or 84 prefix
      /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/ // 0 prefix
    ];
    return patterns.some(pattern => pattern.test(phone));
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (countryCode === 'VN') {
      // Vietnamese format: 0xxx xxx xxx
      if (cleaned.startsWith('0') && cleaned.length >= 10) {
        const digits = cleaned.substring(1);
        if (digits.length >= 9) {
          return `0${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`;
        }
      }
      return cleaned;
    } else {
      // International format: +84 xxx xxx xxx
      if (cleaned.startsWith('+84') && cleaned.length >= 12) {
        const digits = cleaned.substring(3);
        if (digits.length >= 9) {
          return `+84 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`;
        } else if (digits.length > 0) {
          return `+84 ${digits}`;
        }
        return '+84 ';
      } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
        const digits = cleaned.substring(2);
        if (digits.length >= 9) {
          return `+84 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`;
        } else if (digits.length > 0) {
          return `+84 ${digits}`;
        }
        return '+84 ';
      } else if (cleaned.length >= 9 && !cleaned.startsWith('+') && !cleaned.startsWith('84')) {
        // Auto-add +84 prefix for international mode
        return `+84 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`;
      } else if (cleaned.length > 0 && !cleaned.startsWith('+') && !cleaned.startsWith('84')) {
        // Partial number - just add +84 prefix
        return `+84 ${cleaned}`;
      }
      return '+84 ';
    }
  };

  const handleCountryChange = (newCountry: 'VN' | 'INT') => {
    setCountryCode(newCountry);
    setShowCountryDropdown(false);
    
    if (newCountry === 'INT') {
      setPhoneNumber('+84 '); // Set default +84 prefix for international
    } else {
      setPhoneNumber(''); // Clear for Vietnamese format
    }
    setError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    
    if (formatted && !isValidVietnamesePhone(formatted.replace(/\s/g, ''))) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam");
    } else {
      setError("");
    }
  };

  const handleSendOTP = () => {
    const cleanPhone = phoneNumber.replace(/\s/g, ''); // Remove spaces for validation
    if (!cleanPhone) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }
    if (!isValidVietnamesePhone(cleanPhone)) {
      setError("Số điện thoại không hợp lệ");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Guidelines Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">Hướng dẫn nhập số điện thoại</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Sử dụng số điện thoại Việt Nam đang hoạt động</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Nhập đầy đủ 10-11 chữ số</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>
                  {countryCode === 'VN' 
                    ? 'Định dạng Việt Nam: 0xxx xxx xxx' 
                    : 'Định dạng quốc tế: +84 xxx xxx xxx'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span>Đảm bảo điện thoại có thể nhận SMS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        
        {/* Input with Country Selector */}
        <div className="flex gap-2">
          {/* Country Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors h-10"
            >
              {countryCode === 'VN' ? (
                <>
                  <div className="w-5 h-3 bg-red-500 rounded-sm flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">VN</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-3 bg-blue-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🌍</span>
                  </div>
                  <span className="text-sm font-medium">INT</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            
            {showCountryDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px]">
                <button
                  onClick={() => handleCountryChange('VN')}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="w-5 h-3 bg-red-500 rounded-sm flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full"></div>
                  </div>
                  <span className="text-sm">Việt Nam (0xxx xxx xxx)</span>
                </button>
                <button
                  onClick={() => handleCountryChange('INT')}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="w-5 h-3 bg-blue-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🌍</span>
                  </div>
                  <span className="text-sm">Quốc tế (+84 xxx xxx xxx)</span>
                </button>
              </div>
            )}
          </div>

          {/* Phone Input with +84 Frame */}
          <div className="flex-1 relative">
            {countryCode === 'INT' && phoneNumber.startsWith('+84') && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                  <span className="text-blue-700 font-semibold text-sm">+84</span>
                </div>
              </div>
            )}
            <Input
              type="tel"
              placeholder={countryCode === 'VN' 
                ? "Nhập số điện thoại (VD: 0xxx xxx xxx)" 
                : "Nhập 9 số sau +84 (VD: xxx xxx xxx)"
              }
              value={phoneNumber}
              onChange={handlePhoneChange}
              className={`w-full ${error ? 'border-red-500' : ''} ${countryCode === 'INT' && phoneNumber.startsWith('+84') ? 'pl-16' : ''}`}
            />
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {phoneNumber && isValidVietnamesePhone(phoneNumber.replace(/\s/g, '')) && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-green-600 text-sm">Số điện thoại hợp lệ</p>
          </div>
        )}
      </div>
      
      {/* Action Button */}
      <div className="space-y-2">
        <Button
          onClick={handleSendOTP}
          disabled={!phoneNumber || !isValidVietnamesePhone(phoneNumber.replace(/\s/g, '')) || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Đang gửi mã OTP...</span>
            </div>
          ) : (
            "Gửi mã OTP"
          )}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Mã OTP sẽ được gửi qua SMS trong vòng 30 giây
        </p>
      </div>
    </div>
  );
}