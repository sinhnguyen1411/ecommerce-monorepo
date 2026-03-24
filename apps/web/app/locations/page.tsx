import SectionTitle from "@/components/common/SectionTitle";
import { getLocations } from "@/lib/api";

import LocationsClient from "../pages/locations/LocationsClient";

export const metadata = {
  title: "Cửa hàng | Nông Dược Tam Bố",
  description: "Danh sách điểm nhận hàng và cửa hàng Tam Bố."
};

export default async function LocationsPage() {
  const locations = await getLocations().catch(() => []);

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Cửa hàng"
          title="Điểm nhận hàng Tam Bố"
          description="Tìm kiếm địa điểm gần bạn nhất và nhận hàng tại cửa hàng."
        />
      </section>

      <LocationsClient locations={locations} />
    </div>
  );
}
