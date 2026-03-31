import { type HTMLAttributes } from "react";

import { brandMeta, type BrandVariant } from "@/lib/brand";
import { cn } from "@/lib/utils";

import BrandLogo from "./BrandLogo";

export type BrandSignatureMode =
  | "header"
  | "mobile"
  | "footer"
  | "auth"
  | "admin"
  | "about";

type BrandSignatureProps = HTMLAttributes<HTMLDivElement> & {
  mode?: BrandSignatureMode;
  eyebrow?: string | null;
  title?: string;
  subline?: string | null;
  logoVariant?: Extract<BrandVariant, "seal-master" | "seal-light" | "mark-core">;
  logoSizes?: string;
  logoClassName?: string;
  textClassName?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  sublineClassName?: string;
  priority?: boolean;
};

type ModeConfig = {
  root: string;
  logo: string;
  text: string;
  eyebrow: string;
  title: string;
  subline: string;
  defaultEyebrow: string | null;
  defaultSubline: string | null;
  defaultLogoVariant: Extract<BrandVariant, "seal-master" | "seal-light" | "mark-core">;
};

const signatureModes: Record<BrandSignatureMode, ModeConfig> = {
  header: {
    root: "inline-flex min-h-[44px] items-center gap-3 text-left",
    logo: "w-10 shrink-0 sm:w-11",
    text: "min-w-0",
    eyebrow: "hidden",
    title: "truncate whitespace-nowrap text-lg font-semibold leading-tight text-[#173d23] sm:text-[22px]",
    subline: "hidden",
    defaultEyebrow: null,
    defaultSubline: null,
    defaultLogoVariant: "seal-master"
  },
  mobile: {
    root: "inline-flex min-h-[44px] items-center gap-3 text-left",
    logo: "w-9 shrink-0",
    text: "min-w-0",
    eyebrow: "hidden",
    title: "truncate whitespace-nowrap text-base font-semibold leading-tight text-[#173d23]",
    subline: "hidden",
    defaultEyebrow: null,
    defaultSubline: null,
    defaultLogoVariant: "seal-master"
  },
  footer: {
    root: "inline-flex items-center gap-4 text-left",
    logo: "w-12 shrink-0 sm:w-14",
    text: "min-w-0 max-w-[20rem]",
    eyebrow: "hidden",
    title: "text-xl font-semibold leading-tight text-white",
    subline: "mt-1 text-xs leading-5 text-white/70 sm:text-sm",
    defaultEyebrow: null,
    defaultSubline: brandMeta.legalName,
    defaultLogoVariant: "seal-master"
  },
  auth: {
    root: "flex flex-col items-center gap-3 text-center",
    logo: "w-[72px] shrink-0 sm:w-20",
    text: "min-w-0 max-w-[22rem]",
    eyebrow: "text-[11px] font-semibold uppercase tracking-[0.22em] text-[#58724c]",
    title: "mt-2 text-xl font-semibold leading-tight text-[#193722] sm:text-2xl",
    subline: "mt-2 text-sm leading-6 text-[#5f6d58]",
    defaultEyebrow: null,
    defaultSubline: brandMeta.supportingLine,
    defaultLogoVariant: "seal-master"
  },
  admin: {
    root: "inline-flex items-center gap-3 text-left",
    logo: "w-9 shrink-0 sm:w-10",
    text: "min-w-0",
    eyebrow: "text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400",
    title: "truncate whitespace-nowrap text-base font-semibold leading-tight text-slate-900 sm:text-lg",
    subline: "hidden",
    defaultEyebrow: brandMeta.adminLabel,
    defaultSubline: null,
    defaultLogoVariant: "seal-master"
  },
  about: {
    root: "inline-flex items-center gap-3 text-left",
    logo: "w-12 shrink-0",
    text: "min-w-0",
    eyebrow: "hidden",
    title: "text-lg font-semibold leading-tight text-[#173722]",
    subline: "mt-1 text-sm leading-6 text-[#5c6b53]",
    defaultEyebrow: null,
    defaultSubline: brandMeta.supportingLine,
    defaultLogoVariant: "seal-master"
  }
};

export default function BrandSignature({
  mode = "header",
  eyebrow,
  title,
  subline,
  logoVariant,
  logoSizes,
  logoClassName,
  textClassName,
  eyebrowClassName,
  titleClassName,
  sublineClassName,
  className,
  priority = false,
  ...props
}: BrandSignatureProps) {
  const config = signatureModes[mode];
  const resolvedEyebrow = eyebrow === undefined ? config.defaultEyebrow : eyebrow;
  const resolvedTitle = title || brandMeta.shortName;
  const resolvedSubline = subline === undefined ? config.defaultSubline : subline;

  return (
    <div className={cn(config.root, className)} data-brand-mode={mode} {...props}>
      <BrandLogo
        variant={logoVariant || config.defaultLogoVariant}
        decorative
        priority={priority}
        sizes={logoSizes}
        className={cn(config.logo, logoClassName)}
      />
      <div className={cn(config.text, textClassName)}>
        {resolvedEyebrow ? (
          <p className={cn(config.eyebrow, eyebrowClassName)}>{resolvedEyebrow}</p>
        ) : null}
        <p className={cn(config.title, titleClassName)}>{resolvedTitle}</p>
        {resolvedSubline ? (
          <p className={cn(config.subline, sublineClassName)}>{resolvedSubline}</p>
        ) : null}
      </div>
    </div>
  );
}
