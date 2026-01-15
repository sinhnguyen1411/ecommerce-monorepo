import SectionTitle from "@/components/common/SectionTitle";

export const metadata = {
  title: "Điều khoản dịch vụ | Nông nghiệp TTC",
  description: "Quy định đặt hàng, thanh toán và giao hàng."
};

export default function TermsOfServicePage() {
  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Chính sách"
          title="Điều khoản dịch vụ"
          description="Quy định về đặt hàng, thanh toán và giao hàng."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8 text-sm text-ink/70">
          <p>
            Đơn hàng được xác nhận khi TTC gọi điện hoặc nhận thanh toán thành công.
          </p>
          <p className="mt-4">
            Thời gian giao hàng có thể thay đổi theo điều kiện thời tiết và mùa vụ.
          </p>
        </div>
      </section>
    </div>
  );
}
