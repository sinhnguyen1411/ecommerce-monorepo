import { getPage } from "@/lib/api";

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="pill">Gioi thieu</p>
          <h1 className="mt-4 text-4xl font-semibold">Ve TTC</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            Noi ket noi giua nong trai va nguoi tieu dung.
          </p>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="card-surface p-8">
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
