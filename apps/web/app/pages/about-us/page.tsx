import SectionTitle from "@/components/common/SectionTitle";
import { getPage } from "@/lib/api";

export const metadata = {
  title: "Gioi thieu | Nong Nghiep TTC",
  description: "Thong tin ve TTC va hanh trinh nong san."
};

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Gioi thieu"
          title="Ve TTC"
          description="Noi ket noi giua nong trai va nguoi tieu dung."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="rounded-[32px] border border-forest/10 bg-white/90 p-8">
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{
              __html:
                page?.content ||
                "<p>Noi dung gioi thieu dang duoc cap nhat.</p>"
            }}
          />
        </div>
      </section>
    </div>
  );
}
