"use client";

import { useMemo, useState } from "react";

import { Location } from "@/lib/api";

export default function LocationsClient({ locations }: { locations: Location[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) {
      return locations;
    }

    const lower = query.toLowerCase();
    return locations.filter((location) =>
      [location.name, location.province, location.district, location.address]
        .join(" ")
        .toLowerCase()
        .includes(lower)
    );
  }, [locations, query]);

  return (
    <div className="section-shell pb-16">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Diem nhan hang</h2>
          <input
            className="field max-w-sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tim theo tinh, quan, dia diem"
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-ink/70">Khong tim thay dia diem phu hop.</p>
          ) : (
            filtered.map((location) => (
              <div
                key={location.id}
                className="rounded-[24px] border border-forest/10 bg-white/80 p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{location.name}</h3>
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    {location.province}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/70">{location.address}</p>
                <p className="mt-1 text-sm text-ink/60">
                  {location.district}, {location.province}
                </p>
                <div className="mt-3 text-sm text-ink/60">
                  <p>{location.phone}</p>
                  <p>{location.hours}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
