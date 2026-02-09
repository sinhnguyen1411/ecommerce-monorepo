import Link from "next/link";
import Image from "next/image";

import PostCard from "@/components/blog/PostCard";
import PromoPopup from "@/components/common/PromoPopup";
import HomeSlider from "@/components/home/HomeSlider";
import ProductGrid from "@/components/product/ProductGrid";
import { defaultHomeBanners } from "@/lib/content";
import { getPosts, getProducts } from "@/lib/api";

export const metadata = {
  title: "Nông Dược Tam Bố | Nông Dược Tam Bố",
  description: "Sản phẩm nông nghiệp, tin tức mùa vụ và góc chia sẻ của Tam Bố."
};

export default async function HomePage() {
  const [featuredProducts, posts] = await Promise.all([
    getProducts({ featured: true, limit: 8 }),
    getPosts()
  ]);

  const slides = defaultHomeBanners;

  return (
    <main className="mainWrapper--content">
      <PromoPopup />
      <HomeSlider slides={slides} />

      <section className="section-home-introduce">
        <div className="container">
          <div className="section-title text-center">
            <span className="sub-title">Định hướng phát triển sản phẩm</span>
            <h2 className="title">Nông Dược Tam Bố</h2>
          </div>
          <div className="intro-grid">
            <div className="intro-content">
              <div className="block-introduce home-square-card">
                <div className="block-introduce__title">
                  Giải pháp cho tương lai thông minh
                </div>
                <div className="block-introduce__desc">
                  Nông Dược Tam Bố tự hào là đơn vị tiên phong trong việc xây dựng nền
                  nông nghiệp xanh với giải pháp cho tương lai thông minh, bền vững.
                  Với sứ mệnh đồng hành cùng nhà nông, Tam Bố không ngừng nghiên cứu và
                  phát triển các dòng sản phẩm thân thiện với môi trường như phân
                  bón hữu cơ, chế phẩm sinh học và giải pháp xử lý đất trồng an
                  toàn. Chúng tôi hiểu rằng để phát triển lâu dài, nông nghiệp phải
                  đi đôi với bảo vệ tài nguyên thiên nhiên, cải thiện chất lượng
                  đất, nước và hệ sinh thái canh tác. Định hướng của Nông Dược Tam Bố
                  là ứng dụng công nghệ cao vào sản xuất, tối ưu năng suất mà vẫn
                  đảm bảo an toàn cho sức khỏe người tiêu dùng. Các sản phẩm như
                  phân bón sinh học, chế phẩm xử lý tuyến trùng của Tam Bố không chỉ
                  giúp cây trồng sinh trưởng mạnh mẽ mà còn góp phần giảm thiểu tác
                  động tiêu cực đến môi trường. Chúng tôi cam kết mang đến cho bà
                  con giải pháp canh tác hiệu quả, chi phí hợp lý và lợi ích lâu
                  dài. Với Nông Dược Tam Bố, phát triển nông nghiệp xanh không chỉ
                  là mục tiêu mà còn là trách nhiệm đối với thế hệ tương lai. Cùng
                  Tam Bố, vun đắp nền nông nghiệp bền vững từ hôm nay!
                </div>
                <div className="block-introduce__link">
                  <span className="link1">
                    <Link href="/collections/all" className="button">
                      Xem chi tiết
                    </Link>
                  </span>
                </div>
              </div>
            </div>
            <div className="intro-image">
              <div className="home-square-media">
                <Link href="/collections/all" className="image-use-effect3">
                  <Image
                    src="https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg"
                    alt="Nông Dược Tam Bố"
                    width={640}
                    height={520}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 90vw, 520px"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-banner">
        <div className="container">
          <div className="banner-block banner-left">
            <div className="banner-block__left">
              <div className="home-square-media">
                <Link href="/collections/all" className="image-use-effect3">
                  <Image
                    src="https://images.pexels.com/photos/19455179/pexels-photo-19455179.jpeg?cs=srgb&dl=pexels-julian-cabrera-s-3685809-19455179.jpg&fm=jpg"
                    alt="Organic Master"
                    width={640}
                    height={520}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 90vw, 520px"
                  />
                </Link>
              </div>
            </div>
            <div className="banner-block__right banner-block__info">
              <div className="info home-square-card">
                <h3 className="title">ORGANIC MASTER</h3>
                <p className="text">
                  Phân bón hữu cơ Organic Master là giải pháp đột phá cho nông
                  nghiệp xanh bền vững. Sản phẩm có hàm lượng OM 60%, Axit Fulvic
                  36% và Amino Acid 26,5%, nhập khẩu trực tiếp từ Nhật Bản. Organic
                  Master giúp cải tạo đất bạc màu, phục hồi cây suy yếu, tăng năng
                  suất cây trồng đến 40%. Sản phẩm nuôi dưỡng đất và cây trồng theo
                  mô hình hữu cơ, an toàn, thân thiện môi trường và phát triển lâu
                  dài.
                </p>
                <ul>
                  <li>
                    Hàm lượng chất hữu cơ (OM): 60% + Giúp cải tạo đất, tăng độ tơi
                    xốp, phục hồi đất bạc màu.
                  </li>
                  <li>
                    Hàm lượng Axit Fulvic: 36% + Hỗ trợ cây hấp thụ dưỡng chất
                    nhanh, mạnh rễ, bung đất.
                  </li>
                  <li>
                    Hàm lượng Amino Acid: 26,5% + Tăng cường sức đề kháng cho cây,
                    dưỡng xanh lá, dày trái, giúp phục hồi cây suy yếu.
                  </li>
                </ul>
                <Link href="/collections/all" className="button">
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
          <div className="banner-block banner-right">
            <div className="banner-block__left banner-block__info">
              <div className="info home-square-card">
                <h3 className="title">MICROBIAL</h3>
                <p className="text">
                  Chế phẩm vi sinh Microbial là sản phẩm sinh học tiên tiến được
                  nghiên cứu và sản xuất với thành phần chính gồm chủng vi sinh
                  Bacillus (SP1), kết hợp các chất thảo mộc, enzyme, tinh dầu quế,
                  hợp chất protein lên men và chất bám dính đặc biệt. Nhờ sự kết
                  hợp này, chế phẩm có khả năng tiêu diệt tuyến trùng, sâu bệnh và
                  côn trùng gây hại như ruồi vàng, sên, rệp một cách mạnh mẽ, hiệu
                  quả cao và kéo dài. Không chỉ tác động phòng trừ dịch hại,
                  Microbial còn giúp phân giải xenlulo, tạo điều kiện lý tưởng cho
                  sự phát triển của rễ cây, cải thiện môi trường đất, cân bằng độ
                  pH và tăng khả năng hấp thu dinh dưỡng cho cây trồng. Sản phẩm
                  đặc biệt phù hợp cho các loại cây công nghiệp (tiêu, cà phê),
                  cây ăn trái (cam, quýt, bưởi) và rau màu. Với ưu điểm an toàn,
                  thân thiện môi trường và hiệu quả vượt trội, chế phẩm vi sinh
                  Microbial là giải pháp sinh học bền vững cho nhà nông hiện đại.
                </p>
                <ul>
                  <li>Tiêu diệt và ngăn chặn tuyến trùng hiệu quả</li>
                  <li>Cân bằng độ pH và cải tạo đất</li>
                  <li>Duy trì hệ vi sinh vật có lợi trong đất</li>
                </ul>
                <Link href="/collections/all" className="button">
                  Xem chi tiết
                </Link>
              </div>
            </div>
            <div className="banner-block__right">
              <div className="home-square-media">
                <Link href="/collections/all" className="image-use-effect3">
                  <Image
                    src="https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg"
                    alt="Microbial"
                    width={640}
                    height={520}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 90vw, 520px"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-feature">
        <div className="container">
          <div className="feature-grid">
            <div className="feature-block">
              <div className="feature-block__inner image-use-effect4">
                <div className="feature-block__img">
                  <div className="feature-block__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img" aria-label="Freeship toàn quốc">
                      <path d="M3 16V6h11v10" />
                      <path d="M14 10h4l3 3v3h-3" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                </div>
                <div className="feature-block__title">
                  <h4>FREESHIP TOÀN QUỐC</h4>
                </div>
                <div className="feature-block__content">
                  <p>
                    Nông Dược Tam Bố miễn phí vận chuyển toàn quốc cho các sản phẩm
                    như phân bón, chai xử lý tuyến trùng, hỗ trợ giao hàng nhanh
                    chóng, đảm bảo chất lượng đến tận tay khách hàng.
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-block">
              <div className="feature-block__inner image-use-effect4">
                <div className="feature-block__img">
                  <div className="feature-block__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img" aria-label="Tăng năng suất vượt trội">
                      <path d="M3 17l6-6 4 4 7-7" />
                      <path d="M14 8h6v6" />
                    </svg>
                  </div>
                </div>
                <div className="feature-block__title">
                  <h4>TĂNG NĂNG SUẤT VƯỢT TRỘI</h4>
                </div>
                <div className="feature-block__content">
                  <p>
                    Sản phẩm của Nông Dược Tam Bố giúp tăng năng suất cây trồng vượt
                    trội, cải thiện chất lượng nông sản, tối ưu chi phí đầu tư và
                    mang lại hiệu quả kinh tế bền vững cho nhà nông.
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-block">
              <div className="feature-block__inner image-use-effect4">
                <div className="feature-block__img">
                  <div className="feature-block__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img" aria-label="Hỗ trợ 24/7">
                      <path d="M4 13a8 8 0 0 1 16 0" />
                      <path d="M4 13v5a2 2 0 0 0 2 2h2v-6H6" />
                      <path d="M20 13v5a2 2 0 0 1-2 2h-2v-6h2" />
                      <text
                        x="12"
                        y="16"
                        textAnchor="middle"
                        fontSize="6"
                        fontFamily="Arial, sans-serif"
                        fill="currentColor"
                        stroke="none"
                      >
                        24/7
                      </text>
                    </svg>
                  </div>
                </div>
                <div className="feature-block__title">
                  <h4>HỖ TRỢ 24/7</h4>
                </div>
                <div className="feature-block__content">
                  <p>
                    Nông Dược Tam Bố cam kết hỗ trợ 24/7 cho khách hàng, tư vấn
                    nhanh chóng về phân bón, chai xử lý tuyến trùng và các sản phẩm
                    nông nghiệp chất lượng cao.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-collection collection-product collection-product-slide">
        <div className="container">
          <div className="section-title text-center">
            <span className="sub-title style-italic">Sản phẩm nổi bật</span>
            <h2 className="title">
              <Link href="/collections/hot-products">Sản phẩm của Tam Bố</Link>
            </h2>
          </div>
          <div className="section-content">
            <div className="collection-grid">
              <ProductGrid products={featuredProducts} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-aboutus">
        <div className="container">
          <div className="section-content">
            <div className="aboutus-hero">
              <div className="aboutus-hero__decor aboutus-hero__leaf" aria-hidden="true">
                <svg viewBox="0 0 120 120" role="img">
                  <path
                    d="M20 80C20 40 58 18 96 20c2 38-18 76-58 76-6 0-12-1-18-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="aboutus-hero__decor aboutus-hero__arrow" aria-hidden="true">
                <svg viewBox="0 0 120 120" role="img">
                  <path
                    d="M20 92l48-48 14 14 18-18v52H48l18-18-14-14-32 32z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="aboutus-block text-center">
                <div className="aboutus-block__text">
                  <h4>Nông Dược Tam Bố</h4>
                  <h3>Nông nghiệp hữu cơ bền vững</h3>
                  <p>Giải pháp cho tương lai thông minh</p>
                </div>
                <div className="aboutus-block__link">
                  <span className="link1">
                    <Link href="/pages/lien-he" className="button">
                      Liên hệ đặt hàng
                    </Link>
                  </span>
                  <span className="link2">
                    <Link href="/pages/locations" className="button">
                      Tìm hiểu thêm
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-blogs">
        <div className="container">
          <div className="section-title text-center">
            <h2 className="title">
              <Link href="/blogs/news">Bài viết mới nhất</Link>
            </h2>
          </div>
          <div className="section-content">
            <div className="home-blogs">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
