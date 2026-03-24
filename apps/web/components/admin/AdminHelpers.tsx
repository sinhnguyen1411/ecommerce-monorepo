"use client";

export const inputClass =
  "min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm";
export const textareaClass =
  "min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm";
export const selectClass =
  "min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm";
export const primaryActionClass =
  "bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer";
export const secondaryActionClass =
  "normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer";
export const dangerActionClass =
  "normal-case tracking-normal text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-base md:text-sm cursor-pointer";
export const tertiaryActionClass =
  "normal-case tracking-normal text-slate-600 hover:text-slate-900 text-base md:text-sm cursor-pointer";

export function panelByDensity(density: "compact" | "comfortable") {
  return density === "compact"
    ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
}

export function AdminField({
  label,
  helper,
  children
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-base font-semibold text-slate-700 md:text-sm cursor-pointer">
      <span>{label}</span>
      {children}
      {helper ? (
        <span className="text-base font-normal text-slate-500 md:text-xs">{helper}</span>
      ) : null}
    </label>
  );
}

export function AdminSectionHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="h-11 rounded-lg border border-slate-200 px-4 text-base font-semibold text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 cursor-pointer md:text-xs"
      >
        Trước
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPageChange(value)}
          className={`h-11 w-11 rounded-lg border text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 cursor-pointer md:text-xs ${
            value === page
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-slate-200 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          }`}
        >
          {value}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="h-11 rounded-lg border border-slate-200 px-4 text-base font-semibold text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 cursor-pointer md:text-xs"
      >
        Sau
      </button>
    </div>
  );
}
