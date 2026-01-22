"use client";

import Image from "next/image";

const sellingPolicies = [
  {
    icon: "/tam-bo/product/product_info1_desc1_img.png",
    label: "Miễn phí giao hàng"
  },
  {
    icon: "/tam-bo/product/product_info1_desc2_img.png",
    label: "Cam kết hàng chính hãng 100%"
  },
  {
    icon: "/tam-bo/product/product_info1_desc3_img.png",
    label: "Hỗ trợ 24/7"
  }
];

const extraInfo = [
  {
    icon: "/tam-bo/product/product_info2_desc1_img.png",
    label: "Đổi trả trong 7 ngày"
  },
  {
    icon: "/tam-bo/product/product_info2_desc2_img.png",
    label: "Mở hộp kiểm tra nhận hàng"
  },
  {
    icon: "/tam-bo/product/product_info2_desc3_img.png",
    label: "Thanh toán nhanh chóng"
  }
];

export default function ProductInfoHighlights() {
  return (
    <div className="product-subinfo">
      <div className="subinfo-block">
        <div className="subtitle">
          <span>Chính sách bán hàng</span>
        </div>
        <div className="subinfo-list">
          {sellingPolicies.map((item) => (
            <div key={item.label} className="item">
              <div className="item--img">
                <Image src={item.icon} alt={item.label} width={48} height={48} className="h-12 w-12" sizes="48px" />
              </div>
              <div className="item--text">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="subinfo-block">
        <div className="subtitle">
          <span>Thông tin thêm</span>
        </div>
        <div className="subinfo-list">
          {extraInfo.map((item) => (
            <div key={item.label} className="item">
              <div className="item--img">
                <Image src={item.icon} alt={item.label} width={48} height={48} className="h-12 w-12" sizes="48px" />
              </div>
              <div className="item--text">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
