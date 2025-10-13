"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { verifyEmail, resendOtp } from "@/services/auth/auth.api"

export default function OtpVerificationPage() {
  const router = useRouter()
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(8).fill(""))
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Convert otpDigits array to string
  const otp = otpDigits.join("")

  useEffect(() => {
    // Get email from URL query params
    if (router.query.email) {
      setEmail(router.query.email as string)
    }
  }, [router.query.email])

  useEffect(() => {
    // Focus first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !email) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    
    setIsLoading(true)
    toast.info("Đang xác thực...")
    
    try {
      const response = await verifyEmail(email, otp)
      const result = await response.json()
      
      if (result.code === 200) {
        toast.success("Xác thực email thành công!")
        router.push("/auth/login")
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5e6d3] items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          <div className="absolute top-0 left-0 text-sm text-gray-500">otp verification</div>
          <div className="absolute top-6 left-0 text-xs text-gray-600 border border-gray-400 px-2 py-1">
            VERIFICATION
          </div>

          {/* Illustration container */}
          <div className="relative">
            {/* Mail icon */}
            <div className="absolute top-8 left-12 w-24 h-24">
              <Mail className="w-full h-full text-[#b8ddd4]" />
            </div>

            {/* Main envelope shape */}
            <div className="relative bg-[#b8ddd4] rounded-3xl p-16 shadow-lg transform rotate-3">
              <div className="absolute top-4 right-4 w-12 h-12 bg-[#f4d47c] rounded-full opacity-80"></div>
            </div>

            {/* Text overlay */}
            <div className="relative text-center py-12">
              <h1 className="text-4xl font-bold text-[#7ba3c5] mb-4 tracking-wide">VERIFY</h1>
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="w-32 h-32 bg-[#b8ddd4] rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">OTP</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-[#f4d47c] tracking-wide">EMAIL</h2>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-600 space-y-1">
            <p>PLEASE CHECK YOUR EMAIL</p>
            <p>FOR VERIFICATION CODE</p>
            <p>ENTER THE CODE BELOW</p>
          </div>
        </div>
      </div>

      {/* Right side - OTP Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fef5e7]">
        <Card className="w-full max-w-md bg-white shadow-xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-white" strokeWidth={2.5} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Xác thực Email</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Nhập mã OTP đã được gửi đến <br />
                <span className="font-medium text-indigo-600">{email}</span>
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
            </form>

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
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
