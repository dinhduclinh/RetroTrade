import Head from "next/head";
import Image from "next/image";
import { Button } from "@/components/ui/common/button";
import { Badge } from "@/components/ui/common/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/common/section-heading";
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Users, 
  Star, 
  CheckCircle,
  TrendingUp,
  MessageCircle,
  Heart,
  Sparkles
} from "lucide-react";

export default function Home() {
  return (
    <>
      <Head>
        <title>RetroTrade - Nơi đồ cũ tìm được chủ mới</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Nền tảng buôn bán và trao đổi đồ cũ uy tín, an toàn và hiệu quả" />
      </Head>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))] animate-pulse" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

        <Container className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <Badge className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-white/20 hover:border-white/30 transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nền tảng buôn bán đồ cũ #1
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent leading-tight">
                  Nơi đồ cũ tìm được chủ mới
                </h1>
                
                <p className="text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Đăng tin nhanh, thương lượng trực tiếp, giao dịch an toàn. 
                  Xây dựng thị trường đồ cũ của bạn với công nghệ hiện đại.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 px-8 py-6 text-lg"
                >
                  Bắt đầu ngay
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
                >
                  Xem demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-gray-400">Sản phẩm</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">5K+</div>
                  <div className="text-sm text-gray-400">Người dùng</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-sm text-gray-400">Hài lòng</div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center">
                        <Heart className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Giao dịch an toàn</h3>
                      <p className="text-gray-300 text-sm">Được bảo vệ bởi hệ thống xác thực</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-float">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center animate-float animation-delay-2000">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <SectionHeading>Tại sao chọn RetroTrade?</SectionHeading>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Chúng tôi cung cấp giải pháp toàn diện cho việc buôn bán đồ cũ với công nghệ hiện đại
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Đăng tin siêu nhanh",
                description: "Chỉ cần 3 phút để đăng sản phẩm với AI hỗ trợ mô tả và định giá",
                color: "from-yellow-400 to-orange-400"
              },
              {
                icon: MessageCircle,
                title: "Chat trực tiếp",
                description: "Thương lượng giá cả và điều kiện giao dịch ngay trên nền tảng",
                color: "from-blue-400 to-cyan-400"
              },
              {
                icon: Shield,
                title: "Bảo mật tuyệt đối",
                description: "Xác thực danh tính, đánh giá uy tín và bảo vệ giao dịch",
                color: "from-green-400 to-emerald-400"
              },
              {
                icon: TrendingUp,
                title: "Gợi ý thông minh",
                description: "AI phân tích thị trường để đề xuất giá phù hợp nhất",
                color: "from-purple-400 to-pink-400"
              },
              {
                icon: Users,
                title: "Cộng đồng lớn",
                description: "Kết nối với hàng nghìn người dùng tin cậy trên toàn quốc",
                color: "from-indigo-400 to-blue-400"
              },
              {
                icon: Heart,
                title: "Dịch vụ tận tâm",
                description: "Hỗ trợ 24/7 và cam kết mang đến trải nghiệm tốt nhất",
                color: "from-red-400 to-pink-400"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <Container>
          <div className="text-center mb-16">
            <SectionHeading>Quy trình đơn giản</SectionHeading>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Chỉ với 4 bước đơn giản, bạn có thể bắt đầu giao dịch ngay hôm nay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Đăng sản phẩm",
                description: "Chụp ảnh, mô tả và đặt giá cho sản phẩm của bạn",
                icon: "📱"
              },
              {
                step: "02", 
                title: "Tìm người mua",
                description: "Hệ thống tự động gợi ý người mua phù hợp",
                icon: "🔍"
              },
              {
                step: "03",
                title: "Thương lượng",
                description: "Chat trực tiếp để thỏa thuận giá và điều kiện",
                icon: "💬"
              },
              {
                step: "04",
                title: "Hoàn tất giao dịch",
                description: "Xác nhận, đánh giá và hoàn tất đơn hàng",
                icon: "✅"
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto group-hover:shadow-xl transition-all duration-300">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <Container>
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Sẵn sàng bắt đầu?</h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Tham gia cộng đồng RetroTrade ngay hôm nay và khám phá những cơ hội tuyệt vời
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 hover:scale-105 transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                Đăng ký miễn phí
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-purple-600 hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
              >
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}