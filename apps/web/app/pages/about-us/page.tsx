import { getPage } from "@/lib/api";

export const metadata = {
  title: "Giới thiệu | Nông nghiệp TTC",
  description:
    "Trang giới thiệu giúp khách hàng hiểu rõ hơn về cửa hàng của bạn. Hãy cung cấp thông tin cụ thể về việc kinh doanh, về cửa hàng, thông tin liên hệ."
};

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);
  const fallbackContent =
    "<p><span style=\"font-size:18px\">Công ty TTC là đơn vị tiên phong trong lĩnh vực phân bón hữu cơ, vi sinh và các giải pháp nông nghiệp bền vững tại Việt Nam. Với hơn 10 năm kinh nghiệm hoạt động trong ngành, TTC đã xây dựng uy tín vững chắc, trở thành địa chỉ tin cậy của hàng nghìn nông dân và đối tác trên toàn quốc.</span></p>" +
    "<p><span style=\"font-size:18px\">Chúng tôi cam kết mang đến những sản phẩm chất lượng cao, an toàn và thân thiện với môi trường, giúp bà con nông dân nâng cao năng suất, cải thiện chất lượng nông sản và bảo vệ sức khỏe đất đai lâu dài. Ngoài việc cung cấp sản phẩm, TTC còn đặc biệt chú trọng đào tạo, chuyển giao kỹ thuật và tư vấn miễn phí, đồng hành cùng khách hàng trong suốt quá trình canh tác.</span></p>" +
    "<p><span style=\"font-size:18px\">Hiểu được xu thế hiện đại, TTC đã phát triển mạnh kênh bán hàng online, giúp khách hàng dễ dàng đặt mua và nhận tư vấn trực tuyến nhanh chóng, tiện lợi.</span></p>" +
    "<p><span style=\"font-size:18px\"><strong>Thông tin liên hệ:</strong></span></p>" +
    "<ul><li><p><span style=\"font-size:18px\">Địa chỉ: Tân Sơn, Quỳnh Sơn, Thành phố Bắc Giang, Bắc Giang, Việt Nam</span></p></li><li><p><span style=\"font-size:18px\">Điện thoại: 0559.588.666</span></p></li><li><p><span style=\"font-size:18px\">Fax: 0559.588.666</span></p></li><li><p><span style=\"font-size:18px\">Email: congtyttc.bg@gmail.com</span></p></li></ul>" +
    "<p><span style=\"font-size:18px\"><strong>Liên kết mạng xã hội:</strong></span></p>" +
    "<ul><li><p><span style=\"font-size:18px\">Facebook: <a rel=\"noopener\" target=\"_new\" href=\"https://www.facebook.com/nongnghiepxanhTTC\">https://www.facebook.com/nongnghiepxanhTTC</a></span></p></li></ul>";

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
                <strong>Giới thiệu về Công ty TTC</strong>
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
                <h1>Giới thiệu về Công ty TTC</h1>
              </div>
              <div
                className="content-pageDetail typeList-style"
                dangerouslySetInnerHTML={{
                  __html: page?.content || fallbackContent
                }}
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
