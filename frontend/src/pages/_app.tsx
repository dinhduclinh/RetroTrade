import Footer from "@/components/common/Footer";
import Header from "@/components/common/header";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/redux_store";
import Head from "next/head";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Check if current page is a management page
  const isManagementPage = router.pathname.startsWith('/admin') || 
                          router.pathname.startsWith('/moderator') || 
                          router.pathname.startsWith('/owner');

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Head>
            <title>RetroTrade</title>
          </Head>
          
          {/* Only show Header and Footer on non-management pages */}
          {!isManagementPage && <Header />}
          
          <div className={isManagementPage ? "min-h-screen" : "pt-20 bg-white min-h-screen"}>
            <Component {...pageProps} />
            
            {/* Only show Footer on non-management pages */}
            {!isManagementPage && <Footer />}
            
            {mounted && (
              <Toaster
                richColors
                position="top-right"
                toastOptions={{
                  classNames: {
                    toast: "px-6 py-5 text-base",
                    title: "text-lg font-semibold",
                    description: "text-base",
                    closeButton: "scale-110",
                    actionButton: "text-base",
                  },
                }}
              />
            )}
          </div>
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  );
}
