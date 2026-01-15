import { getQnA } from "@/lib/api";

export const metadata = {
  title: "Hỏi đáp cùng nhà nông | Nông nghiệp TTC",
  description: "Tổng hợp câu hỏi thường gặp về nông nghiệp hữu cơ và sản phẩm TTC."
};

export default async function QnAPage() {
  const items = await getQnA();
  const fallbackContent =
    "<h3>1️⃣ Nông nghiệp hữu cơ là gì?</h3><p><strong>Trả lời:</strong><br>Nông nghiệp hữu cơ là phương thức sản xuất dựa hoàn toàn vào yếu tố tự nhiên, không sử dụng phân bón hóa học, thuốc trừ sâu tổng hợp hay chất kích thích tăng trưởng. Phương pháp này chú trọng cải thiện và duy trì độ phì nhiêu của đất thông qua các biện pháp như sử dụng phân hữu cơ, vi sinh vật có lợi và đa dạng sinh học, nhằm tạo ra nông sản sạch, an toàn và bảo vệ môi trường lâu dài.</p><hr>" +
    "<h3>2️⃣ Vì sao nên chọn nông nghiệp hữu cơ?</h3><p><strong>Trả lời:</strong><br>Nông nghiệp hữu cơ mang lại nhiều lợi ích: đảm bảo an toàn thực phẩm, bảo vệ môi trường, tăng sức khỏe đất và cây trồng, và giúp hệ sinh thái bền vững hơn. Đặc biệt, nông sản hữu cơ ngày càng được ưa chuộng trên thị trường quốc tế, mở ra nhiều cơ hội kinh doanh cho nông dân và doanh nghiệp.</p><hr>" +
    "<h3>3️⃣ Organic Master là gì?</h3><p><strong>Trả lời:</strong><br>Organic Matter là phân bón hữu cơ cao cấp do TTC phân phối, nhập khẩu trực tiếp từ Nhật Bản. Sản phẩm chứa tới 60% chất hữu cơ (OM), 36% axit fulvic và 26,5% amino acid – giúp cải tạo đất bạc màu, phục hồi cây suy yếu và tăng năng suất vượt trội, phù hợp hoàn hảo với mô hình nông nghiệp hữu cơ.</p><hr>" +
    "<h3>4️⃣ Organic Master có phù hợp cho mô hình nông nghiệp hữu cơ không?</h3><p><strong>Trả lời:</strong><br>Rất phù hợp! Organic Matter đáp ứng tiêu chuẩn hữu cơ nghiêm ngặt, giúp nuôi dưỡng đất và cây trồng tự nhiên, không gây tồn dư độc hại và góp phần xây dựng mô hình canh tác bền vững.</p><hr>" +
    "<h3>5️⃣ Phân bón hữu cơ khác gì so với phân bón hóa học?</h3><p><strong>Trả lời:</strong><br>Phân hữu cơ cải thiện đất lâu dài, bổ sung vi sinh vật có lợi và duy trì sự cân bằng sinh thái, trong khi phân hóa học chỉ cung cấp dinh dưỡng tức thời, dễ làm đất thoái hóa và ô nhiễm môi trường nếu lạm dụng.</p><hr>" +
    "<h3>6️⃣ Organic Master giúp cải tạo đất như thế nào?</h3><p><strong>Trả lời:</strong><br>Với hàm lượng OM 60%, Organic Matter bổ sung lượng lớn chất hữu cơ, giúp đất tơi xốp, tăng khả năng giữ nước và dưỡng chất, đồng thời kích thích hệ vi sinh vật phát triển mạnh, từ đó cải thiện sức sống đất rõ rệt.</p><hr>" +
    "<h3>7️⃣ Axit fulvic có vai trò gì trong sản phẩm?</h3><p><strong>Trả lời:</strong><br>Axit fulvic (36% trong Organic Matter) giúp tăng cường khả năng hấp thu dinh dưỡng của cây, cải thiện cấu trúc đất, đồng thời kích thích ra rễ và tăng sức đề kháng cho cây trồng.</p><hr>" +
    "<h3>8️⃣ Amino acid trong Organic Master có lợi gì?</h3><p><strong>Trả lời:</strong><br>Amino acid giúp cây trồng phát triển mạnh mẽ hơn, cải thiện quá trình quang hợp, giúp cây xanh tốt, tăng sức đề kháng và phục hồi nhanh khi bị suy yếu.</p><hr>" +
    "<h3>9️⃣ Nông nghiệp hữu cơ có thực sự bền vững?</h3><p><strong>Trả lời:</strong><br>Có. Nông nghiệp hữu cơ không chỉ giúp cây trồng khỏe mạnh, mà còn bảo vệ đất, nước và đa dạng sinh học – tạo ra hệ sinh thái cân bằng và phát triển lâu dài.</p><hr>" +
    "<h3>1️⃣0️⃣ Organic Master có giúp chống vàng lá không?</h3><p><strong>Trả lời:</strong><br>Có. Nhờ thành phần dinh dưỡng dồi dào, sản phẩm giúp cây xanh lá, dày lá, khắc phục tình trạng vàng lá hiệu quả chỉ sau vài lần sử dụng.</p><hr>" +
    "<h3>1️⃣1️⃣ Organic Master phù hợp với những loại cây nào?</h3><p><strong>Trả lời:</strong><br>Sản phẩm phù hợp với mọi loại cây: cây ăn trái (cam, bưởi, sầu riêng...), cây công nghiệp (cà phê, tiêu, điều...), rau màu, hoa kiểng và cây lâu năm.</p><hr>" +
    "<h3>1️⃣2️⃣ Phân bón hữu cơ có an toàn cho môi trường không?</h3><p><strong>Trả lời:</strong><br>Rất an toàn. Organic Master hoàn toàn hữu cơ, không gây tồn dư độc hại và giúp tái tạo sức sống cho đất, góp phần bảo vệ môi trường tự nhiên.</p><hr>" +
    "<h3>1️⃣3️⃣ Bao lâu thì thấy hiệu quả khi dùng Organic Master?</h3><p><strong>Trả lời:</strong><br>Thông thường chỉ sau 7 – 10 ngày bà con có thể nhận thấy cây xanh tốt hơn, rễ bung mạnh và phục hồi nhanh chóng.</p><hr>" +
    "<h3>1️⃣4️⃣ Sản phẩm có gây mùi khó chịu không?</h3><p><strong>Trả lời:</strong><br>Organic Master đã được xử lý tiên tiến, mùi nhẹ hơn nhiều so với các loại phân hữu cơ truyền thống, dễ sử dụng và không gây khó chịu.</p><hr>" +
    "<h3>1️⃣5️⃣ Có thể kết hợp Organic Master với phân hóa học không?</h3><p><strong>Trả lời:</strong><br>Hoàn toàn có thể, nhưng để đạt hiệu quả tối ưu và an toàn, TTC khuyến khích bà con ưu tiên sử dụng hữu cơ để nuôi dưỡng đất lâu dài.</p><hr>" +
    "<h3>1️⃣6️⃣ Tôi muốn làm nông nghiệp hữu cơ, bắt đầu từ đâu?</h3><p><strong>Trả lời:</strong><br>Bạn có thể bắt đầu từ việc chuyển đổi phân bón sang hữu cơ, tìm hiểu kỹ thuật hữu cơ và tuân thủ nguyên tắc: bảo vệ đất, đa dạng sinh học và hạn chế hóa chất tổng hợp.</p><hr>" +
    "<h3>1️⃣7️⃣ Organic Matter có giúp tăng năng suất không?</h3><p><strong>Trả lời:</strong><br>Có. TTC cam kết sản phẩm giúp tăng năng suất cây trồng tới 40% khi sử dụng đều đặn và đúng kỹ thuật.</p><hr>" +
    "<h3>1️⃣8️⃣ Organic Master có dùng được trong mùa mưa không?</h3><p><strong>Trả lời:</strong><br>Hoàn toàn được. Sản phẩm thẩm thấu nhanh, dễ tan và phát huy tác dụng tốt trong mọi điều kiện thời tiết.</p><hr>" +
    "<h3>1️⃣9️⃣ TTC có hỗ trợ kỹ thuật cho nông dân không?</h3><p><strong>Trả lời:</strong><br>Có. TTC luôn đồng hành với bà con qua các buổi tập huấn, hướng dẫn kỹ thuật và tư vấn trực tuyến miễn phí.</p>";

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
                <strong>HỎI ĐÁP CÙNG NHÀ NÔNG</strong>
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
                <h1>HỎI ĐÁP CÙNG NHÀ NÔNG</h1>
              </div>
              {items.length === 0 ? (
                <div
                  className="content-pageDetail typeList-style"
                  dangerouslySetInnerHTML={{ __html: fallbackContent }}
                />
              ) : (
                <div className="content-pageDetail typeList-style">
                  {items.map((item, index) => (
                    <div key={item.id} className="qna-item">
                      <h3>
                        {index + 1}️⃣ {item.question}
                      </h3>
                      <p>
                        <strong>Trả lời:</strong>
                        <br />
                        {item.answer}
                      </p>
                      {index < items.length - 1 ? <hr /> : null}
                    </div>
                  ))}
                </div>
              )}
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
