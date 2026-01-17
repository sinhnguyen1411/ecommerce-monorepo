import { siteConfig } from "@/lib/site";
import { getPage } from "@/lib/api";

export const metadata = {
  title: `Giới thiệu | ${siteConfig.name}`,
  description:
    "Thông tin về công ty, năng lực cung ứng và dịch vụ tư vấn nông nghiệp."
};

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);
  const phoneDigits = siteConfig.phone.replace(/[^0-9+]/g, "");
  const fallbackContent =
    `<p><strong>Công ty Cổ phần Nông Dược Tam Bờ</strong> cung cấp vật tư nông nghiệp chính hãng và dịch vụ tư vấn kỹ thuật canh tác cho nhà vườn tại khu vực Di Linh - Lâm Đồng.</p>` +
    `<p>Chúng tôi đồng hành cùng bà con từ khâu lựa chọn giống, giải pháp dinh dưỡng, đến quy trình chăm sóc tối ưu năng suất và chất lượng nông sản theo từng mùa vụ.</p>` +
    `<h3>Hướng đi của chúng tôi</h3>` +
    `<ul>` +
    `<li>Tập trung vào danh mục sản phẩm có nguồn gốc rõ ràng, chất lượng ổn định.</li>` +
    `<li>Tư vấn dựa trên thực tế canh tác tại địa phương.</li>` +
    `<li>Hỗ trợ kỹ thuật trong suốt vòng đời cây trồng.</li>` +
    `</ul>`;
  const storyHtml = page?.content || fallbackContent;

  return (
    <div className="layout-pageDetail about-page">
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
                <strong>Giới thiệu</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-surface">
            <div className="about-hero-content">
              <p className="about-eyebrow">Giới thiệu</p>
              <h1>Giải pháp vật tư và tư vấn nông nghiệp đáng tin cậy</h1>
              <p className="about-lead">
                {siteConfig.name} tập trung vào chất lượng sản phẩm, tư vấn kỹ thuật chuẩn thực tế
                canh tác và đồng hành lâu dài cùng nhà vườn trong từng mùa vụ.
              </p>
              <div className="about-hero-actions">
                <a className="button" href="/pages/lien-he">
                  Liên hệ tư vấn
                </a>
                <a className="about-ghost" href="/pages/hoi-dap-cung-nha-nong">
                  Hỏi đáp kỹ thuật
                </a>
              </div>
              <div className="about-pill-list">
                <span className="about-pill">Nguồn gốc rõ ràng</span>
                <span className="about-pill">Tư vấn theo mùa vụ</span>
                <span className="about-pill">Hậu mãi tận tâm</span>
              </div>
            </div>
            <div className="about-hero-card">
              <p className="about-card-title">Điểm mạnh nổi bật</p>
              <ul className="about-checklist">
                <li>Danh mục vật tư nông nghiệp chính hãng, kiểm soát chất lượng.</li>
                <li>Đội ngũ am hiểu thổ nhưỡng và cây trồng tại địa phương.</li>
                <li>Giải pháp kỹ thuật đồng bộ, tối ưu chi phí cho nhà vườn.</li>
              </ul>
              <div className="about-hero-meta">
                <div>
                  <span className="about-meta-label">Khu vực phục vụ</span>
                  <span className="about-meta-value">Di Linh - Lâm Đồng</span>
                </div>
                <div>
                  <span className="about-meta-label">Liên hệ</span>
                  <span className="about-meta-value">{siteConfig.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-card">
              <h3>Uy tín nguồn hàng</h3>
              <p>Hợp tác cùng các nhà cung ứng chính thống, đảm bảo chất lượng và tính ổn định.</p>
            </div>
            <div className="about-card">
              <h3>Đồng hành kỹ thuật</h3>
              <p>Tư vấn canh tác dựa trên điều kiện thổ nhưỡng và mục tiêu năng suất thực tế.</p>
            </div>
            <div className="about-card">
              <h3>Hiệu quả kinh tế</h3>
              <p>Đưa ra giải pháp phù hợp ngân sách, giảm chi phí và tối ưu giá trị mùa vụ.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-7 col-md-12 col-12">
              <div className="about-story card-surface">
                <h2>Hành trình & định hướng</h2>
                <div
                  className="content-pageDetail typeList-style"
                  dangerouslySetInnerHTML={{
                    __html: storyHtml
                  }}
                />
              </div>
            </div>
            <div className="col-lg-5 col-md-12 col-12">
              <div className="about-values card-surface">
                <h2>Giá trị cốt lõi</h2>
                <ul className="about-value-list">
                  <li>
                    <strong>Chính trực:</strong> minh bạch về nguồn gốc và chất lượng sản phẩm.
                  </li>
                  <li>
                    <strong>Thực tiễn:</strong> tư vấn dựa trên dữ liệu mùa vụ và điều kiện địa phương.
                  </li>
                  <li>
                    <strong>Đồng hành:</strong> hỗ trợ kỹ thuật xuyên suốt vòng đời cây trồng.
                  </li>
                  <li>
                    <strong>Bền vững:</strong> ưu tiên giải pháp cân bằng hiệu quả và môi trường.
                  </li>
                </ul>
                <div className="about-contact">
                  <p className="about-contact-title">Thông tin liên hệ</p>
                  <p>{siteConfig.address}</p>
                  <p>
                    <a href={`tel:${phoneDigits}`}>{siteConfig.phone}</a> - {siteConfig.fax}
                  </p>
                  <p>
                    <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                  </p>
                  <a
                    className="about-social"
                    href={siteConfig.social.facebook}
                    target="_blank"
                    rel="noopener"
                  >
                    Facebook: {siteConfig.social.facebook}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="about-grid about-grid--services">
            <div className="about-card">
              <h3>Vật tư nông nghiệp</h3>
              <p>Phân bón, thuốc bảo vệ thực vật và giải pháp dinh dưỡng phù hợp từng mùa vụ.</p>
            </div>
            <div className="about-card">
              <h3>Tư vấn kỹ thuật</h3>
              <p>Đưa ra phác đồ chăm sóc, xử lý sâu bệnh và tăng năng suất bền vững.</p>
            </div>
            <div className="about-card">
              <h3>Hậu mãi tận nơi</h3>
              <p>Đồng hành sau bán hàng, phản hồi nhanh, tối ưu hiệu quả canh tác.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="container">
          <div className="about-cta-card">
            <div>
              <h2>Nhận tư vấn phù hợp cho mùa vụ hiện tại</h2>
              <p>
                Đội ngũ kỹ thuật sẵn sàng hỗ trợ lựa chọn giải pháp đúng nhu cầu và tiết kiệm chi
                phí.
              </p>
            </div>
            <div className="about-cta-actions">
              <a className="button" href="/pages/lien-he">
                Gửi yêu cầu
              </a>
              <a className="about-cta-link" href={`tel:${phoneDigits}`}>
                Hotline {siteConfig.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
