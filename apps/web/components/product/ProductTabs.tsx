"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const returnPolicyHtml =
  "<h2><span style=\"font-size:18px\">CHÍNH SÁCH ĐỔI TRẢ HÀNG HÓA - CÔNG TY Tam Bố</span></h2>" +
  "<h3><span style=\"font-size:18px\">1. Điều kiện đổi trả</span></h3>" +
  "<p><span style=\"font-size:18px\">Công ty Tam Bố cam kết đảm bảo quyền lợi tối đa cho khách hàng khi mua sản phẩm. Quý khách có thể yêu cầu đổi hoặc trả hàng trong các trường hợp sau:</span></p>" +
  "<ul><li><p><span style=\"font-size:18px\">Sản phẩm không đúng chủng loại, mẫu mã như đơn hàng đã đặt hoặc khác so với thông tin hiển thị trên website tại thời điểm đặt hàng.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\">Sản phẩm không đủ số lượng, thiếu phụ kiện hoặc thiếu bộ phận theo đơn hàng.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\">Sản phẩm bị hư hỏng, rách bao bì, bong tróc, bể vỡ… do quá trình vận chuyển hoặc lỗi của nhà cung cấp.</span></p></li></ul>" +
  "<p><span style=\"font-size:18px\">Quý khách vui lòng kiểm tra kỹ hàng hóa ngay khi nhận. Nếu phát hiện lỗi, xin vui lòng thông báo và phối hợp cung cấp các giấy tờ liên quan (như hình ảnh sản phẩm, biên nhận giao hàng…) để Tam Bố nhanh chóng xử lý việc đổi/trả hàng hóa.</span></p>" +
  "<hr><h3><span style=\"font-size:18px\">2. Quy định về thời gian thông báo và gửi trả sản phẩm</span></h3>" +
  "<ul><li><p><span style=\"font-size:18px\"><strong>Thời gian thông báo đổi/trả:</strong><br>Trong vòng 48 giờ kể từ khi nhận sản phẩm nếu phát hiện sản phẩm bị thiếu, lỗi kỹ thuật hoặc hư hỏng trong quá trình vận chuyển.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Thời gian gửi lại sản phẩm:</strong><br>Trong vòng 14 ngày kể từ khi nhận hàng. Sản phẩm phải được giữ nguyên tình trạng ban đầu, đầy đủ phụ kiện (nếu có).</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Địa điểm đổi/trả:</strong></span></p>" +
  "<ul><li><p><span style=\"font-size:18px\">Khách hàng có thể mang sản phẩm trực tiếp đến văn phòng/cửa hàng Tam Bố.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\">Hoặc gửi sản phẩm qua đường bưu điện đến địa chỉ công ty Tam Bố. Chi phí vận chuyển sẽ được hỗ trợ theo thỏa thuận tùy từng trường hợp cụ thể.</span></p></li></ul></li></ul>" +
  "<hr><h3><span style=\"font-size:18px\">3. Hỗ trợ &amp; phản hồi</span></h3>" +
  "<p><span style=\"font-size:18px\">Trong mọi trường hợp có khiếu nại hoặc góp ý liên quan đến chất lượng sản phẩm và dịch vụ, quý khách vui lòng liên hệ <strong>đường dây chăm sóc khách hàng Tam Bố</strong>:</span></p>" +
  "<ul><li><p><span style=\"font-size:18px\"><strong>Hotline:</strong> 0942.204.279 - 0915.192.579</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Email:</strong> <a rel=\"noopener\">cskh@nongduoctambo.vn</a></span></p></li></ul>" +
  "<p><span style=\"font-size:18px\">Chúng tôi luôn trân trọng mọi phản hồi và cam kết xử lý nhanh chóng, minh bạch để bảo vệ quyền lợi khách hàng một cách tốt nhất.</span></p>";

const termsHtml =
  "<h2><span style=\"font-size:18px\">ĐIỀU KHOẢN DỊCH VỤ - CÔNG TY Tam Bố</span></h2>" +
  "<h3><span style=\"font-size:18px\">1. Giới thiệu</span></h3>" +
  "<p><span style=\"font-size:18px\">Chào mừng quý khách hàng đến với website chính thức của Công ty Tam Bố.</span></p>" +
  "<p><span style=\"font-size:18px\">Khi truy cập và sử dụng website của chúng tôi, quý khách đồng ý tuân thủ và bị ràng buộc bởi các điều khoản dịch vụ này. Công ty Tam Bố có quyền thay đổi, chỉnh sửa, bổ sung hoặc loại bỏ bất kỳ nội dung nào trong Điều khoản dịch vụ vào bất kỳ thời điểm nào mà không cần thông báo trước. Mọi thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.</span></p>" +
  "<p><span style=\"font-size:18px\">Việc quý khách tiếp tục sử dụng website sau khi các điều khoản được cập nhật đồng nghĩa với việc quý khách chấp nhận và đồng ý với những thay đổi đó. Quý khách vui lòng kiểm tra thường xuyên để nắm rõ thông tin cập nhật.</span></p>" +
  "<hr><h3><span style=\"font-size:18px\">2. Hướng dẫn sử dụng website</span></h3>" +
  "<p><span style=\"font-size:18px\">Website của Công ty Tam Bố được xây dựng nhằm cung cấp thông tin, giới thiệu sản phẩm và hỗ trợ mua hàng cho quý khách.</span></p>" +
  "<p><span style=\"font-size:18px\">Khi truy cập, quý khách cần đảm bảo từ đủ 18 tuổi trở lên hoặc thực hiện dưới sự giám sát của cha mẹ hay người giám hộ hợp pháp. Quý khách phải có đầy đủ năng lực hành vi dân sự để tham gia giao dịch mua bán hàng hóa theo đúng quy định của pháp luật Việt Nam.</span></p>" +
  "<p><span style=\"font-size:18px\">Khi đăng ký tài khoản hoặc đặt hàng, quý khách đồng ý nhận thông tin từ Tam Bố qua email, bao gồm tin tức sản phẩm, chương trình ưu đãi và các thông tin liên quan. Nếu không muốn nhận email quảng cáo, quý khách có thể hủy đăng ký bất kỳ lúc nào bằng cách nhấp vào đường dẫn \"Hủy đăng ký\" ở cuối mỗi email.</span></p>" +
  "<hr><h3><span style=\"font-size:18px\">3. Chính sách thanh toán an toàn và tiện lợi</span></h3>" +
  "<p><span style=\"font-size:18px\">Tam Bố hỗ trợ nhiều hình thức thanh toán để đảm bảo sự tiện lợi và an toàn cho quý khách. Cụ thể:</span></p>" +
  "<ul><li><p><span style=\"font-size:18px\"><strong>Cách 1:</strong> Thanh toán trực tiếp khi mua hàng tại địa chỉ Công ty Tam Bố.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Cách 2:</strong> Thanh toán khi nhận hàng (COD - giao hàng và thu tiền tận nơi).</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Cách 3:</strong> Thanh toán online qua chuyển khoản ngân hàng hoặc các phương thức thanh toán điện tử được Tam Bố hỗ trợ.</span></p></li></ul>" +
  "<p><span style=\"font-size:18px\">Tam Bố cam kết bảo mật tuyệt đối thông tin thanh toán của quý khách hàng và tuân thủ đầy đủ quy định bảo mật dữ liệu theo pháp luật hiện hành.</span></p>";

export default function ProductTabs({ description }: { description?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Tabs
      defaultValue="description"
      className="border border-forest/10 bg-white p-6"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
        <TabsTrigger value="return">Chính sách đổi trả</TabsTrigger>
        <TabsTrigger value="terms">Điều khoản dịch vụ</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="pt-4 text-sm text-ink/70">
        <div className={`${expanded ? "" : "max-h-48 overflow-hidden"}`}>
          {description ? (
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p>Nội dung đang được cập nhật.</p>
          )}
        </div>
        <button
          className="mt-4 text-sm font-semibold text-forest"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      </TabsContent>
      <TabsContent value="return" className="pt-4 text-sm text-ink/70">
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: returnPolicyHtml }}
        />
      </TabsContent>
      <TabsContent value="terms" className="pt-4 text-sm text-ink/70">
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: termsHtml }} />
      </TabsContent>
    </Tabs>
  );
}
