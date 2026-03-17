-- Phase 2 content quality normalization (safe to run repeatedly).

-- Product naming and description quality baseline.
UPDATE products
SET name = 'Combo Rau Xanh Tam Bố',
    description = 'Rau lá tuyển chọn cho bữa ăn hằng ngày, thu hoạch theo lô và đóng gói gọn để giữ độ tươi.'
WHERE slug = 'morning-greens-box';

UPDATE products
SET name = 'Thùng Xoài Chín Cây',
    description = 'Xoài chín tự nhiên, vị ngọt đậm và thơm, phù hợp dùng tươi hoặc làm quà biếu.'
WHERE slug = 'sweet-mango-set';

UPDATE products
SET name = 'Gói Tiêu Hữu Cơ',
    description = 'Tiêu thơm tuyển chọn, giữ hương vị tự nhiên, phù hợp cho chế biến món ăn gia đình.'
WHERE slug = 'aromatic-pepper-bundle';

UPDATE products
SET name = 'Gạo Thơm Nông Hộ',
    description = 'Gạo thơm đóng gói theo lô, hạt đều, nấu dẻo và phù hợp cho nhu cầu gia đình.'
WHERE slug = 'farmers-rice-pack';

UPDATE products
SET name = 'Bộ Dụng Cụ Làm Vườn',
    description = 'Bộ dụng cụ cơ bản cho chăm vườn tại nhà: gọn, bền và dễ thao tác.'
WHERE slug = 'garden-starter-kit';

UPDATE products
SET name = 'Bó Thảo Mộc Sáng Sớm',
    description = 'Bó rau thơm dùng trong bữa ăn hằng ngày, phù hợp chế biến món Việt.'
WHERE slug = 'sunrise-herb-bundle';

UPDATE products
SET name = 'Thùng Trái Cây Cam Quýt',
    description = 'Cam, quýt và bưởi tuyển chọn theo mùa, phù hợp cho gia đình hoặc làm quà.'
WHERE slug = 'citrus-refresh-crate';

UPDATE products
SET name = 'Giỏ Cà Chua Hữu Cơ',
    description = 'Cà chua chín cây, thịt dày, phù hợp làm salad, sốt và món xào.'
WHERE slug = 'organic-tomato-basket';

UPDATE products
SET name = 'Nải Chuối Chín Vàng',
    description = 'Chuối chín tự nhiên, vị ngọt nhẹ, dùng ăn trực tiếp hoặc làm sinh tố.'
WHERE slug = 'golden-banana-bunch';

UPDATE products
SET name = 'Bộ Gia Vị Truyền Thống',
    description = 'Bộ quế, hồi và gia vị cơ bản phục vụ nấu ăn gia đình.'
WHERE slug = 'spice-trail-kit';

UPDATE products
SET name = 'Gói Cà Rốt Sạch',
    description = 'Cà rốt tươi, giòn, phù hợp ép nước, nấu canh hoặc món xào.'
WHERE slug = 'heirloom-carrot-pack';

UPDATE products
SET name = 'Combo Nước Dừa Mát',
    description = 'Nước dừa đóng chai tiện dụng, phù hợp giải khát nhanh sau vận động.'
WHERE slug = 'coconut-water-duo';

UPDATE products
SET name = 'Bay Làm Vườn Inox',
    description = 'Bay làm vườn nhỏ gọn, tay cầm chắc chắn, phù hợp chăm cây chậu và luống nhỏ.'
WHERE slug = 'kitchen-garden-trowel';

UPDATE products
SET name = 'Yến Mạch Nguyên Cám',
    description = 'Yến mạch nguyên cám dùng cho bữa sáng, làm bánh hoặc nấu cháo dinh dưỡng.'
WHERE slug = 'wholegrain-oat-sack';

UPDATE products
SET name = 'Mix Salad Theo Mùa',
    description = 'Rau salad phối trộn theo mùa, rửa sạch và đóng gói tiện lợi.'
WHERE slug = 'seasonal-salad-mix';

-- Replace old placeholder product images if any.
UPDATE product_images
SET url = CASE
  WHEN sort_order = 1 THEN 'https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg'
  WHEN sort_order = 2 THEN 'https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg'
  ELSE 'https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg'
END
WHERE url LIKE '%/tam-bo/products/placeholder_%';

-- Blog post titles/excerpts for storefront quality.
UPDATE posts
SET title = 'Ghi chép mùa vụ: Đầu mùa thu',
    excerpt = 'Những ghi nhận về vụ thu đầu tiên và gợi ý món ăn theo mùa.'
WHERE slug = 'harvest-notes-early-autumn';

UPDATE posts
SET title = 'Thăm trang trại: Hợp tác xã nông hộ',
    excerpt = 'Bên trong hợp tác xã cung ứng các hộp nông sản hằng tuần.'
WHERE slug = 'farm-visit-cooperative-growers';

UPDATE posts
SET title = 'Sức khỏe đất: Nền tảng ủ phân',
    excerpt = 'Hướng dẫn thực tế xây dựng đống ủ giúp đất màu mỡ và cây khỏe.'
WHERE slug = 'soil-health-composting-basics';

UPDATE posts
SET title = 'Quản lý dịch hại tổng hợp cho rau',
    excerpt = 'Giảm thuốc bảo vệ thực vật bằng theo dõi, thiên địch và xử lý mục tiêu.'
WHERE slug = 'integrated-pest-management-vegetables';

UPDATE posts
SET title = 'Tối ưu hệ thống tưới nhỏ giọt',
    excerpt = 'Tiết kiệm nước và đồng đều lưu lượng nhờ áp lực và lịch tưới phù hợp.'
WHERE slug = 'drip-irrigation-tuning-guide';

UPDATE posts
SET title = 'Danh sách chăm sóc cây con',
    excerpt = 'Ánh sáng, thông gió và dinh dưỡng cân đối để cây khỏe trước khi trồng.'
WHERE slug = 'seedling-care-checklist';

UPDATE posts
SET title = 'Cây phủ đất giúp tăng năng suất',
    excerpt = 'Giữ đất có lớp phủ để hạn chế cỏ dại, tăng hữu cơ và bảo vệ tầng mặt.'
WHERE slug = 'cover-crops-for-better-yield';

UPDATE posts
SET title = 'Xử lý sau thu hoạch để giữ độ tươi',
    excerpt = 'Các bước đơn giản của chuỗi lạnh giúp nông sản giòn và giảm thất thoát.'
WHERE slug = 'post-harvest-handling-freshness';

UPDATE posts
SET title = 'Xét nghiệm đất: Đọc các chỉ số',
    excerpt = 'Hiểu pH, hữu cơ và cân bằng dinh dưỡng để bón phân chính xác.'
WHERE slug = 'soil-testing-reading-the-numbers';

UPDATE posts
SET title = 'Thông gió nhà kính hiệu quả',
    excerpt = 'Kiểm soát nhiệt và ẩm để hạn chế bệnh và tăng trưởng ổn định.'
WHERE slug = 'greenhouse-ventilation-tips';

UPDATE posts
SET title = 'Lập kế hoạch giá bán theo tuần',
    excerpt = 'Định giá ổn định dựa trên chi phí, mùa vụ và theo dõi thị trường.'
WHERE slug = 'market-pricing-weekly-plan';

UPDATE posts
SET title = 'Luân canh giúp đất khỏe bền',
    excerpt = 'Luân canh nhóm cây để giảm bệnh và cải thiện cấu trúc đất.'
WHERE slug = 'crop-rotation-soil-resilience';

-- Replace old SVG blog placeholders if any.
UPDATE posts
SET cover_image = CASE
  WHEN slug = 'harvest-notes-early-autumn' THEN 'https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg'
  WHEN slug = 'farm-visit-cooperative-growers' THEN 'https://images.pexels.com/photos/19455179/pexels-photo-19455179.jpeg?cs=srgb&dl=pexels-julian-cabrera-s-3685809-19455179.jpg&fm=jpg'
  WHEN slug = 'soil-health-composting-basics' THEN 'https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg'
  WHEN slug = 'integrated-pest-management-vegetables' THEN 'https://images.pexels.com/photos/29642276/pexels-photo-29642276.jpeg?cs=srgb&dl=pexels-dongdilac-29642276.jpg&fm=jpg'
  WHEN slug = 'drip-irrigation-tuning-guide' THEN 'https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg'
  WHEN slug = 'seedling-care-checklist' THEN 'https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg'
  WHEN slug = 'cover-crops-for-better-yield' THEN 'https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg'
  WHEN slug = 'post-harvest-handling-freshness' THEN 'https://images.pexels.com/photos/19455179/pexels-photo-19455179.jpeg?cs=srgb&dl=pexels-julian-cabrera-s-3685809-19455179.jpg&fm=jpg'
  WHEN slug = 'soil-testing-reading-the-numbers' THEN 'https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg'
  WHEN slug = 'greenhouse-ventilation-tips' THEN 'https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg'
  WHEN slug = 'market-pricing-weekly-plan' THEN 'https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg'
  WHEN slug = 'crop-rotation-soil-resilience' THEN 'https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg'
  ELSE cover_image
END
WHERE cover_image LIKE '%/tam-bo/blog/%'
   OR cover_image LIKE '%/tam-bo/home/%';

-- Localized default static pages.
UPDATE pages
SET title = 'Giới thiệu',
    content = '<p>Nông Dược Tam Bố đồng hành cùng nhà vườn trong từng mùa vụ bằng giải pháp nông nghiệp bền vững và dịch vụ tư vấn sát thực tế.</p>'
WHERE slug = 'about-us'
  AND (title = 'About Us' OR content LIKE '%modern agricultural marketplace%');

UPDATE pages
SET title = 'Chính sách đổi trả',
    content = '<p>Nếu đơn hàng lỗi, thiếu hoặc hư hỏng trong quá trình vận chuyển, vui lòng liên hệ trong vòng 24 giờ để được hỗ trợ đổi trả phù hợp.</p>'
WHERE slug = 'return-policy'
  AND (title = 'Return Policy' OR content LIKE '%damaged or incomplete%');

UPDATE pages
SET title = 'Điều khoản dịch vụ',
    content = '<p>Đơn hàng được xác nhận khi hoàn tất bước thanh toán hoặc xác nhận COD. Lịch giao hàng có thể thay đổi theo điều kiện thời tiết và mùa vụ.</p>'
WHERE slug = 'terms-of-service'
  AND (title = 'Terms of Service' OR content LIKE '%Orders are confirmed%');

-- Localized Q&A and location entries.
UPDATE qna
SET question = 'Làm sao giữ nông sản tươi khi giao?',
    answer = 'Chúng tôi đóng gói theo ngày thu hoạch, ưu tiên giao nhanh và kiểm soát điều kiện bảo quản trong suốt quá trình vận chuyển.'
WHERE question LIKE 'How do you keep produce fresh%';

UPDATE qna
SET question = 'Có giao ngoài khu vực trung tâm không?',
    answer = 'Hiện chúng tôi phục vụ theo tuyến chính và có điểm nhận đối tác tại một số khu vực lân cận. Vui lòng liên hệ để được tư vấn tuyến phù hợp.'
WHERE question LIKE 'Do you deliver outside the city%';

UPDATE locations
SET name = 'Điểm nhận Tam Bố - Di Linh',
    province = 'Lâm Đồng',
    district = 'Di Linh',
    address = '179 Hiệp Thạnh 2, Tam Bố, Di Linh, Lâm Đồng',
    phone = '0942204279',
    hours = '08:00-18:00'
WHERE name = 'City Center Pickup';

UPDATE locations
SET name = 'Điểm tư vấn Tam Bố - Bảo Lộc',
    province = 'Lâm Đồng',
    district = 'Bảo Lộc',
    address = '88 Trần Phú, Bảo Lộc, Lâm Đồng',
    phone = '0915192579',
    hours = '08:30-17:30'
WHERE name = 'North Hub';
