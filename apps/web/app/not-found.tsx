import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-shell py-20">
      <div className="card-surface mx-auto max-w-2xl p-10 text-center">
        <p className="pill mx-auto w-fit">Không tìm thấy</p>
        <h1 className="mt-6 text-3xl font-semibold">Trang bạn tìm không tồn tại.</h1>
        <p className="mt-4 text-ink/70">
          Hãy quay về trang chủ hoặc tiếp tục mua sắm.
        </p>
        <div className="mt-8">
          <Link className="btn-primary" href="/">
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
  );
}
