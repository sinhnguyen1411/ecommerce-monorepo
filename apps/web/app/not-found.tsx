import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-shell py-20">
      <div className="card-surface mx-auto max-w-2xl p-10 text-center">
        <p className="pill mx-auto w-fit">Not Found</p>
        <h1 className="mt-6 text-3xl font-semibold">That page is out of season.</h1>
        <p className="mt-4 text-ink/70">
          The link you followed no longer exists. Try heading back to the storefront
          and continue browsing.
        </p>
        <div className="mt-8">
          <Link className="btn-primary" href="/">
            Return home
          </Link>
        </div>
      </div>
    </section>
  );
}

