import SectionTitle from "@/components/common/SectionTitle";

export const metadata = {
  title: "Chính sách đổi trả | Nông nghiệp TTC",
  description: "Quy định đổi trả sản phẩm tại TTC."
};

export default function ReturnPolicyPage() {
  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Chính sách"
          title="Chính sách đổi trả"
          description="Cam kết đổi trả nhanh chóng nếu sản phẩm không đạt yêu cầu."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8 text-sm text-ink/70">
          <p>
            Nếu sản phẩm bị hư hỏng hoặc sai đơn hàng, vui lòng liên hệ trong 24 giờ
            kể từ khi nhận.
          </p>
          <p className="mt-4">
            TTC sẽ đổi sản phẩm mới hoặc hoàn tiền theo giá trị đơn hàng.
          </p>
        </div>
      </section>
    </div>
  );
}
