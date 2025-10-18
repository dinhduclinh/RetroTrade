"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/common/button"
import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { ArrowLeft, Key, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { requestForgotPassword, forgotPasswordOtp, forgotPassword, resendOtp } from "@/services/auth/auth.api"
import Image from "next/image"
import { validatePassword } from "@/lib/validation-password"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState("")
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(8).fill(""))
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Convert otpDigits array to string
  const otp = otpDigits.join("")

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // Handle URL parameters for step and email
  useEffect(() => {
    if (router.query.step) {
      const stepParam = parseInt(router.query.step as string)
      if (stepParam >= 1 && stepParam <= 3) {
        setStep(stepParam)
      }
    }
    if (router.query.email) {
      setEmail(router.query.email as string)
    }
  }, [router.query])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Vui lòng nhập email")
      return
    }

    setIsLoading(true)
    toast.info("Đang gửi mã OTP...")

    try {
      const response = await requestForgotPassword(email)
      const result = await response.json()

      if (result.code === 200) {
        toast.success("Mã OTP đã được gửi đến email của bạn!")
        setCountdown(60 * 3)
        setStep(2)
      } else {
        toast.error(result.message || "Không thể gửi mã OTP")
      }
    } catch (error) {
      console.error("Request reset password error:", error)
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return

    const newOtpDigits = [...otpDigits]
    newOtpDigits[index] = value
    setOtpDigits(newOtpDigits)

    // Auto focus next input if value is entered
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    const newOtpDigits = Array(8).fill("")

    for (let i = 0; i < pastedData.length && i < 8; i++) {
      newOtpDigits[i] = pastedData[i]
    }

    setOtpDigits(newOtpDigits)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtpDigits.findIndex(digit => digit === "")
    const focusIndex = nextEmptyIndex === -1 ? 7 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      toast.error("Vui lòng nhập mã OTP")
      return
    }

    setIsLoading(true)
    toast.info("Đang xác thực mã OTP...")

    try {
      const response = await forgotPasswordOtp(email, otp)
      const result = await response.json()

      if (result.code === 200) {
        toast.success("Mã OTP hợp lệ!")
        setStep(3)
      } else {
        toast.error(result.message || "Mã OTP không đúng")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      toast.error("Không tìm thấy email")
      return
    }

    setIsResending(true)
    toast.info("Đang gửi lại mã OTP...")

    try {
      const response = await resendOtp(email)
      const result = await response.json()

      if (result.code === 200) {
        toast.success("Mã OTP đã được gửi lại!")
        setCountdown(60) // 60 seconds countdown
        setOtpDigits(Array(8).fill("")) // Clear OTP inputs
        inputRefs.current[0]?.focus() // Focus first input
      } else {
        toast.error(result.message || "Không thể gửi lại mã OTP")
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setIsResending(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      toast.error(validation.message || "Mật khẩu không hợp lệ")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu không khớp")
      return
    }

    setIsLoading(true)
    toast.info("Đang đặt lại mật khẩu...")

    try {
      const response = await forgotPassword(email, newPassword)
      const result = await response.json()

      if (result.code === 200) {
        toast.success("Đặt lại mật khẩu thành công!")
        router.push("/auth/login")
      } else {
        toast.error(result.message || "Không thể đặt lại mật khẩu")
      }
    } catch (error) {
      console.error("Reset password error:", error)
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <form onSubmit={handleRequestReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md disabled:opacity-50"
      >
        {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
      </Button>
    </form>
  )

  const renderStep2 = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Mã OTP</Label>
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otpDigits.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-bold bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black"
              maxLength={1}
              required
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Nhập mã OTP 8 chữ số đã được gửi đến email của bạn
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md disabled:opacity-50"
      >
        {isLoading ? "Đang xác thực..." : "Xác thực"}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Không nhận được mã?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || countdown > 0}
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium disabled:opacity-50"
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : isResending ? "Đang gửi..." : "Gửi lại"}
          </button>
        </p>
        {countdown > 0 && (
          <p className="text-xs text-gray-500">
            Mã OTP sẽ hết hạn sau {countdown} giây
          </p>
        )}
      </div>
    </form>
  )

  const renderStep3 = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">Mật khẩu mới</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black pr-10"
            required
          />
          {newPassword && newPassword.length > 0 && (
            <button
              type="button"
              aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-800"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black pr-10"
            required
          />
          {confirmPassword && confirmPassword.length > 0 && (
            <button
              type="button"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-800"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md disabled:opacity-50"
      >
        {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  )

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-[#f2debe] relative p-8">
        <Image
          src="/share.png"
          alt="Retro Trade Logo"
          fill
          className="object-contain object-center"
        />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fef5e7]">
        <Card className="w-full max-w-md bg-white shadow-xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Key className="w-8 h-8 text-white" strokeWidth={2.5} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {step === 1 && "Quên mật khẩu?"}
                {step === 2 && "Xác thực OTP"}
                {step === 3 && "Đặt lại mật khẩu"}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {step === 1 && "Nhập email để nhận mã OTP"}
                {step === 2 && `Nhập mã OTP đã gửi đến ${email}`}
                {step === 3 && "Nhập mật khẩu mới"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại đăng nhập
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
