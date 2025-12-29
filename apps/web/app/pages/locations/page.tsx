import { getLocations } from "@/lib/api";

import LocationsClient from "./LocationsClient";

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="pill">Cua hang</p>
          <h1 className="mt-4 text-4xl font-semibold">Diem nhan hang TTC</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            Tim kiem dia diem gan ban nhat va nhan hang tai cua hang.
          </p>
        </div>
      </section>

      <LocationsClient locations={locations} />
    </div>
  );
}
