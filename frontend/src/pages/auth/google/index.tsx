import { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { login as loginAction } from "@/store/auth/authReducer";
import { toast } from "sonner";
import { loginWithGoogle } from "@/services/auth/auth.api";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const run = async () => {
      try {
        // @react-oauth/google redirects back with hash params containing access_token/id_token
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const idToken = params.get("id_token");

        if (!idToken) {
          toast.error("Không nhận được id_token từ Google");
          router.replace("/auth/login");
          return;
        }

        // Decode ID token to extract profile (Google ID token, not our JWT)
        // Note: Google ID token is different from our JWT, but we can still use jwtDecode
        // However, for Google ID token, we'll decode it manually since it's not our token format
        const payloadJson = JSON.parse(atob(idToken.split(".")[1] || ""));
        const email = payloadJson?.email as string | undefined;
        const fullName = payloadJson?.name as string | undefined;
        const avatarUrl = payloadJson?.picture as string | undefined;

        if (!email) {
          toast.error("Không lấy được email từ Google");
          router.replace("/auth/login");
          return;
        }

        const response = await loginWithGoogle({ email, fullName, avatarUrl });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result.code === 200) {
          dispatch(loginAction({ accessToken: result.data.accessToken, refreshToken: result.data.refreshToken }));
          toast.success("Đăng nhập Google thành công!");
          router.replace("/");
        } else {
          toast.error(result.message || "Đăng nhập Google thất bại");
          router.replace("/auth/login");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Lỗi khi xử lý đăng nhập Google");
        router.replace("/auth/login");
      }
    };
    run();
  }, [router, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <p>Đang đăng nhập với Google...</p>
    </div>
  );
}


