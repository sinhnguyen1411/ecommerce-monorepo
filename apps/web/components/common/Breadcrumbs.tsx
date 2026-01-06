import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink/70">{item.label}</span>
          )}
          {index < items.length - 1 ? <span>/</span> : null}
        </div>
      ))}
    </div>
  );
}
