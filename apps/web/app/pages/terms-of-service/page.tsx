import SectionTitle from "@/components/common/SectionTitle";

export const metadata = {
  title: "Dieu khoan dich vu | Nong Nghiep TTC",
  description: "Quy dinh dat hang, thanh toan va giao hang."
};

export default function TermsOfServicePage() {
  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Chinh sach"
          title="Dieu khoan dich vu"
          description="Quy dinh ve dat hang, thanh toan va giao hang."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="rounded-[32px] border border-forest/10 bg-white/90 p-8 text-sm text-ink/70">
          <p>
            Don hang duoc xac nhan khi TTC goi dien hoac nhan thanh toan thanh cong.
          </p>
          <p className="mt-4">
            Thoi gian giao hang co the thay doi theo dieu kien thoi tiet va mua vu.
          </p>
        </div>
      </section>
    </div>
  );
}
