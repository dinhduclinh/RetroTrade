import { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { login as loginAction } from "@/store/auth/authReducer";
import { loginWithFacebook } from "@/services/auth/auth.api";

export default function FacebookCallbackPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const run = async () => {
      try {
        // Facebook implicit flow returns access_token in hash
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const fbAccessToken = params.get("access_token");
        if (!fbAccessToken) {
          toast.error("Không nhận được access_token từ Facebook");
          router.replace("/auth/login");
          return;
        }

        // Fetch FB profile
        const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.width(256).height(256)&access_token=${encodeURIComponent(fbAccessToken)}`);
        if (!profileRes.ok) throw new Error(`Facebook profile HTTP ${profileRes.status}`);
        const profile = await profileRes.json();
        const email = profile?.email as string | undefined;
        const fullName = profile?.name as string | undefined;
        const avatarUrl = profile?.picture?.data?.url as string | undefined;

        if (!email) {
          toast.error("Tài khoản Facebook không cấp email");
          router.replace("/auth/login");
          return;
        }

        const response = await loginWithFacebook({ email, fullName, avatarUrl });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.code === 200) {
          dispatch(loginAction({ accessToken: result.data.accessToken, refreshToken: result.data.refreshToken }));
          toast.success("Đăng nhập Facebook thành công!");
          router.replace("/");
        } else if (result.code === 403 && result.isBanned) {
          // Redirect to banned account page
          router.replace("/auth/banned");
        } else {
          toast.error(result.message || "Đăng nhập Facebook thất bại");
          router.replace("/auth/login");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Lỗi xử lý Facebook callback");
        router.replace("/auth/login");
      }
    };
    run();
  }, [router, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <p>Đang đăng nhập với Facebook...</p>
    </div>
  );
}


