import React from 'react';

export function DigitalSignatureCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Chữ ký số</h2>
      <p className="text-gray-600">Quản lý chữ ký số để ký xác nhận các giao dịch/biểu mẫu.</p>
      <div className="flex gap-2 mt-2">
        <a
          href="/auth/signature"
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
        >
          Mở trang chữ ký số
        </a>
        <button
          className="px-4 py-2 rounded-md border text-sm"
          onClick={() => window.location.assign('/auth/signature')}
        >
          Tải lên / quản lý
        </button>
      </div>
    </div>
  );
}


