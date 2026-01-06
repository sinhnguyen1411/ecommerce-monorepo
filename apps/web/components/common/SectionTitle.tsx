import { cn } from "@/lib/utils";

export default function SectionTitle({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.2em] text-forest/70">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
      {description ? <p className="text-sm text-ink/70">{description}</p> : null}
    </div>
  );
}
