import { LoginForm } from "@/components/ui/auth/loginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex ">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-[#f2debe] relative p-8">
        <Image
          src="/share.png"
          alt="Retro Trade Logo"
          fill
          className="object-contain object-center"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fef5e7]">
        <LoginForm />
      </div>
    </div>
  );
}

// i18n removed
