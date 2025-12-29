import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-shell py-20">
      <div className="card-surface mx-auto max-w-2xl p-10 text-center">
        <p className="pill mx-auto w-fit">Khong tim thay</p>
        <h1 className="mt-6 text-3xl font-semibold">Trang ban tim khong ton tai.</h1>
        <p className="mt-4 text-ink/70">
          Hay quay ve trang chu hoac tiep tuc mua sam.
        </p>
        <div className="mt-8">
          <Link className="btn-primary" href="/">
            Ve trang chu
          </Link>
        </div>
      </div>
    </section>
  );
}
