import SectionTitle from "@/components/common/SectionTitle";

export const metadata = {
  title: "Chính sách bảo mật | Nông nghiệp TTC",
  description: "Quy định bảo mật thông tin khách hàng tại TTC."
};

export default function PrivacyPolicyPage() {
  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Chính sách"
          title="Chính sách bảo mật"
          description="Bảo mật thông tin khách hàng và dữ liệu giao dịch."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8 text-sm text-ink/70">
          <p>
            TTC cam kết bảo mật thông tin cá nhân của khách hàng và chỉ sử dụng cho
            mục đích giao dịch, chăm sóc đơn hàng.
          </p>
          <p className="mt-4">
            Chúng tôi không chia sẻ thông tin cho bên thứ ba nếu không có sự đồng ý
            của khách hàng.
          </p>
        </div>
      </section>
    </div>
  );
}
