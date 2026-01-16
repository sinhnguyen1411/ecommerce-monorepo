export const metadata = {
  title: "Điều khoản dịch vụ | Nông Dược Tam Bố",
  description: "Quy định đặt hàng, thanh toán và giao hàng."
};

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

export default function TermsOfServicePage() {
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
                <strong>Điều khoản dịch vụ</strong>
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
                <h1>Điều khoản dịch vụ</h1>
              </div>
              <div
                className="content-pageDetail typeList-style"
                dangerouslySetInnerHTML={{ __html: termsHtml }}
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
