"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Location, getLocations } from "@/lib/api";
import { siteConfig } from "@/lib/site";

export default function LocationDropdown() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getLocations()
      .then((data) => {
        if (active) {
          setLocations(data);
        }
      })
      .catch(() => {
        if (active) {
          setLocations([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const provinces = useMemo(() => {
    return Array.from(new Set(locations.map((item) => item.province))).filter(Boolean);
  }, [locations]);

  const districts = useMemo(() => {
    if (!province) {
      return Array.from(new Set(locations.map((item) => item.district))).filter(Boolean);
    }
    return Array.from(
      new Set(locations.filter((item) => item.province === province).map((item) => item.district))
    ).filter(Boolean);
  }, [locations, province]);

  const filteredLocations = useMemo(() => {
    return locations.filter((item) => {
      if (province && item.province !== province) {
        return false;
      }
      if (district && item.district !== district) {
        return false;
      }
      return true;
    });
  }, [locations, province, district]);

  const selectedLocation = locations.find((item) => item.id === selectedId);
  const label = selectedLocation ? `${selectedLocation.name}` : "Giao hoặc đến lấy tại";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden items-center gap-2 border border-forest/20 bg-white px-3 py-2 text-xs font-semibold text-forest lg:flex">
          <MapPin className="h-4 w-4" />
          <span className="max-w-[180px] truncate">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Khu vực mua hàng</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Tỉnh/Thành</label>
              <select
                className="field mt-2"
                value={province}
                onChange={(event) => {
                  setProvince(event.target.value);
                  setDistrict("");
                }}
              >
                <option value="">- Chọn Tỉnh thành -</option>
                {provinces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Quận/huyện</label>
              <select
                className="field mt-2"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
              >
                <option value="">- Chọn Quận huyện -</option>
                {districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="border border-forest/10 bg-white p-3 text-xs text-ink/70">
            Giao hoặc đến lấy tại:{" "}
            <span className="font-semibold">{selectedLocation?.address || siteConfig.address}</span>
          </div>
          <p className="text-xs text-ink/60">
            Chọn cửa hàng gần bạn nhất để tối ưu chi phí giao hàng. Hoặc đến lấy hàng.
          </p>
          <div className="max-h-56 space-y-3 overflow-y-auto">
            {filteredLocations.length === 0 ? (
              <p className="text-xs text-ink/60">Chưa có thông tin cửa hàng.</p>
            ) : (
              filteredLocations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full border px-3 py-2 text-left text-xs ${
                    selectedId === item.id
                      ? "border-forest bg-forest/10 text-forest"
                      : "border-forest/10 bg-white text-ink"
                  }`}
                >
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-ink/70">
                    {item.address}, {item.district}, {item.province}
                  </p>
                  <p className="mt-1 text-ink/60">{item.phone || siteConfig.phone}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
