import Link from "next/link";
import { getQnA } from "@/lib/api";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: `Hỏi đáp cùng nhà nông | ${siteConfig.name}`,
  description:
    "Tổng hợp câu hỏi thường gặp về canh tác, dinh dưỡng cây trồng và sử dụng sản phẩm."
};

const fallbackItems = [
  {
    question: "Làm sao giữ nông sản tươi khi vận chuyển xa?",
    answer:
      "Thu hoạch đúng độ chín, đóng gói trong ngày và bảo quản ở nhiệt độ phù hợp giúp giảm thất thoát và giữ chất lượng ổn định."
  },
  {
    question: "Cửa hàng có giao hàng ngoài tỉnh không?",
    answer:
      "Có. Chúng tôi giao qua đối tác vận chuyển, thời gian nhận hàng tùy khu vực và được xác nhận trước khi gửi."
  },
  {
    question: "Hữu cơ khác gì so với phân bón thông thường?",
    answer:
      "Hữu cơ giúp cải thiện đất dài hạn, tăng vi sinh có lợi và giảm tồn dư hóa chất, phù hợp canh tác bền vững."
  },
  {
    question: "Sản phẩm Organic Master phù hợp cây trồng nào?",
    answer:
      "Phù hợp đa số cây ăn trái, cây công nghiệp, rau màu và hoa kiểng. Liều dùng sẽ được tư vấn theo mùa vụ."
  },
  {
    question: "Bao lâu thấy hiệu quả sau khi sử dụng?",
    answer:
      "Thông thường sau 7-10 ngày, cây cải thiện màu lá, rễ phát triển tốt hơn và phục hồi nhanh hơn."
  },
  {
    question: "Tam Bờ có hỗ trợ kỹ thuật canh tác không?",
    answer:
      "Có. Đội ngũ kỹ thuật tư vấn miễn phí qua điện thoại hoặc Zalo, hỗ trợ theo từng mùa vụ."
  }
];

const topicTags = [
  "Dinh dưỡng cây trồng",
  "Phòng trừ sâu bệnh",
  "Cải tạo đất",
  "Quy trình bón phân",
  "Bảo quản nông sản"
];

export default async function QnAPage() {
  const items = await getQnA();
  const resolvedItems = items.length > 0 ? items : fallbackItems;
  const phoneDigits = siteConfig.phone.replace(/[^0-9+]/g, "");
  const formatIndex = (index: number) => String(index + 1).padStart(2, "0");

  return (
    <div className="layout-pageDetail qna-page">
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
                <strong>Hỏi đáp cùng nhà nông</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-9 col-md-8 col-12 column-left mg-page">
            <div className="wrapper-pageDetail">
              <div className="qna-hero card-surface">
                <div className="qna-hero-content">
                  <p className="qna-eyebrow">Tư vấn nông nghiệp</p>
                  <h1>Hỏi đáp cùng nhà nông</h1>
                  <p className="qna-subtitle">
                    Tổng hợp câu hỏi thường gặp về canh tác, dinh dưỡng cây trồng và cách sử dụng
                    sản phẩm theo điều kiện thực tế tại địa phương.
                  </p>
                  <div className="qna-hero-actions">
                    <a className="btn-primary" href={`tel:${phoneDigits}`}>
                      Gọi tư vấn
                    </a>
                    <a
                      className="btn-ghost"
                      href={siteConfig.social.zalo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat Zalo
                    </a>
                  </div>
                  <div className="qna-tags">
                    {topicTags.map((tag) => (
                      <span key={tag} className="qna-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="qna-hero-panel">
                  <div className="qna-stat">
                    <span className="qna-stat-value">{resolvedItems.length}</span>
                    <span className="qna-stat-label">Câu hỏi nổi bật</span>
                  </div>
                  <div className="qna-stat">
                    <span className="qna-stat-value">24h</span>
                    <span className="qna-stat-label">Phản hồi</span>
                  </div>
                  <div className="qna-stat">
                    <span className="qna-stat-value">Miễn phí</span>
                    <span className="qna-stat-label">Tư vấn kỹ thuật</span>
                  </div>
                </div>
              </div>
              <div className="qna-toolbar">
                <p>
                  Chọn câu hỏi phù hợp hoặc liên hệ trực tiếp để nhận giải pháp theo mùa vụ của
                  bạn.
                </p>
                <div className="qna-toolbar-actions">
                  <a className="about-link" href={`mailto:${siteConfig.email}`}>
                    Gửi câu hỏi qua email
                  </a>
                </div>
              </div>
              <div className="content-pageDetail qna-list">
                {resolvedItems.map((item, index) => (
                  <article key={`${item.question}-${index}`} className="qna-card">
                    <div className="qna-card-header">
                      <span className="qna-index">{formatIndex(index)}</span>
                      <h3>{item.question}</h3>
                    </div>
                    <p className="qna-answer">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-4 col-12 column-right mg-page">
            <aside className="sidebar-page sticky-info qna-aside">
              <div className="qna-aside-card card-surface">
                <h2>Cần hỗ trợ nhanh?</h2>
                <p>
                  Liên hệ trực tiếp để được tư vấn kỹ thuật theo từng mùa vụ và tình hình thực tế.
                </p>
                <div className="qna-contact">
                  <a className="qna-contact-item" href={`tel:${phoneDigits}`}>
                    <span>Hotline</span>
                    <strong>{siteConfig.phone}</strong>
                  </a>
                  <a className="qna-contact-item" href={`mailto:${siteConfig.email}`}>
                    <span>Email</span>
                    <strong>{siteConfig.email}</strong>
                  </a>
                </div>
              </div>
              <div className="qna-aside-card card-surface">
                <h2>Chủ đề phổ biến</h2>
                <ul className="qna-topic-list">
                  <li>Hữu cơ & cải tạo đất</li>
                  <li>Dinh dưỡng cây trồng</li>
                  <li>Phòng trừ sâu bệnh</li>
                  <li>Quy trình bón phân</li>
                  <li>Bảo quản nông sản</li>
                </ul>
              </div>
              <div className="qna-aside-card card-surface">
                <h2>Chính sách tham khảo</h2>
                <ul className="qna-link-list">
                  <li>
                    <Link href={siteConfig.policies.returnPolicy}>Chính sách đổi trả</Link>
                  </li>
                  <li>
                    <Link href={siteConfig.policies.privacyPolicy}>Chính sách bảo mật</Link>
                  </li>
                  <li>
                    <Link href={siteConfig.policies.termsOfService}>Điều khoản dịch vụ</Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
