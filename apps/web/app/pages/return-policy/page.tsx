import SectionTitle from "@/components/common/SectionTitle";

export const metadata = {
  title: "Chinh sach doi tra | Nong Nghiep TTC",
  description: "Quy dinh doi tra san pham tai TTC."
};

export default function ReturnPolicyPage() {
  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Chinh sach"
          title="Chinh sach doi tra"
          description="Cam ket doi tra nhanh chong neu san pham khong dat yeu cau."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="rounded-[32px] border border-forest/10 bg-white/90 p-8 text-sm text-ink/70">
          <p>
            Neu san pham bi hu hong hoac sai don hang, vui long lien he trong 24 gio ke tu khi nhan.
          </p>
          <p className="mt-4">
            TTC se doi san pham moi hoac hoan tien theo gia tri don hang.
          </p>
        </div>
      </section>
    </div>
  );
}
