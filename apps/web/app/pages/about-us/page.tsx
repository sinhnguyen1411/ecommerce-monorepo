import { siteConfig } from "@/lib/site";
import { getPage } from "@/lib/api";

export const metadata = {
  title: `Giới thiệu | ${siteConfig.name}`,
  description:
    "Thông tin về Công ty Cổ phần Nông Dược Tam Bố và các dịch vụ tư vấn nông nghiệp."
};

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);
  const fallbackContent =
    `<p><span style="font-size:18px"><strong>Công ty Cổ phần Nông Dược Tam Bố</strong> chuyên cung cấp vật tư nông nghiệp và phân thuốc chính hãng, đồng hành cùng bà con nông dân trong sản xuất nông nghiệp bền vững tại khu vực Đức Trọng - Di Linh, Lâm Đồng.</span></p>` +
    `<p><span style="font-size:18px">Chúng tôi tập trung tư vấn các loại cây trồng, cây công nghiệp và rau màu, đồng thời hỗ trợ kỹ thuật canh tác để nâng cao năng suất và chất lượng nông sản.</span></p>` +
    `<p><span style="font-size:18px"><strong>Thông tin liên hệ:</strong></span></p>` +
    `<ul>` +
    `<li><p><span style="font-size:18px">Địa chỉ: ${siteConfig.address}</span></p></li>` +
    `<li><p><span style="font-size:18px">KTV: ${siteConfig.phone} - ${siteConfig.fax}</span></p></li>` +
    `<li><p><span style="font-size:18px">Email: ${siteConfig.email}</span></p></li>` +
    `</ul>` +
    `<p><span style="font-size:18px"><strong>Liên kết mạng xã hội:</strong></span></p>` +
    `<ul><li><p><span style="font-size:18px">Facebook: <a rel="noopener" target="_new" href="${siteConfig.social.facebook}">${siteConfig.social.facebook}</a></span></p></li></ul>`;

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
                <strong>Giới thiệu về Công ty Cổ phần Nông Dược Tam Bố</strong>
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
                <h1>Giới thiệu về Công ty Cổ phần Nông Dược Tam Bố</h1>
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
