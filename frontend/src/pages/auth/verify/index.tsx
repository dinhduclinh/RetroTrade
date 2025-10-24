"use client";
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Home } from 'lucide-react';
import { sendOtpFirebase, verifyOtpFirebase } from '../../../services/auth/auth.api';
import VerificationForm from '../../../components/ui/auth/verify/VerificationForm';
import { FaceVerificationResponse } from '../../../services/auth/faceVerification.api';
import { getUserProfile } from '../../../services/auth/user.api';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

export default function VerificationPage() {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [sessionInfo, setSessionInfo] = useState<string>('');
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<{
    isIdVerified: boolean;
    isPhoneConfirmed: boolean;
    email?: string;
    fullName?: string;
  } | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState<boolean>(true);

  // Breadcrumb navigation
  const breadcrumbs = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Hồ sơ cá nhân', href: '/auth/profile' },
    { name: 'Xác minh danh tính', href: '/auth/verify', current: true }
  ];

  // Firebase types for compat SDK
  type FirebaseAuthCallable = () => {
    useEmulator: (url: string) => void;
    signInWithPhoneNumber: (
      phone: string,
      verifier: unknown
    ) => Promise<{ confirm: (code: string) => Promise<{ user: { getIdToken: (force?: boolean) => Promise<string> } }> }>;
  };
  type FirebaseAuthCompat = FirebaseAuthCallable & {
    RecaptchaVerifier: new (
      container: string,
      opts: { size: 'invisible' | 'normal' }
    ) => { verify: () => Promise<string> };
  };
  type CompatFirebase = {
    apps: unknown[];
    initializeApp: (config: Record<string, unknown>) => void;
    auth: FirebaseAuthCompat;
  };
  type CompatWindow = { firebase?: CompatFirebase };

  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

  useEffect(() => {
    // Prepare reCAPTCHA container
    const containerId = 'recaptcha-container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
  }, []);

  // Check user verification status
  useEffect(() => {
    const checkUserVerificationStatus = async () => {
      try {
        setIsCheckingVerification(true);
        const response = await getUserProfile();
        
        if (response.code === 200 && response.user) {
          setUserProfile(response.user);
          
          // Check if user is already verified
          if (response.user.isIdVerified && response.user.isPhoneConfirmed) {
            setResult({
              success: true,
              message: 'Bạn đã xác minh danh tính thành công',
              details: `Tài khoản ${response.user.email || response.user.fullName || 'của bạn'} đã được xác minh đầy đủ. Bạn có thể sử dụng tất cả các tính năng của hệ thống.`
            });
          }
        }
      } catch (error) {
        console.error('Error checking user verification status:', error);
        // Continue with normal flow if there's an error
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkUserVerificationStatus();
  }, []);

  // Format phone number for Firebase
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with +84
    if (digits.startsWith('0')) {
      return '+84' + digits.substring(1);
    }
    
    // If starts with 84, add +
    if (digits.startsWith('84')) {
      return '+' + digits;
    }
    
    // If already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add +84
    return '+84' + digits;
  };

  const handleSendOTP = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Format phone number for Firebase
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Original phone:', phoneNumber);
      console.log('Formatted phone:', formattedPhone);
      
      const firebaseMaybe = (window as unknown as CompatWindow).firebase;
      if (!firebaseMaybe) {
        throw new Error('Firebase SDK not loaded');
      }
      const firebase = firebaseMaybe;
      if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
      
      let recaptchaToken: string | undefined;
      if (!emulatorHost) {
        // Clear existing reCAPTCHA
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }
        const verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
        recaptchaToken = await verifier.verify();
      } else {
        // Emulator mode: no reCAPTCHA needed
        recaptchaToken = undefined;
      }

      const response = await sendOtpFirebase(formattedPhone, recaptchaToken);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Send OTP failed');
      }
      setSessionInfo(data?.data?.sessionInfo || '');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await verifyOtpFirebase(sessionInfo, otp);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Verify OTP failed');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVerification = async (verificationResult?: FaceVerificationResponse) => {
    try {
      setIsLoading(true);
      
      if (verificationResult) {
        // Use the face verification result from API
        const { isMatch, similarityPercentage } = verificationResult.data;
        const { message } = verificationResult;
        const { phoneConfirmed } = verificationResult.data;
        
        setResult({
          success: isMatch,
          message: message,
          details: isMatch 
            ? `Xác minh khuôn mặt thành công với độ tương đồng ${similarityPercentage}%. ${phoneConfirmed ? 'Số điện thoại đã được xác minh.' : ''} Thông tin của bạn đã được xác minh thành công.`
            : `Khuôn mặt không khớp (độ tương đồng: ${similarityPercentage}%). Hệ thống đã sử dụng thuật toán nâng cao để phân tích ảnh CCCD với nhiều thông tin và ảnh nhỏ. Vui lòng thử lại với ảnh chất lượng tốt hơn hoặc đảm bảo ảnh chụp rõ nét.`
        });
      } else {
        // Fallback if no verification result provided
        setResult({
          success: false,
          message: 'Không có kết quả xác minh',
          details: 'Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xác minh khuôn mặt';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setPhoneNumber('');
    setOtp('');
    setImages([]);
    setSessionInfo('');
    setResult(null);
  };

  // Show loading while checking verification status
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra trạng thái xác minh...</p>
          {userProfile && (
            <p className="text-sm text-gray-500 mt-2">
              Tài khoản: {userProfile.email || userProfile.fullName || 'Đang tải...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js" strategy="afterInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js" strategy="afterInteractive" />
      <div id="recaptcha-container" />
      
      <VerificationForm
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        otp={otp}
        setOtp={setOtp}
        images={images}
        setImages={setImages}
        result={result}
        isLoading={isLoading}
        onSendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
        onSubmitVerification={handleSubmitVerification}
        onRestart={handleRestart}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}


