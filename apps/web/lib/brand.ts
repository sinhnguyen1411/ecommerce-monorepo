export type BrandVariant =
  | "seal-master"
  | "seal-light"
  | "mark-core"
  | "editorial-lockup";

type BrandAsset = {
  src: string;
  width: number;
  height: number;
};

const brandAssets: Record<BrandVariant, BrandAsset> = {
  "seal-master": {
    src: "/brand/tam-bo-original-alpha.png",
    width: 795,
    height: 795
  },
  "seal-light": {
    src: "/brand/tam-bo-original-alpha.png",
    width: 795,
    height: 795
  },
  "mark-core": {
    src: "/brand/tam-bo-mark-core.svg",
    width: 220,
    height: 188
  },
  "editorial-lockup": {
    src: "/brand/tam-bo-editorial-lockup.svg",
    width: 920,
    height: 260
  }
};

export const brandMeta = {
  shortName: "Nông Dược Tam Bố",
  legalName: "Công Ty Cổ Phần Nông Dược Tam Bố",
  tagline: "Giải pháp sinh học đồng hành cùng nhà nông",
  supportingLine: "Nông nghiệp xanh bền vững",
  adminLabel: "Khu vực quản trị",
  storyLabel: "Câu chuyện thương hiệu"
};

export function getBrandAsset(variant: BrandVariant): BrandAsset {
  return brandAssets[variant];
}
