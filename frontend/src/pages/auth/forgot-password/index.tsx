"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Mail, ArrowLeft, Key } from "lucide-react"
import { toast } from "sonner"
import { requestForgotPassword, forgotPasswordOtp, forgotPassword } from "@/services/auth/auth.api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
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
        <Label htmlFor="otp" className="text-sm font-medium text-gray-700">Mã OTP</Label>
        <Input
          id="otp"
          type="text"
          placeholder="Nhập mã OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black text-center text-lg tracking-widest"
          maxLength={8}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md disabled:opacity-50"
      >
        {isLoading ? "Đang xác thực..." : "Xác thực"}
      </Button>
    </form>
  )

  const renderStep3 = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">Mật khẩu mới</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black"
          required
        />
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5e6d3] items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          <div className="absolute top-0 left-0 text-sm text-gray-500">forgot password</div>
          <div className="absolute top-6 left-0 text-xs text-gray-600 border border-gray-400 px-2 py-1">
            RESET
          </div>

          {/* Illustration container */}
          <div className="relative">
            {/* Key icon */}
            <div className="absolute top-8 left-12 w-24 h-24">
              <Key className="w-full h-full text-[#b8ddd4]" />
            </div>

            {/* Main envelope shape */}
            <div className="relative bg-[#b8ddd4] rounded-3xl p-16 shadow-lg transform rotate-3">
              <div className="absolute top-4 right-4 w-12 h-12 bg-[#f4d47c] rounded-full opacity-80"></div>
            </div>

            {/* Text overlay */}
            <div className="relative text-center py-12">
              <h1 className="text-4xl font-bold text-[#7ba3c5] mb-4 tracking-wide">RESET</h1>
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="w-32 h-32 bg-[#b8ddd4] rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">KEY</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-[#f4d47c] tracking-wide">PASSWORD</h2>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-600 space-y-1">
            <p>STEP {step} OF 3</p>
            <p>RESET YOUR PASSWORD</p>
            <p>SECURELY AND EASILY</p>
          </div>
        </div>
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
    </div>
  )
}
