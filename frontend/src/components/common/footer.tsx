"use client";
import Link from "next/link"
export function Footer() {
  return (
    <footer className="relative z-10 bg-gray-900 text-white py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Về chúng tôi</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-gray-400 hover:text-white transition-colors">
                  Đội ngũ
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors">
                  Tuyển dụng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Dịch vụ</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/rent" className="text-gray-400 hover:text-white transition-colors">
                  Cho thuê
                </Link>
              </li>
              <li>
                <Link href="/buy" className="text-gray-400 hover:text-white transition-colors">
                  Mua bán
                </Link>
              </li>
              <li>
                <Link href="/share" className="text-gray-400 hover:text-white transition-colors">
                  Chia sẻ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Theo dõi chúng tôi</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Retro Trade. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;