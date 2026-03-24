-- Storefront Unicode repair (idempotent, additive)
-- - Canonical UTF-8 repair for categories/products/posts/pages/locations/qna.
-- - Does not modify previous migrations; this file is the new repair source of truth.
-- - Updates are conditional, so clean records remain untouched.

SET NAMES utf8mb4;

SET @moji_pattern := CONCAT(
  CHAR(195 USING utf8mb4), '|',
  CHAR(196 USING utf8mb4), '|',
  CHAR(197 USING utf8mb4), '|',
  CHAR(198 USING utf8mb4), '|',
  CHAR(194 USING utf8mb4)
);

-- Categories
UPDATE categories
SET
  name = 'Thuốc bảo vệ thực vật',
  description = 'Thuốc trừ sâu, trừ bệnh và giải pháp IPM.'
WHERE slug = 'thuoc-bao-ve-thuc-vat'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE categories
SET
  name = 'Phân bón & dinh dưỡng',
  description = 'Phân vô cơ, hữu cơ và vi lượng cho cây trồng.'
WHERE slug = 'phan-bon-dinh-duong'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE categories
SET
  name = 'Hạt giống & cây giống',
  description = 'Giống cây trồng, hạt giống chất lượng cao.'
WHERE slug = 'hat-giong-cay-giong'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE categories
SET
  name = 'Vật tư & dụng cụ nông nghiệp',
  description = 'Bình phun, bạt phủ, thiết bị canh tác.'
WHERE slug = 'vat-tu-dung-cu-nong-nghiep'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

-- Products
UPDATE products
SET
  name = 'Combo Rau Xanh Tam Bố',
  description = 'Rau lá tuyển chọn cho bữa ăn hằng ngày, thu hoạch theo lô và đóng gói gọn để giữ độ tươi.'
WHERE slug = 'morning-greens-box'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Thùng Xoài Chín Cây',
  description = 'Xoài chín tự nhiên, vị ngọt đậm và thơm, phù hợp dùng tươi hoặc làm quà biếu.'
WHERE slug = 'sweet-mango-set'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Gói Tiêu Hữu Cơ',
  description = 'Tiêu thơm tuyển chọn, giữ hương vị tự nhiên, phù hợp cho chế biến món ăn gia đình.'
WHERE slug = 'aromatic-pepper-bundle'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Gạo Thơm Nông Hộ',
  description = 'Gạo thơm đóng gói theo lô, hạt đều, nấu dẻo và phù hợp cho nhu cầu gia đình.'
WHERE slug = 'farmers-rice-pack'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Bộ Dụng Cụ Làm Vườn',
  description = 'Bộ dụng cụ cơ bản cho chăm vườn tại nhà: gọn, bền và dễ thao tác.'
WHERE slug = 'garden-starter-kit'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Bó Thảo Mộc Sáng Sớm',
  description = 'Bó rau thơm dùng trong bữa ăn hằng ngày, phù hợp chế biến món Việt.'
WHERE slug = 'sunrise-herb-bundle'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Thùng Trái Cây Cam Quýt',
  description = 'Cam, quýt và bưởi tuyển chọn theo mùa, phù hợp cho gia đình hoặc làm quà.'
WHERE slug = 'citrus-refresh-crate'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Giỏ Cà Chua Hữu Cơ',
  description = 'Cà chua chín cây, thịt dày, phù hợp làm salad, sốt và món xào.'
WHERE slug = 'organic-tomato-basket'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Nải Chuối Chín Vàng',
  description = 'Chuối chín tự nhiên, vị ngọt nhẹ, dùng ăn trực tiếp hoặc làm sinh tố.'
WHERE slug = 'golden-banana-bunch'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Bộ Gia Vị Truyền Thống',
  description = 'Bộ quế, hồi và gia vị cơ bản phục vụ nấu ăn gia đình.'
WHERE slug = 'spice-trail-kit'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Gói Cà Rốt Sạch',
  description = 'Cà rốt tươi, giòn, phù hợp ép nước, nấu canh hoặc món xào.'
WHERE slug = 'heirloom-carrot-pack'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Combo Nước Dừa Mát',
  description = 'Nước dừa đóng chai tiện dụng, phù hợp giải khát nhanh sau vận động.'
WHERE slug = 'coconut-water-duo'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Bay Làm Vườn Inox',
  description = 'Bay làm vườn nhỏ gọn, tay cầm chắc chắn, phù hợp chăm cây chậu và luống nhỏ.'
WHERE slug = 'kitchen-garden-trowel'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Yến Mạch Nguyên Cám',
  description = 'Yến mạch nguyên cám dùng cho bữa sáng, làm bánh hoặc nấu cháo dinh dưỡng.'
WHERE slug = 'wholegrain-oat-sack'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

UPDATE products
SET
  name = 'Mix Salad Theo Mùa',
  description = 'Rau salad phối trộn theo mùa, rửa sạch và đóng gói tiện lợi.'
WHERE slug = 'seasonal-salad-mix'
  AND (name REGEXP @moji_pattern OR description REGEXP @moji_pattern);

-- Posts (title + excerpt only)
UPDATE posts
SET
  title = 'Ghi chép mùa vụ: Đầu mùa thu',
  excerpt = 'Những ghi nhận về vụ thu đầu tiên và gợi ý món ăn theo mùa.'
WHERE slug = 'harvest-notes-early-autumn'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Thăm trang trại: Hợp tác xã nông hộ',
  excerpt = 'Bên trong hợp tác xã cung ứng các hộp nông sản hằng tuần.'
WHERE slug = 'farm-visit-cooperative-growers'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Sức khỏe đất: Nền tảng ủ phân',
  excerpt = 'Hướng dẫn thực tế xây dựng đống ủ giúp đất màu mỡ và cây khỏe.'
WHERE slug = 'soil-health-composting-basics'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Quản lý dịch hại tổng hợp cho rau',
  excerpt = 'Giảm thuốc bảo vệ thực vật bằng theo dõi, thiên địch và xử lý mục tiêu.'
WHERE slug = 'integrated-pest-management-vegetables'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Tối ưu hệ thống tưới nhỏ giọt',
  excerpt = 'Tiết kiệm nước và đồng đều lưu lượng nhờ áp lực và lịch tưới phù hợp.'
WHERE slug = 'drip-irrigation-tuning-guide'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Danh sách chăm sóc cây con',
  excerpt = 'Ánh sáng, thông gió và dinh dưỡng cân đối để cây khỏe trước khi trồng.'
WHERE slug = 'seedling-care-checklist'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Cây phủ đất giúp tăng năng suất',
  excerpt = 'Giữ đất có lớp phủ để hạn chế cỏ dại, tăng hữu cơ và bảo vệ tầng mặt.'
WHERE slug = 'cover-crops-for-better-yield'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Xử lý sau thu hoạch để giữ độ tươi',
  excerpt = 'Các bước đơn giản của chuỗi lạnh giúp nông sản giòn và giảm thất thoát.'
WHERE slug = 'post-harvest-handling-freshness'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Xét nghiệm đất: Đọc các chỉ số',
  excerpt = 'Hiểu pH, hữu cơ và cân bằng dinh dưỡng để bón phân chính xác.'
WHERE slug = 'soil-testing-reading-the-numbers'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Thông gió nhà kính hiệu quả',
  excerpt = 'Kiểm soát nhiệt và ẩm để hạn chế bệnh và tăng trưởng ổn định.'
WHERE slug = 'greenhouse-ventilation-tips'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Lập kế hoạch giá bán theo tuần',
  excerpt = 'Định giá ổn định dựa trên chi phí, mùa vụ và theo dõi thị trường.'
WHERE slug = 'market-pricing-weekly-plan'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

UPDATE posts
SET
  title = 'Luân canh giúp đất khỏe bền',
  excerpt = 'Luân canh nhóm cây để giảm bệnh và cải thiện cấu trúc đất.'
WHERE slug = 'crop-rotation-soil-resilience'
  AND (title REGEXP @moji_pattern OR excerpt REGEXP @moji_pattern);

-- Static pages
UPDATE pages
SET
  title = 'Giới thiệu',
  content = '<p>Nông Dược Tam Bố đồng hành cùng nhà vườn trong từng mùa vụ bằng giải pháp nông nghiệp bền vững và dịch vụ tư vấn sát thực tế.</p>'
WHERE slug = 'about-us'
  AND (
    title = 'About Us'
    OR title REGEXP @moji_pattern
    OR content REGEXP @moji_pattern
  );

UPDATE pages
SET
  title = 'Chính sách đổi trả',
  content = '<p>Nếu đơn hàng lỗi, thiếu hoặc hư hỏng trong quá trình vận chuyển, vui lòng liên hệ trong vòng 24 giờ để được hỗ trợ đổi trả phù hợp.</p>'
WHERE slug = 'return-policy'
  AND (
    title = 'Return Policy'
    OR title REGEXP @moji_pattern
    OR content REGEXP @moji_pattern
  );

UPDATE pages
SET
  title = 'Điều khoản dịch vụ',
  content = '<p>Đơn hàng được xác nhận khi hoàn tất bước thanh toán hoặc xác nhận COD. Lịch giao hàng có thể thay đổi theo điều kiện thời tiết và mùa vụ.</p>'
WHERE slug = 'terms-of-service'
  AND (
    title = 'Terms of Service'
    OR title REGEXP @moji_pattern
    OR content REGEXP @moji_pattern
  );

-- Locations
UPDATE locations
SET
  name = 'Điểm nhận Tam Bố - Di Linh',
  province = 'Lâm Đồng',
  district = 'Di Linh',
  address = '179 Hiệp Thạnh 2, Tam Bố, Di Linh, Lâm Đồng',
  phone = '0942204279',
  hours = '08:00-18:00'
WHERE (
  name = 'City Center Pickup'
  OR name REGEXP @moji_pattern
  OR address REGEXP @moji_pattern
);

UPDATE locations
SET
  name = 'Điểm tư vấn Tam Bố - Bảo Lộc',
  province = 'Lâm Đồng',
  district = 'Bảo Lộc',
  address = '88 Trần Phú, Bảo Lộc, Lâm Đồng',
  phone = '0915192579',
  hours = '08:30-17:30'
WHERE (
  name = 'North Hub'
  OR name REGEXP @moji_pattern
  OR address REGEXP @moji_pattern
);

-- Q&A: remove mojibake duplicate rows when a clean sibling exists.
DELETE bad
FROM qna AS bad
JOIN qna AS good
  ON bad.sort_order = good.sort_order
 AND bad.id <> good.id
WHERE bad.sort_order >= 100
  AND (
    bad.question REGEXP @moji_pattern
    OR bad.answer REGEXP @moji_pattern
  )
  AND NOT (
    good.question REGEXP @moji_pattern
    OR good.answer REGEXP @moji_pattern
  );
