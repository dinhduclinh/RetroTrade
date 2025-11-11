import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Shield,
  FileText,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/common/button";
import { Badge } from "@/components/ui/common/badge";
import { getActiveTerms } from "@/services/terms/terms.api";
import { Terms } from "@/services/terms/terms.api";

interface TermsPageProps {
  initialTerms: Terms | null;
}

const IconMap = {
  FileText,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
};

export default function TermsPage({ initialTerms }: TermsPageProps) {
  const [terms, setTerms] = useState<Terms | null>(initialTerms);
  const [loading, setLoading] = useState(!initialTerms);
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!initialTerms) {
      fetchTerms();
    }
  }, [initialTerms]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await getActiveTerms();
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTerms(data.data);
        }
      }
    } catch (error) {
      console.error("Lỗi tải điều khoản:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải điều khoản...</p>
        </div>
      </div>
    );
  }

  if (!terms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Điều khoản dịch vụ
          </h1>
          <p className="text-slate-600 mb-6">
            Hệ thống chưa có điều khoản active. Vui lòng liên hệ admin để thiết
            lập.
          </p>
          <Link href="/">
            <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              Quay về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sections = terms.sections || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1000ms" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }`}
        >
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 bg-clip-text text-transparent mb-4">
            {terms.title}
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Phiên bản {terms.version} - Vui lòng đọc kỹ trước khi sử dụng dịch
            vụ
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>
              Cập nhật lần cuối:{" "}
              {new Date(terms.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <div className="mt-4 flex justify-center items-center gap-4">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Hoạt động
            </Badge>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
              Hiệu lực từ{" "}
              {new Date(terms.effectiveDate).toLocaleDateString("vi-VN")}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon =
              IconMap[section.icon as keyof typeof IconMap] || FileText; 
            return (
              <div
                key={index}
                className={`group transition-all duration-700 ${
                  isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onMouseEnter={() => setActiveSection(index)}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200 hover:border-indigo-300">
                  {/* Section Header */}
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-md transition-all duration-500 ${
                          activeSection === index
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 scale-110"
                            : "bg-white group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600"
                        }`}
                      >
                        <Icon
                          className={`w-7 h-7 transition-colors duration-500 ${
                            activeSection === index
                              ? "text-white"
                              : "text-blue-600 group-hover:text-white"
                          }`}
                        />
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-800 group-hover:text-indigo-900 transition-colors duration-300">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  {/* Section Content */}
                  <div className="p-6">
                    <ul className="space-y-4">
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-3 group/item hover:translate-x-2 transition-transform duration-300"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <ChevronRight className="w-5 h-5 text-indigo-600 group-hover/item:text-indigo-700 transition-colors duration-300" />
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {item}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Call-to-Action */}
        <div
          className={`mt-16 text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">
              Bạn đã sẵn sàng bắt đầu?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Bằng việc sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý với
              các điều khoản trên.
            </p>
            <Link href="/">
              <Button className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105">
                Tôi Đồng Ý Các Điều Khoản
              </Button>
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div
          className={`mt-12 text-center text-slate-600 transition-all duration-1000 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          <p className="text-sm">
            Có câu hỏi về điều khoản? Liên hệ chúng tôi tại{" "}
            <a
              href="mailto:support@retrotrade.vn"
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              support@retrotrade.vn
            </a>
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          header,
          footer {
            display: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          main {
            margin: 0;
            padding: 20px;
            background: white;
          }
          .bg-gray-50 {
            background: white !important;
          }
          .whitespace-pre-wrap {
            white-space: pre-wrap !important;
            font-family: "Courier New", monospace !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  TermsPageProps
> = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/terms/active`
    );
    if (response.ok) {
      const data = await response.json();
      return { props: { initialTerms: data.data || null } };
    }
  } catch (error) {
    console.error("SSR Error:", error);
  }
  return { props: { initialTerms: null } };
};
