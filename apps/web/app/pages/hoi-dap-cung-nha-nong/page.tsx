import { getQnA } from "@/lib/api";

export default async function QnAPage() {
  const items = await getQnA();

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="pill">Hoi dap</p>
          <h1 className="mt-4 text-4xl font-semibold">Hoi dap cung nha nong</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            Tong hop cau hoi thuong gap ve don hang, giao hang va nguon nong san.
          </p>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="card-surface p-6 text-sm text-ink/70">
              Chua co cau hoi.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="card-surface p-6">
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm text-ink/70">{item.answer}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
