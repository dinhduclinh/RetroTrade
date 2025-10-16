import { RegisterForm } from "@/components/ui/registerForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2  bg-[#f2debe] relative">
        <Image
          src="/share.png"
          alt="Retro Trade Logo"
          fill
          className="object-contain"
        />
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fef5e7]">
        <RegisterForm />
      </div>
    </div>
  );
}
