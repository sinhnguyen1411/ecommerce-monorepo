INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Thuốc bảo vệ thực vật', 'thuoc-bao-ve-thuc-vat', 'Thuốc trừ sâu, trừ bệnh và giải pháp IPM.', 1),
  ('Phân bón & dinh dưỡng', 'phan-bon-dinh-duong', 'Phân vô cơ, hữu cơ và vi lượng cho cây trồng.', 2),
  ('Hạt giống & cây giống', 'hat-giong-cay-giong', 'Giống cây trồng, hạt giống chất lượng cao.', 3),
  ('Vật tư & dụng cụ nông nghiệp', 'vat-tu-dung-cu-nong-nghiep', 'Bình phun, bạt phủ, thiết bị canh tác.', 4);

INSERT INTO products (name, slug, description, price, compare_at_price, featured, status) VALUES
  ('Morning Greens Box', 'morning-greens-box', 'A crisp mix of leafy greens from partner farms.', 180000, 220000, true, 'published'),
  ('Sweet Mango Set', 'sweet-mango-set', 'Sun-ripened mangoes packed the same day.', 240000, 0, true, 'published'),
  ('Aromatic Pepper Bundle', 'aromatic-pepper-bundle', 'Aromatic peppercorns curated for daily cooking.', 90000, 120000, false, 'published'),
  ('Farmers Rice Pack', 'farmers-rice-pack', 'Fragrant rice milled weekly for freshness.', 150000, 0, true, 'published'),
  ('Garden Starter Kit', 'garden-starter-kit', 'Hand tools and gloves for new growers.', 320000, 390000, false, 'published'),
  ('Sunrise Herb Bundle', 'sunrise-herb-bundle', 'Fresh basil, mint, and coriander for daily cooking.', 110000, 135000, false, 'published'),
  ('Citrus Refresh Crate', 'citrus-refresh-crate', 'Juicy oranges and pomelos packed for gifting.', 210000, 250000, true, 'published'),
  ('Organic Tomato Basket', 'organic-tomato-basket', 'Vine-ripened tomatoes picked at peak sweetness.', 140000, 0, false, 'published'),
  ('Golden Banana Bunch', 'golden-banana-bunch', 'Sweet, ripe bananas with smooth, creamy texture.', 95000, 120000, true, 'published'),
  ('Spice Trail Kit', 'spice-trail-kit', 'A curated mix of cinnamon, star anise, and cloves.', 130000, 160000, false, 'published'),
  ('Heirloom Carrot Pack', 'heirloom-carrot-pack', 'Colorful carrots with earthy, crisp flavor.', 125000, 0, false, 'published'),
  ('Coconut Water Duo', 'coconut-water-duo', 'Chilled coconut water bottles for quick hydration.', 105000, 130000, true, 'published'),
  ('Kitchen Garden Trowel', 'kitchen-garden-trowel', 'Stainless steel trowel with ergonomic grip.', 175000, 210000, false, 'published'),
  ('Wholegrain Oat Sack', 'wholegrain-oat-sack', 'Hearty oats for breakfast bowls and baking.', 160000, 0, true, 'published'),
  ('Seasonal Salad Mix', 'seasonal-salad-mix', 'Crunchy lettuce and herbs washed and ready.', 120000, 145000, false, 'published');

INSERT INTO product_images (product_id, url, sort_order) VALUES
  (1, '/tam-bo/products/placeholder_1.svg', 1),
  (1, '/tam-bo/products/placeholder_2.svg', 2),
  (1, '/tam-bo/products/placeholder_3.svg', 3),
  (2, '/tam-bo/products/placeholder_2.svg', 1),
  (2, '/tam-bo/products/placeholder_3.svg', 2),
  (2, '/tam-bo/products/placeholder_1.svg', 3),
  (3, '/tam-bo/products/placeholder_3.svg', 1),
  (3, '/tam-bo/products/placeholder_1.svg', 2),
  (3, '/tam-bo/products/placeholder_2.svg', 3),
  (4, '/tam-bo/products/placeholder_1.svg', 1),
  (4, '/tam-bo/products/placeholder_2.svg', 2),
  (4, '/tam-bo/products/placeholder_3.svg', 3),
  (5, '/tam-bo/products/placeholder_2.svg', 1),
  (5, '/tam-bo/products/placeholder_1.svg', 2),
  (5, '/tam-bo/products/placeholder_3.svg', 3),
  (6, '/tam-bo/products/placeholder_3.svg', 1),
  (6, '/tam-bo/products/placeholder_1.svg', 2),
  (6, '/tam-bo/products/placeholder_2.svg', 3),
  (7, '/tam-bo/products/placeholder_2.svg', 1),
  (7, '/tam-bo/products/placeholder_3.svg', 2),
  (7, '/tam-bo/products/placeholder_1.svg', 3),
  (8, '/tam-bo/products/placeholder_1.svg', 1),
  (8, '/tam-bo/products/placeholder_2.svg', 2),
  (8, '/tam-bo/products/placeholder_3.svg', 3),
  (9, '/tam-bo/products/placeholder_2.svg', 1),
  (9, '/tam-bo/products/placeholder_1.svg', 2),
  (9, '/tam-bo/products/placeholder_3.svg', 3),
  (10, '/tam-bo/products/placeholder_3.svg', 1),
  (10, '/tam-bo/products/placeholder_2.svg', 2),
  (10, '/tam-bo/products/placeholder_1.svg', 3),
  (11, '/tam-bo/products/placeholder_1.svg', 1),
  (11, '/tam-bo/products/placeholder_3.svg', 2),
  (11, '/tam-bo/products/placeholder_2.svg', 3),
  (12, '/tam-bo/products/placeholder_2.svg', 1),
  (12, '/tam-bo/products/placeholder_3.svg', 2),
  (12, '/tam-bo/products/placeholder_1.svg', 3),
  (13, '/tam-bo/products/placeholder_1.svg', 1),
  (13, '/tam-bo/products/placeholder_2.svg', 2),
  (13, '/tam-bo/products/placeholder_3.svg', 3),
  (14, '/tam-bo/products/placeholder_3.svg', 1),
  (14, '/tam-bo/products/placeholder_2.svg', 2),
  (14, '/tam-bo/products/placeholder_1.svg', 3),
  (15, '/tam-bo/products/placeholder_2.svg', 1),
  (15, '/tam-bo/products/placeholder_1.svg', 2),
  (15, '/tam-bo/products/placeholder_3.svg', 3);

INSERT INTO product_categories (product_id, category_id) VALUES
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 3),
  (5, 4),
  (6, 3),
  (7, 2),
  (8, 1),
  (9, 2),
  (10, 3),
  (11, 1),
  (12, 2),
  (13, 4),
  (14, 3),
  (15, 1);

INSERT INTO posts (title, slug, excerpt, content, cover_image, status, published_at, tags, sort_order) VALUES
  ('Ghi chép mùa vụ: Đầu mùa thu', 'harvest-notes-early-autumn', 'Những ghi nhận về vụ thu đầu tiên và gợi ý món ăn theo mùa.', '<p>Mùa thu mang đến hương vị đậm đà và rau lá chắc hơn. Tuần này chúng tôi tập trung vào rau lá, thảo mộc thơm và củ quả từ các trang trại đối tác.</p>', '/tam-bo/blog/cover_fields.svg', 'published', NOW(), 'mua-vu,canh-tac', 1),
  ('Thăm trang trại: Hợp tác xã nông hộ', 'farm-visit-cooperative-growers', 'Bên trong hợp tác xã cung ứng các hộp nông sản hằng tuần.', '<p>Chúng tôi đến thăm hợp tác xã để tìm hiểu cách họ giữ nông sản tươi từ ruộng đến chợ. Trọng tâm về sức khỏe đất và đãi ngộ công bằng giúp chất lượng ổn định.</p>', '/tam-bo/blog/cover_greenhouse.svg', 'published', NOW(), 'hop-tac-xa,canh-tac', 2);

INSERT INTO posts (title, slug, excerpt, content, cover_image, status, published_at, tags, sort_order) VALUES
  ('Sức khỏe đất: Nền tảng ủ phân', 'soil-health-composting-basics', 'Hướng dẫn thực tế xây dựng đống ủ giúp đất màu mỡ và cây khỏe.', '<p>Phân ủ cân bằng cung cấp dinh dưỡng chậm và vi sinh có lợi. Bắt đầu với tỷ lệ cân bằng vật liệu xanh và nâu, giữ ẩm và đảo đều mỗi tuần để thông khí.</p>', '/tam-bo/blog/cover_soil.svg', 'published', DATE_SUB(NOW(), INTERVAL 3 DAY), 'dat,phan-huu-co', 1),
  ('Quản lý dịch hại tổng hợp cho rau', 'integrated-pest-management-vegetables', 'Giảm thuốc bảo vệ thực vật bằng theo dõi, thiên địch và xử lý mục tiêu.', '<p>IPM bắt đầu từ việc thăm đồng và xác định ngưỡng gây hại. Kết hợp luân canh, cây bẫy và thiên địch để giữ sâu dưới mức gây hại.</p>', '/tam-bo/blog/cover_irrigation.svg', 'published', DATE_SUB(NOW(), INTERVAL 6 DAY), 'sau-benh,ipm', 2),
  ('Tối ưu hệ thống tưới nhỏ giọt', 'drip-irrigation-tuning-guide', 'Tiết kiệm nước và đồng đều lưu lượng nhờ áp lực và lịch tưới phù hợp.', '<p>Kiểm tra lưu lượng đầu nhỏ giọt, xả đường ống định kỳ và tưới vào sáng sớm để giảm bốc hơi. Dùng độ ẩm đất để điều chỉnh thời gian tưới.</p>', '/tam-bo/blog/cover_greenhouse.svg', 'published', DATE_SUB(NOW(), INTERVAL 9 DAY), 'tuoi-tieu,nuoc', 3),
  ('Danh sách chăm sóc cây con', 'seedling-care-checklist', 'Ánh sáng, thông gió và dinh dưỡng cân đối để cây khỏe trước khi trồng.', '<p>Cung cấp 12-16 giờ ánh sáng, gió nhẹ và dinh dưỡng loãng. Làm quen cây con dần với điều kiện ngoài ruộng trước khi trồng.</p>', '/tam-bo/blog/cover_greenhouse.svg', 'published', DATE_SUB(NOW(), INTERVAL 12 DAY), 'cay-con,giong', 4),
  ('Cây phủ đất giúp tăng năng suất', 'cover-crops-for-better-yield', 'Giữ đất có lớp phủ để hạn chế cỏ dại, tăng hữu cơ và bảo vệ tầng mặt.', '<p>Chọn cây họ đậu để bổ sung đạm, cây họ hòa thảo tăng sinh khối và cải thiện cấu trúc đất. Kết thúc đúng giai đoạn để tối đa lợi ích.</p>', '/tam-bo/blog/cover_soil.svg', 'published', DATE_SUB(NOW(), INTERVAL 15 DAY), 'dat,canh-tac', 5),
  ('Xử lý sau thu hoạch để giữ độ tươi', 'post-harvest-handling-freshness', 'Các bước đơn giản của chuỗi lạnh giúp nông sản giòn và giảm thất thoát.', '<p>Làm mát nhanh, phân loại nhẹ tay và lưu trữ đúng độ ẩm. Bao bì chống dập giúp kéo dài thời gian bảo quản.</p>', '/tam-bo/blog/cover_fields.svg', 'published', DATE_SUB(NOW(), INTERVAL 18 DAY), 'sau-thu-hoach,bao-quan', 6),
  ('Xét nghiệm đất: Đọc các chỉ số', 'soil-testing-reading-the-numbers', 'Hiểu pH, hữu cơ và cân bằng dinh dưỡng để bón phân chính xác.', '<p>Bắt đầu từ pH và chất hữu cơ. Dựa vào khuyến nghị phòng thí nghiệm để điều chỉnh canxi, magiê và vi lượng.</p>', '/tam-bo/blog/cover_soil.svg', 'published', DATE_SUB(NOW(), INTERVAL 21 DAY), 'dat,phan-tich', 7),
  ('Thông gió nhà kính hiệu quả', 'greenhouse-ventilation-tips', 'Kiểm soát nhiệt và ẩm để hạn chế bệnh và tăng trưởng ổn định.', '<p>Sử dụng cửa nóc và cửa hông để đẩy khí nóng. Kết hợp quạt và lưới che vào giờ nắng gắt để bảo vệ cây.</p>', '/tam-bo/blog/cover_soil.svg', 'published', DATE_SUB(NOW(), INTERVAL 24 DAY), 'nha-kinh,thong-gio', 8),
  ('Lập kế hoạch giá bán theo tuần', 'market-pricing-weekly-plan', 'Định giá ổn định dựa trên chi phí, mùa vụ và theo dõi thị trường.', '<p>Theo dõi giá thành và điều chỉnh theo nguồn cung. Gợi ý bán combo và hộp đăng ký để ổn định nhu cầu.</p>', '/tam-bo/blog/cover_greenhouse.svg', 'published', DATE_SUB(NOW(), INTERVAL 27 DAY), 'thi-truong,gia-ban', 9),
  ('Luân canh giúp đất khỏe bền', 'crop-rotation-soil-resilience', 'Luân canh nhóm cây để giảm bệnh và cải thiện cấu trúc đất.', '<p>Sau cây ăn nhiều dinh dưỡng, trồng cây họ đậu và tránh trồng cùng họ cây trên một luống qua nhiều vụ.</p>', '/tam-bo/blog/cover_soil.svg', 'published', DATE_SUB(NOW(), INTERVAL 30 DAY), 'luan-canh,dat', 10);

INSERT INTO pages (title, slug, content) VALUES
  ('About Us', 'about-us', '<p>We are a modern agricultural marketplace connecting farmers and families across the region. Our mission is to deliver fresh harvests with full traceability.</p>'),
  ('Return Policy', 'return-policy', '<p>If your order arrives damaged or incomplete, contact us within 24 hours for a replacement or refund.</p>'),
  ('Terms of Service', 'terms-of-service', '<p>Orders are confirmed upon payment or COD confirmation. Delivery schedules are subject to weather and harvest conditions.</p>');

INSERT INTO qna (question, answer, status, sort_order) VALUES
  ('How do you keep produce fresh?', 'We pack on the day of harvest and store in temperature-controlled transit boxes.', 'published', 1),
  ('Do you deliver outside the city?', 'We currently deliver within the metro area. Pickup partners are available for nearby provinces.', 'published', 2);

INSERT INTO locations (name, province, district, address, phone, hours, sort_order) VALUES
  ('City Center Pickup', 'Ho Chi Minh', 'District 1', '123 Rural Road, District 1', '0900000000', '08:00-18:00', 1),
  ('North Hub', 'Ha Noi', 'Cau Giay', '88 Field Lane, Cau Giay', '0900000001', '08:30-17:30', 2);
