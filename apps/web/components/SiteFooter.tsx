import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Harvest & Hearth";

export default function SiteFooter() {
  return (
    <footer className="border-t border-moss/10 bg-cream/70">
      <div className="section-shell grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="pill">Stay grounded</p>
          <h2 className="mt-4 text-2xl font-semibold">{siteName}</h2>
          <p className="mt-3 text-sm text-ink/70">
            A modern market and journal for seasonal produce, pantry staples, and
            thoughtful stories from the field.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Shop
          </p>
          <Link className="block hover:text-ember" href="/products">
            Product catalog
          </Link>
          <Link className="block hover:text-ember" href="/blog">
            Journal
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Visit
          </p>
          <p>Open daily - 08:00 - 18:00</p>
          <p>hello@harvestandhearth.co</p>
        </div>
      </div>
    </footer>
  );
}

