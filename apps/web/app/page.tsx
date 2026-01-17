import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import HomeSlider from "@/components/home/HomeSlider";
import ProductGrid from "@/components/product/ProductGrid";
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

  const slides = [
    {
      href: "/collections/all",
      desktopSrc: "/tam-bo/home/slide_1_img.svg",
      mobileSrc: "/tam-bo/home/slide_1_mb.svg",
      alt: "Nông dược Tam Bố"
    },
    {
      href: "/collections/all",
      desktopSrc: "/tam-bo/home/slide_2_img.svg",
      mobileSrc: "/tam-bo/home/slide_2_mb.svg",
      alt: "Giải pháp sinh học Tam Bố"
    },
    {
      href: "/collections/all",
      desktopSrc: "/tam-bo/home/slide_3_img.svg",
      mobileSrc: "/tam-bo/home/slide_3_mb.svg",
      alt: "Đồng hành cùng nhà nông"
    }
  ];

  return (
    <main className="mainWrapper--content">
      <HomeSlider slides={slides} />

      <section className="section-home-introduce">
        <div className="container">
          <div className="section-title text-center">
            <span className="sub-title">Định hướng phát triển sản phẩm</span>
            <h2 className="title">Nông Dược Tam Bố</h2>
          </div>
          <div className="intro-grid">
            <div className="intro-content">
              <div className="block-introduce">
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
                      Tìm hiểu thêm
                    </Link>
                  </span>
                  <span className="link2">
                    <Link href="/pages/lien-he" className="button">
                      Liên hệ đặt hàng
                    </Link>
                  </span>
                </div>
              </div>
            </div>
            <div className="intro-image">
              <Link href="/collections/all" className="image-use-effect3">
                <img src="/tam-bo/home/home_introduce_img.svg" alt="Nông Dược Tam Bố" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-banner">
        <div className="container">
          <div className="banner-block banner-left">
            <div className="banner-block__left">
              <Link href="/collections/all" className="image-use-effect3">
                <img src="/tam-bo/home/home_banner_1_img.svg" alt="Organic Master" />
              </Link>
            </div>
            <div className="banner-block__right banner-block__info">
              <div className="info">
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
              <div className="info">
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
              <Link href="/collections/all" className="image-use-effect3">
                <img src="/tam-bo/home/home_banner_2_img.svg" alt="Microbial" />
              </Link>
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
                  <img src="/tam-bo/home/home_feature_1_img.jpg" alt="FREESHIP TOÀN QUỐC" />
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
                  <img src="/tam-bo/home/home_feature_2_img.jpg" alt="TĂNG NĂNG SUẤT VƯỢT TRỘI" />
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
                  <img src="/tam-bo/home/home_feature_3_img.jpg" alt="HỖ TRỢ 24/7" />
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
