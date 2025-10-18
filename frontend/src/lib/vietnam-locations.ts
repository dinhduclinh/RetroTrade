// Vietnamese provinces data (34 provinces/cities after merger 2025)
export const vietnamProvinces = [
  // 6 thành phố trực thuộc Trung ương
  "Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Huế", "Cần Thơ",
  // 28 tỉnh (Đã cập nhật theo danh sách 34 ĐVHC mới)
  "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên",
  "Ninh Bình", "Quảng Trị", "Quảng Ngãi", "Gia Lai", "Khánh Hòa", "Lâm Đồng",
  "Đắk Lắk", "Đồng Nai", "Tây Ninh", "Đồng Tháp", "Vĩnh Long", "An Giang",
  "Cà Mau", 
  // Các tỉnh giữ nguyên
  "Cao Bằng", "Lai Châu", "Điện Biên", "Lạng Sơn", "Sơn La", "Quảng Ninh",
  "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Thừa Thiên Huế" // Huế đã là TP, TH Huế bị sáp nhập vào TP Huế/Quảng Trị (tuy nhiên trong danh sách 34 lại có Huế riêng). Ta giữ Huế là TP và bỏ Thừa Thiên Huế
];

// Vietnamese wards data (Xã/Phường grouped by Province/City after merger 2025)
// LƯU Ý: Danh sách xã/phường ở đây chỉ là VÍ DỤ. Danh sách chi tiết sau sáp nhập rất lớn và phức tạp.
export const vietnamWards: Record<string, string[]> = {
  // Thành phố trực thuộc Trung ương
  "Hà Nội": [
      // Các Phường được sắp xếp lại
      "Phường Ba Đình Mới", "Phường Hoàn Kiếm Mới", "Phường Đống Đa Mới", 
      "Phường Cầu Giấy Mới", "Phường Tây Hồ Mới", "Phường Long Biên Mới",
      "Phường Thanh Xuân Mới", "Phường Hoàng Mai Mới", "Phường Hà Đông Mới", 
      // Các Xã/Thị trấn được sắp xếp lại (Ví dụ khu vực ngoại thành)
      "Thị trấn Sóc Sơn Mới", "Xã An Khánh Mới", "Xã Sơn Đồng Mới", "Xã Cổ Bi Mới",
      "Xã Kiêu Kỵ Mới", "Xã Bát Tràng Mới", "Xã Tiền Phong Mới", "Xã Yên Bài Mới"
  ],
  "TP. Hồ Chí Minh": [
      "Phường Bến Thành Mới", "Phường Đa Kao Mới", "Phường An Khánh Mới (TP. Thủ Đức)",
      "Phường Cát Lái Mới (TP. Thủ Đức)", "Phường Thảo Điền Mới (TP. Thủ Đức)",
      "Phường Phường 1 Quận 10 Mới", "Phường Phường 14 Quận 10 Mới",
      "Thị trấn Củ Chi Mới", "Xã Phước Vĩnh An Mới", "Xã Tân Thạnh Đông Mới",
      "Xã Lê Minh Xuân Mới", "Xã Tân Kiên Mới"
  ],
  "Hải Phòng": [ // Hợp nhất Hải Phòng + Hải Dương
      "Phường Hồng Bàng Mới", "Phường Ngô Quyền Mới", "Phường Lê Chân Mới", 
      "Thành phố Hải Dương Mới (Khu vực cũ)", "Huyện Thuỷ Nguyên Mới",
      "Thị trấn Kinh Môn Mới", "Thị trấn Chí Linh Mới", "Xã An Lão Mới"
  ],
  "Đà Nẵng": [ // Hợp nhất Đà Nẵng + Quảng Nam
      "Phường Hải Châu Mới", "Phường Sơn Trà Mới", "Thành phố Hội An Mới (Khu vực cũ)",
      "Thành phố Tam Kỳ Mới (Khu vực cũ)", "Huyện Hòa Vang Mới",
      "Xã Đại Lộc Mới", "Xã Duy Xuyên Mới", "Xã Điện Bàn Mới"
  ],
  "Huế": [ // Giữ nguyên theo Nghị quyết
      "Phường Phú Hội Mới", "Phường Vĩnh Ninh Mới", "Phường Thuận Thành Mới",
      "Xã Hương Thủy Mới", "Xã Hương Trà Mới", "Xã Phong Điền Mới",
      "Xã Quảng Điền Mới", "Xã Phú Vang Mới"
  ],
  "Cần Thơ": [ // Hợp nhất Cần Thơ + Sóc Trăng + Hậu Giang
      "Phường Ninh Kiều Mới", "Phường Cái Răng Mới", "Thành phố Sóc Trăng Mới",
      "Thành phố Vị Thanh Mới", "Huyện Phong Điền Mới", "Huyện Châu Thành Mới",
      "Huyện Long Mỹ Mới", "Huyện Kế Sách Mới"
  ],
  
  // Các tỉnh sau sáp nhập
  "Tuyên Quang": [ // Hợp nhất Tuyên Quang + Hà Giang
      "Thành phố Tuyên Quang Mới", "Thành phố Hà Giang Mới (Khu vực cũ)",
      "Xã Nà Hang Mới", "Xã Chiêm Hoá Mới", "Xã Đồng Văn Mới", "Xã Mèo Vạc Mới",
      "Xã Xín Mần Mới", "Xã Bắc Quang Mới"
  ],
  "Lào Cai": [ // Hợp nhất Lào Cai + Yên Bái
      "Thành phố Lào Cai Mới", "Thành phố Yên Bái Mới (Khu vực cũ)",
      "Xã Sa Pa Mới", "Xã Bảo Thắng Mới", "Xã Văn Chấn Mới", "Xã Mù Cang Chải Mới",
      "Xã Nghĩa Lộ Mới", "Xã Lục Yên Mới"
  ],
  "Thái Nguyên": [ // Hợp nhất Thái Nguyên + Bắc Kạn
      "Thành phố Thái Nguyên Mới", "Thành phố Sông Công Mới", 
      "Thành phố Bắc Kạn Mới (Khu vực cũ)", "Xã Định Hoá Mới", "Xã Chợ Mới Mới",
      "Xã Bạch Thông Mới", "Xã Phú Lương Mới", "Xã Võ Nhai Mới"
  ],
  "Phú Thọ": [ // Hợp nhất Phú Thọ + Vĩnh Phúc + Hòa Bình
      "Thành phố Việt Trì Mới", "Thành phố Vĩnh Yên Mới (Khu vực cũ)", 
      "Thành phố Hoà Bình Mới (Khu vực cũ)", "Xã Tam Đảo Mới", "Xã Lạc Thủy Mới",
      "Xã Thanh Sơn Mới", "Xã Yên Lập Mới", "Xã Lâm Thao Mới" , "Xã Phúc Sơn Mới", 
      "Xã Tân Lạc", "Xã Mường Bi"
  ],
  "Bắc Ninh": [ // Hợp nhất Bắc Ninh + Bắc Giang
      "Thành phố Bắc Ninh Mới", "Thành phố Bắc Giang Mới (Khu vực cũ)",
      "Thị xã Quế Võ Mới", "Huyện Việt Yên Mới", "Xã Lục Nam Mới",
      "Xã Yên Dũng Mới", "Xã Thuận Thành Mới", "Xã Lương Tài Mới"
  ],
  "Hưng Yên": [ // Hợp nhất Hưng Yên + Thái Bình
      "Thành phố Hưng Yên Mới", "Thành phố Thái Bình Mới (Khu vực cũ)",
      "Huyện Văn Lâm Mới", "Huyện Tiên Lữ Mới", "Huyện Đông Hưng Mới",
      "Huyện Kiến Xương Mới", "Xã Quỳnh Côi Mới", "Xã Hưng Hà Mới"
  ],
  "Ninh Bình": [ // Hợp nhất Ninh Bình + Hà Nam + Nam Định
      "Thành phố Ninh Bình Mới", "Thành phố Phủ Lý Mới (Khu vực cũ)", 
      "Thành phố Nam Định Mới (Khu vực cũ)", "Huyện Hoa Lư Mới",
      "Huyện Lý Nhân Mới", "Huyện Ý Yên Mới", "Xã Kim Sơn Mới", 
      "Xã Hải Hậu Mới"
  ],
  "Quảng Trị": [ // Hợp nhất Quảng Bình + Quảng Trị
      "Thành phố Đồng Hới Mới (Khu vực cũ)", "Thành phố Đông Hà Mới",
      "Huyện Quảng Ninh Mới", "Huyện Bố Trạch Mới", "Huyện Gio Linh Mới",
      "Huyện Vĩnh Linh Mới", "Xã Ba Đồn Mới", "Xã Khe Sanh Mới"
  ],
  "Quảng Ngãi": [ // Hợp nhất Kon Tum + Quảng Ngãi
      "Thành phố Quảng Ngãi Mới", "Thành phố Kon Tum Mới (Khu vực cũ)",
      "Huyện Bình Sơn Mới", "Huyện Sơn Tây Mới", "Huyện Đăk Hà Mới",
      "Huyện Kon Plông Mới", "Xã Trà Bồng Mới", "Xã Đăk Tô Mới"
  ],
  "Gia Lai": [ // Hợp nhất Gia Lai + Bình Định
      "Thành phố Pleiku Mới", "Thành phố Quy Nhơn Mới (Khu vực cũ)",
      "Thị xã An Khê Mới", "Huyện Chư Păh Mới", "Huyện An Nhơn Mới",
      "Huyện Tây Sơn Mới", "Xã Ayun Pa Mới", "Xã Kông Chro Mới"
  ],
  "Khánh Hòa": [ // Hợp nhất Ninh Thuận + Khánh Hòa
      "Thành phố Nha Trang Mới", "Thành phố Phan Rang - Tháp Chàm Mới (Khu vực cũ)",
      "Thành phố Cam Ranh Mới", "Huyện Diên Khánh Mới", "Huyện Ninh Sơn Mới",
      "Huyện Thuận Bắc Mới", "Xã Vạn Ninh Mới", "Xã Cam Lâm Mới"
  ],
  "Lâm Đồng": [ // Hợp nhất Lâm Đồng + Đắk Nông + Bình Thuận
      "Thành phố Đà Lạt Mới", "Thành phố Gia Nghĩa Mới (Khu vực cũ)", 
      "Thành phố Phan Thiết Mới (Khu vực cũ)", "Thị xã La Gi Mới",
      "Huyện Đức Trọng Mới", "Huyện Đắk Song Mới", "Xã Di Linh Mới", 
      "Xã Hàm Thuận Bắc Mới"
  ],
  "Đắk Lắk": [ // Hợp nhất Đắk Lắk + Phú Yên
      "Thành phố Buôn Ma Thuột Mới", "Thành phố Tuy Hòa Mới (Khu vực cũ)",
      "Huyện Cư M'gar Mới", "Huyện Ea H'Leo Mới", "Huyện Tuy An Mới",
      "Huyện Sông Hinh Mới", "Xã Krông Năng Mới", "Xã Ea Kar Mới"
  ],
  "Đồng Nai": [ // Hợp nhất Đồng Nai + Bình Phước
      "Thành phố Biên Hòa Mới", "Thành phố Đồng Xoài Mới (Khu vực cũ)",
      "Thị xã Long Khánh Mới", "Huyện Trảng Bom Mới", "Huyện Chơn Thành Mới",
      "Huyện Đồng Phú Mới", "Xã Vĩnh Cửu Mới", "Xã Bù Đăng Mới"
  ],
  "Tây Ninh": [ // Hợp nhất Tây Ninh + Long An
      "Thành phố Tây Ninh Mới", "Thành phố Tân An Mới (Khu vực cũ)",
      "Thị xã Trảng Bàng Mới", "Huyện Gò Dầu Mới", "Huyện Bến Lức Mới",
      "Huyện Đức Hòa Mới", "Xã Châu Thành Mới", "Xã Củ Chi Mới (Long An)"
  ],
  "Đồng Tháp": [ // Hợp nhất Tiền Giang + Đồng Tháp
      "Thành phố Cao Lãnh Mới", "Thành phố Mỹ Tho Mới (Khu vực cũ)",
      "Thị xã Hồng Ngự Mới", "Huyện Châu Thành Mới", "Huyện Cái Bè Mới",
      "Huyện Tân Phước Mới", "Xã Sa Đéc Mới", "Xã Lai Vung Mới"
  ],
  "Vĩnh Long": [ // Hợp nhất Bến Tre + Vĩnh Long + Trà Vinh
      "Thành phố Vĩnh Long Mới", "Thành phố Bến Tre Mới (Khu vực cũ)", 
      "Thành phố Trà Vinh Mới (Khu vực cũ)", "Huyện Châu Thành Mới",
      "Huyện Mỏ Cày Mới", "Huyện Càng Long Mới", "Xã Tam Bình Mới", 
      "Xã Giồng Trôm Mới"
  ],
  "An Giang": [ // Hợp nhất An Giang + Kiên Giang
      "Thành phố Long Xuyên Mới", "Thành phố Rạch Giá Mới (Khu vực cũ)",
      "Thành phố Châu Đốc Mới", "Thành phố Phú Quốc Mới", "Huyện Thoại Sơn Mới",
      "Huyện Gò Quao Mới", "Xã Tịnh Biên Mới", "Xã Kiên Lương Mới"
  ],
  "Cà Mau": [ // Hợp nhất Bạc Liêu + Cà Mau
      "Thành phố Cà Mau Mới", "Thành phố Bạc Liêu Mới (Khu vực cũ)",
      "Huyện Cái Nước Mới", "Huyện Trần Văn Thời Mới", "Huyện Phước Long Mới",
      "Huyện Hồng Dân Mới", "Xã Năm Căn Mới", "Xã Vĩnh Lợi Mới"
  ],
  
  // Các tỉnh giữ nguyên (Chỉ là ví dụ về cấp xã/phường)
  "Cao Bằng": [
      "Thành phố Cao Bằng", "Xã Bế Triều Mới", "Xã Bình Dương Mới", "Xã Công Trừng Mới", 
      "Xã Đức Long Mới", "Xã Hà Trì Mới", "Xã Hoàng Tung Mới"
  ],
  "Lai Châu": [
      "Thành phố Lai Châu", "Xã Bình Lư Mới", "Xã Bản Bo Mới", "Xã Bản Giang Mới",
      "Xã Dào San Mới", "Xã Khun Há Mới", "Xã Nậm Tăm Mới"
  ],
  "Điện Biên": [
      "Thành phố Điện Biên Phủ", "Xã Thanh Minh Mới", "Xã Mường Pồn Mới", 
      "Xã Nà Tấu Mới", "Xã Mường Ải Mới", "Xã Mường Nhé Mới", "Xã Tủa Chùa Mới"
  ],
  "Lạng Sơn": [
      "Thành phố Lạng Sơn", "Xã Chi Lăng Mới", "Xã Cao Lộc Mới", "Xã Văn Quan Mới", 
      "Xã Bình Gia Mới", "Xã Tràng Định Mới", "Xã Đình Lập Mới"
  ],
  "Sơn La": [
      "Thành phố Sơn La", "Xã Chiềng Sinh Mới", "Xã Mường La Mới", "Xã Mai Sơn Mới", 
      "Xã Thuận Châu Mới", "Xã Sông Mã Mới", "Xã Mộc Châu Mới"
  ],
  "Quảng Ninh": [
      "Thành phố Hạ Long", "Thành phố Móng Cái", "Thành phố Uông Bí", 
      "Phường Bãi Cháy Mới", "Phường Hồng Gai Mới", "Thị xã Đông Triều Mới", 
      "Huyện Vân Đồn Mới"
  ],
  "Thanh Hóa": [
      "Thành phố Thanh Hóa", "Thành phố Sầm Sơn", "Thành phố Bỉm Sơn", 
      "Huyện Tĩnh Gia Mới", "Huyện Hoằng Hóa Mới", "Huyện Quảng Xương Mới", 
      "Huyện Thọ Xuân Mới"
  ],
  "Nghệ An": [
      "Thành phố Vinh", "Thị xã Cửa Lò Mới", "Huyện Diễn Châu Mới", 
      "Huyện Quỳnh Lưu Mới", "Huyện Đô Lương Mới", "Huyện Thanh Chương Mới", 
      "Huyện Quỳ Hợp Mới"
  ],
  "Hà Tĩnh": [
      "Thành phố Hà Tĩnh", "Thị xã Hồng Lĩnh", "Huyện Can Lộc Mới", 
      "Huyện Cẩm Xuyên Mới", "Huyện Kỳ Anh Mới", "Huyện Hương Sơn Mới", 
      "Huyện Nghi Xuân Mới"
  ]
};