import Image, { type ImageProps } from "next/image";

import { getBrandAsset, type BrandVariant } from "@/lib/brand";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type BrandLogoProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  variant?: BrandVariant;
  alt?: string;
  decorative?: boolean;
  width?: number;
  height?: number;
};

export default function BrandLogo({
  variant = "seal-master",
  alt,
  decorative = false,
  width,
  height,
  className,
  ...props
}: BrandLogoProps) {
  const asset = getBrandAsset(variant);

  return (
    <Image
      src={asset.src}
      alt={decorative ? "" : alt || `${siteConfig.name} logo`}
      width={width || asset.width}
      height={height || asset.height}
      aria-hidden={decorative || undefined}
      className={cn("brand-logo", className)}
      {...props}
    />
  );
}
