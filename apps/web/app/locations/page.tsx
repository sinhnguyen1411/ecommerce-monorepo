import SectionTitle from "@/components/common/SectionTitle";
import { getLocations } from "@/lib/api";

import LocationsClient from "../pages/locations/LocationsClient";

export const metadata = {
  title: "Cua hang | Nong Nghiep TTC",
  description: "Danh sach diem nhan hang va cua hang TTC."
};

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Cua hang"
          title="Diem nhan hang TTC"
          description="Tim kiem dia diem gan ban nhat va nhan hang tai cua hang."
        />
      </section>

      <LocationsClient locations={locations} />
    </div>
  );
}
