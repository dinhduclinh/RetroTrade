import { LoginForm } from "@/components/ui/loginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5e6d3] items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          <div className="absolute top-0 left-0 text-sm text-gray-500">login</div>
          <div className="absolute top-6 left-0 text-xs text-gray-600 border border-gray-400 px-2 py-1">
            INFORMATION
          </div>

          {/* Illustration container */}
          <div className="relative">
            {/* Dove and envelope illustration */}
            <div className="absolute top-8 left-12 w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M20 50 Q30 30, 50 40 Q70 30, 80 50 Q70 40, 50 50 Q30 40, 20 50" fill="#b8ddd4" opacity="0.8" />
              </svg>
            </div>

            {/* Main envelope shape */}
            <div className="relative bg-[#b8ddd4] rounded-3xl p-16 shadow-lg transform rotate-3">
              <div className="absolute top-4 right-4 w-12 h-12 bg-[#f4d47c] rounded-full opacity-80"></div>
            </div>

            {/* Arrow */}
            <div className="absolute top-8 right-8">
              <svg width="80" height="80" viewBox="0 0 80 80" className="text-[#b8ddd4]">
                <path
                  d="M10 40 L50 40 L40 30 M50 40 L40 50"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Text overlay */}
            <div className="relative text-center py-12">
              <h1 className="text-6xl font-bold text-[#7ba3c5] mb-4 tracking-wide">SHARE OLD</h1>
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="w-32 h-32 bg-[#b8ddd4] rounded-full flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">GO</span>
                </div>
              </div>
              <h2 className="text-6xl font-bold text-[#f4d47c] tracking-wide">LIVE GREEN</h2>
            </div>

            {/* Plant decorations */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-around">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="text-[#6b9b7f]">
                  <svg width="40" height="60" viewBox="0 0 40 60">
                    <path
                      d="M20 60 Q15 40, 10 30 Q15 35, 20 30 Q25 35, 30 30 Q25 40, 20 60"
                      fill="currentColor"
                      opacity="0.7"
                    />
                  </svg>
                </div>
              ))}
            </div>

            {/* Bottom icons */}
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-[#f4d47c] rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b9b7f" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <div className="absolute bottom-4 right-4 w-12 h-12 bg-[#f4d47c] rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b9b7f" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-600 space-y-1">
            <p>PLEASE ADD YOUR BRAND&apos;S INFORMATION</p>
            <p>HERE. PLEASE ADD YOUR BRAND&apos;S INFORMATION</p>
            <p>USED IN PLACE ADD YOUR INFOMATION</p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fef5e7]">
        <LoginForm />
      </div>
    </div>
  )
}

// i18n removed
