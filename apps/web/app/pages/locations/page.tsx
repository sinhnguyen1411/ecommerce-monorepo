import SectionTitle from "@/components/common/SectionTitle";
import { siteConfig } from "@/lib/site";
import { getLocations } from "@/lib/api";

import LocationsClient from "./LocationsClient";

export const metadata = {
  title: `Cửa hàng | ${siteConfig.name}`,
  description: `Danh sách điểm nhận hàng và cửa hàng ${siteConfig.name}.`
};

export default async function LocationsPage() {
  const locations = await getLocations().catch(() => []);

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Cửa hàng"
          title={`Điểm nhận hàng ${siteConfig.name}`}
          description="Tìm kiếm địa điểm gần bạn nhất và nhận hàng tại cửa hàng."
        />
      </section>

      <LocationsClient locations={locations} />
    </div>
  );
}
