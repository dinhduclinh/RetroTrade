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

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Head>
            <title>RetroTrade</title>
          </Head>
          <Header />
          <div className="pt-20 bg-white min-h-screen">
            <Component {...pageProps} />
            <Footer />
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
