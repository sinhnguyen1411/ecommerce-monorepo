export const metadata = {
  title: "Chính sách đổi trả | Nông nghiệp TTC",
  description: "Quy định đổi trả sản phẩm tại TTC."
};

const returnPolicyHtml =
  "<h2><span style=\"font-size:18px\">CHÍNH SÁCH ĐỔI TRẢ HÀNG HÓA - CÔNG TY TTC</span></h2>" +
  "<h3><span style=\"font-size:18px\">1. Điều kiện đổi trả</span></h3>" +
  "<p><span style=\"font-size:18px\">Công ty TTC cam kết đảm bảo quyền lợi tối đa cho khách hàng khi mua sản phẩm. Quý khách có thể yêu cầu đổi hoặc trả hàng trong các trường hợp sau:</span></p>" +
  "<ul><li><p><span style=\"font-size:18px\">Sản phẩm không đúng chủng loại, mẫu mã như đơn hàng đã đặt hoặc khác so với thông tin hiển thị trên website tại thời điểm đặt hàng.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\">Sản phẩm không đủ số lượng, thiếu phụ kiện hoặc thiếu bộ phận theo đơn hàng.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\">Sản phẩm bị hư hỏng, rách bao bì, bong tróc, bể vỡ… do quá trình vận chuyển hoặc lỗi của nhà cung cấp.</span></p></li></ul>" +
  "<p><span style=\"font-size:18px\">Quý khách vui lòng kiểm tra kỹ hàng hóa ngay khi nhận. Nếu phát hiện lỗi, xin vui lòng thông báo và phối hợp cung cấp các giấy tờ liên quan (như hình ảnh sản phẩm, biên nhận giao hàng…) để TTC nhanh chóng xử lý việc đổi/trả hàng hóa.</span></p>" +
  "<hr><h3><span style=\"font-size:18px\">2. Quy định về thời gian thông báo và gửi trả sản phẩm</span></h3>" +
  "<ul><li><p><span style=\"font-size:18px\"><strong>Thời gian thông báo đổi/trả:</strong><br>Trong vòng 48 giờ kể từ khi nhận sản phẩm nếu phát hiện sản phẩm bị thiếu, lỗi kỹ thuật hoặc hư hỏng trong quá trình vận chuyển.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Thời gian gửi lại sản phẩm:</strong><br>Trong vòng 14 ngày kể từ khi nhận hàng. Sản phẩm phải được giữ nguyên tình trạng ban đầu, đầy đủ phụ kiện (nếu có).</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Địa điểm đổi/trả:</strong></span></p>" +
  "<ul><li><p><span style=\"font-size:18px\">Khách hàng có thể mang sản phẩm trực tiếp đến văn phòng/cửa hàng TTC.</span></p></li>" +
  "<li><p><span style=\"font-size:18px\">Hoặc gửi sản phẩm qua đường bưu điện đến địa chỉ công ty TTC. Chi phí vận chuyển sẽ được hỗ trợ theo thỏa thuận tùy từng trường hợp cụ thể.</span></p></li></ul></li></ul>" +
  "<hr><h3><span style=\"font-size:18px\">3. Hỗ trợ &amp; phản hồi</span></h3>" +
  "<p><span style=\"font-size:18px\">Trong mọi trường hợp có khiếu nại hoặc góp ý liên quan đến chất lượng sản phẩm và dịch vụ, quý khách vui lòng liên hệ <strong>đường dây chăm sóc khách hàng TTC</strong>:</span></p>" +
  "<ul><li><p><span style=\"font-size:18px\"><strong>Hotline:</strong> 0559.588.666</span></p></li>" +
  "<li><p><span style=\"font-size:18px\"><strong>Email:</strong> <a rel=\"noopener\">congtyttc.bg@gmail.com</a></span></p></li></ul>" +
  "<p><span style=\"font-size:18px\">Chúng tôi luôn trân trọng mọi phản hồi và cam kết xử lý nhanh chóng, minh bạch để bảo vệ quyền lợi khách hàng một cách tốt nhất.</span></p>";

export default function ReturnPolicyPage() {
  return (
    <div className="layout-pageDetail">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <a href="/" target="_self">
                  Trang chủ
                </a>
              </li>
              <li className="active">
                <strong>Chính sách đổi trả</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-9 col-md-8 col-12 column-left mg-page">
            <div className="wrapper-pageDetail">
              <div className="heading-pageDetail">
                <h1>Chính sách đổi trả</h1>
              </div>
              <div
                className="content-pageDetail typeList-style"
                dangerouslySetInnerHTML={{ __html: returnPolicyHtml }}
              />
            </div>
          </div>
          <div className="col-lg-3 col-md-4 col-12 column-right mg-page">
            <aside className="sidebar-page sticky-info" />
          </div>
        </div>
      </div>
    </div>
  );
}
