"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { register } from "@/services/auth/auth.api"
import Image from "next/image"
// i18n removed

export function RegisterForm() {
  const router = useRouter()
  // i18n removed
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !fullName || !password || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp')
      return
    }
    
    setIsLoading(true)
    toast.info('Đang xử lý...')
    
    try {
      const response = await register(email, password, fullName)
      const result = await response.json()
      
      if (result.code === 200) {
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.")
        // Redirect to OTP verification page
        router.push(`/auth/otp?email=${encodeURIComponent(email)}`)
      } else {
        toast.error(result.message || "Đăng ký thất bại")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Có lỗi xảy ra, vui lòng thử lại")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    toast.info("Đăng nhập với Google")
  }

  const handleFacebookLogin = () => {
    toast.info("Đăng nhập với Facebook")
  }

  return (
    <Card className="w-full max-w-md bg-white shadow-xl">
      <CardHeader className="text-center space-y-4 pb-4">
        <div className="flex justify-center">
          <Image
            src="/retrologo.png"
            alt="Retro Trade Logo"
            width={80}
            height={80}
            className="rounded-lg"
          />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Retro Trade
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">Tạo tài khoản mới</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-sm font-medium text-gray-700"
            >
              Họ và tên
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder=""
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black pr-10"
                required
              />
              {password && password.length > 0 && (
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                  }
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Xác nhận mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder=""
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-indigo-100 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 text-black pr-10"
                required
              />
              {confirmPassword && confirmPassword.length > 0 && (
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                  }
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/auth/forgot-password")}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">hoặc</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-300 hover:bg-gray-50 font-normal bg-transparent text-black"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Đăng nhập với Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-300 hover:bg-gray-50 font-normal bg-transparent text-black"
            onClick={handleFacebookLogin}
          >
            <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Đăng nhập với Facebook
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            Đăng nhập
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
