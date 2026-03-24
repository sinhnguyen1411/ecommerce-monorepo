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
    question: "Mưa kéo dài, nên phun phòng nấm vào thời điểm nào?",
    answer:
      "Ưu tiên phun phòng trước các đợt mưa lớn 1-2 ngày, chọn thời điểm ráo lá và luân phiên hoạt chất để hạn chế kháng thuốc."
  },
  {
    question: "Bao lâu nên bón hữu cơ để cải tạo đất vườn cà phê?",
    answer:
      "Nên duy trì định kỳ theo đầu và cuối mùa mưa, kết hợp che phủ gốc để tăng mùn và giữ ẩm ổn định cho vùng rễ."
  },
  {
    question: "Cây sầu riêng suy rễ sau mưa cần xử lý gì trước?",
    answer:
      "Cần thoát nước nhanh, giảm bón đạm, sau đó phục hồi rễ bằng hữu cơ hoai mục và vi sinh để tránh sốc cây."
  },
  {
    question: "Bón phân qua lá cho cây có múi lúc nào hiệu quả?",
    answer:
      "Phun vào sáng sớm hoặc chiều mát, tránh nắng gắt và mưa gần kề để tăng hấp thu và hạn chế cháy lá."
  },
  {
    question: "Lịch bón cho rau ăn lá ngắn ngày nên chia thế nào?",
    answer:
      "Nên chia 2-3 lần bón nhẹ theo từng giai đoạn sinh trưởng, ưu tiên cân đối đạm-kali và giảm đạm trước thu hoạch."
  },
  {
    question: "Nhà kính bị ẩm cao, giảm bệnh bằng cách nào?",
    answer:
      "Tăng thông gió chủ động, tưới vào đầu ngày, hạn chế đọng nước trên lá và vệ sinh tàn dư thường xuyên."
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

type QnATopic = {
  slug:
    | "huu-co-cai-tao-dat"
    | "dinh-duong-cay-trong"
    | "phong-tru-sau-benh"
    | "quy-trinh-bon-phan"
    | "bao-quan-nong-san";
  label: string;
  keywords: string[];
};

type QnAPageProps = {
  searchParams?: Promise<{
    topic?: string;
    page?: string;
  }>;
};

const ITEMS_PER_PAGE = 6;
const pageBasePath = "/pages/hoi-dap-cung-nha-nong";

const topics: QnATopic[] = [
  {
    slug: "huu-co-cai-tao-dat",
    label: "Hữu cơ & cải tạo đất",
    keywords: [
      "huu co",
      "cai tao dat",
      "vi sinh dat",
      "do phi dat",
      "mun",
      "re",
      "thoat nuoc"
    ]
  },
  {
    slug: "dinh-duong-cay-trong",
    label: "Dinh dưỡng cây trồng",
    keywords: [
      "dinh duong",
      "phan bon la",
      "vi luong",
      "cay co mui",
      "rau an la",
      "sau rieng",
      "ca phe"
    ]
  },
  {
    slug: "phong-tru-sau-benh",
    label: "Phòng trừ sâu bệnh",
    keywords: [
      "sau benh",
      "nam benh",
      "ruoi vang",
      "bo tri",
      "thoi re",
      "phun phong",
      "khang thuoc"
    ]
  },
  {
    slug: "quy-trinh-bon-phan",
    label: "Quy trình bón phân",
    keywords: [
      "quy trinh bon",
      "lich bon",
      "chia lan",
      "bon goc",
      "bon qua la",
      "tuoi phan"
    ]
  },
  {
    slug: "bao-quan-nong-san",
    label: "Bảo quản nông sản",
    keywords: [
      "bao quan",
      "sau thu hoach",
      "dong goi",
      "chuoi lanh",
      "van chuyen",
      "do tuoi"
    ]
  }
];

function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classifyTopic(question: string, answer: string) {
  const haystack = normalizeText(`${question} ${answer}`);
  const matched = topics.find((topic) =>
    topic.keywords.some((keyword) => haystack.includes(normalizeText(keyword)))
  );
  return matched?.slug || null;
}

function buildQnALink(topic?: string, page?: number) {
  const search = new URLSearchParams();
  if (topic) {
    search.set("topic", topic);
  }
  if (page && page > 1) {
    search.set("page", String(page));
  }
  const suffix = search.toString();
  return suffix ? `${pageBasePath}?${suffix}` : pageBasePath;
}

export default async function QnAPage({ searchParams }: QnAPageProps) {
  const resolvedSearchParams = await searchParams;
  const items = await getQnA();
  const resolvedItems = items.length > 0 ? items : fallbackItems;
  const phoneDigits = siteConfig.phone.replace(/[^0-9+]/g, "");

  const activeTopic = topics.some((topic) => topic.slug === resolvedSearchParams?.topic)
    ? resolvedSearchParams?.topic
    : "";

  const filteredItems = activeTopic
    ? resolvedItems.filter((item) => classifyTopic(item.question, item.answer) === activeTopic)
    : resolvedItems;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const requestedPage = Number.parseInt(resolvedSearchParams?.page || "1", 10);
  const normalizedPage = Number.isFinite(requestedPage) ? requestedPage : 1;
  const currentPage = Math.min(Math.max(normalizedPage, 1), totalPages);
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredItems.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const formatIndex = (index: number) => String(pageStart + index + 1).padStart(2, "0");

  return (
    <div className="layout-pageDetail qna-page">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
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
                    <Link
                      href={buildQnALink(undefined, 1)}
                      className={`qna-tag ${activeTopic ? "" : "is-active"}`}
                      data-testid="qna-topic-link-all"
                    >
                      Tất cả chủ đề
                    </Link>
                    {topics.map((topic) => (
                      <Link
                        key={topic.slug}
                        href={buildQnALink(topic.slug, 1)}
                        className={`qna-tag ${activeTopic === topic.slug ? "is-active" : ""}`}
                        data-testid={`qna-topic-link-${topic.slug}`}
                      >
                        {topic.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="qna-hero-panel">
                  <div className="qna-stat">
                    <span className="qna-stat-value">{filteredItems.length}</span>
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
                  {activeTopic ? (
                    <Link className="about-link" href={buildQnALink(undefined, 1)}>
                      Bỏ lọc chủ đề
                    </Link>
                  ) : null}
                  <a className="about-link" href={`mailto:${siteConfig.email}`}>
                    Gửi câu hỏi qua email
                  </a>
                </div>
              </div>
              <div className="content-pageDetail qna-list">
                {pageItems.map((item, index) => (
                  <article key={`${item.question}-${index}`} className="qna-card" data-testid="qna-card">
                    <div className="qna-card-header">
                      <span className="qna-index">{formatIndex(index)}</span>
                      <h3>{item.question}</h3>
                    </div>
                    <p className="qna-answer">{item.answer}</p>
                  </article>
                ))}
                {pageItems.length === 0 ? (
                  <article className="qna-card" data-testid="qna-card">
                    <div className="qna-card-header">
                      <span className="qna-index">00</span>
                      <h3>Chưa có câu hỏi phù hợp với chủ đề này</h3>
                    </div>
                    <p className="qna-answer">
                      Bạn có thể chọn chủ đề khác hoặc liên hệ đội ngũ kỹ thuật để nhận tư vấn theo
                      vườn.
                    </p>
                  </article>
                ) : null}
              </div>
              {totalPages > 1 ? (
                <nav className="qna-pagination" aria-label="Phân trang hỏi đáp">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Link
                      key={page}
                      href={buildQnALink(activeTopic || undefined, page)}
                      className={`qna-page-link ${page === currentPage ? "is-active" : ""}`}
                      data-testid={`qna-page-link-${page}`}
                    >
                      {page}
                    </Link>
                  ))}
                </nav>
              ) : null}
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
                  <li>
                    <Link
                      href={buildQnALink(undefined, 1)}
                      className={`qna-topic-link ${activeTopic ? "" : "is-active"}`}
                    >
                      Tất cả chủ đề
                    </Link>
                  </li>
                  {topics.map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        href={buildQnALink(topic.slug, 1)}
                        className={`qna-topic-link ${activeTopic === topic.slug ? "is-active" : ""}`}
                      >
                        {topic.label}
                      </Link>
                    </li>
                  ))}
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

