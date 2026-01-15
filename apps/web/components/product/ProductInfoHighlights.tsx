"use client";

const sellingPolicies = [
  {
    icon: "/ttc/product/product_info1_desc1_img.png",
    label: "Miễn phí giao hàng"
  },
  {
    icon: "/ttc/product/product_info1_desc2_img.png",
    label: "Cam kết hàng chính hãng 100%"
  },
  {
    icon: "/ttc/product/product_info1_desc3_img.png",
    label: "Hỗ trợ 24/7"
  }
];

const extraInfo = [
  {
    icon: "/ttc/product/product_info2_desc1_img.png",
    label: "Đổi trả trong 7 ngày"
  },
  {
    icon: "/ttc/product/product_info2_desc2_img.png",
    label: "Mở hộp kiểm tra nhận hàng"
  },
  {
    icon: "/ttc/product/product_info2_desc3_img.png",
    label: "Thanh toán nhanh chóng"
  }
];

export default function ProductInfoHighlights() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="border border-forest/10 bg-white p-6">
        <p className="text-sm font-semibold">Chính sách bán hàng</p>
        <div className="mt-4 space-y-3 text-sm text-ink/70">
          {sellingPolicies.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <img src={item.icon} alt={item.label} className="h-10 w-10" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-forest/10 bg-white p-6">
        <p className="text-sm font-semibold">Thông tin thêm</p>
        <div className="mt-4 space-y-3 text-sm text-ink/70">
          {extraInfo.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <img src={item.icon} alt={item.label} className="h-10 w-10" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
