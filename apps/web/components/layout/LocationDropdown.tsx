"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  GeoDistrict,
  GeoProvince,
  Location,
  getGeoDistricts,
  getGeoProvinces,
  getLocations
} from "@/lib/api";
import { siteConfig } from "@/lib/site";

const normalizeLocationKey = (value?: string | null) => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
};

export default function LocationDropdown() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [geoProvinces, setGeoProvinces] = useState<GeoProvince[]>([]);
  const [geoDistricts, setGeoDistricts] = useState<GeoDistrict[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setIsGeoLoading(true);

    Promise.all([
      getLocations().catch(() => [] as Location[]),
      getGeoProvinces().catch(() => [] as GeoProvince[])
    ])
      .then(([locationData, provinceData]) => {
        if (!active) return;
        setLocations(locationData);
        setGeoProvinces(provinceData);
      })
      .finally(() => {
        if (active) {
          setIsGeoLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!province || geoProvinces.length === 0) {
      setGeoDistricts([]);
      setIsDistrictLoading(false);
      return () => {
        active = false;
      };
    }

    const provinceKey = normalizeLocationKey(province);
    const selectedProvince = geoProvinces.find(
      (item) => normalizeLocationKey(item.name) === provinceKey
    );

    if (!selectedProvince) {
      setGeoDistricts([]);
      setIsDistrictLoading(false);
      return () => {
        active = false;
      };
    }

    setIsDistrictLoading(true);
    getGeoDistricts(selectedProvince.code)
      .then((data) => {
        if (!active) return;
        setGeoDistricts(data);
        if (district && !data.some((item) => normalizeLocationKey(item.name) === normalizeLocationKey(district))) {
          setDistrict("");
        }
      })
      .catch(() => {
        if (active) {
          setGeoDistricts([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsDistrictLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [province, geoProvinces, district]);

  const provinces = useMemo(() => {
    if (geoProvinces.length > 0) {
      return geoProvinces.map((item) => item.name).filter(Boolean);
    }
    return Array.from(new Set(locations.map((item) => item.province))).filter(Boolean);
  }, [geoProvinces, locations]);

  const districts = useMemo(() => {
    if (geoDistricts.length > 0) {
      return geoDistricts.map((item) => item.name).filter(Boolean);
    }
    if (!province) {
      return Array.from(new Set(locations.map((item) => item.district))).filter(Boolean);
    }
    const provinceKey = normalizeLocationKey(province);
    return Array.from(
      new Set(
        locations
          .filter((item) => normalizeLocationKey(item.province) === provinceKey)
          .map((item) => item.district)
      )
    ).filter(Boolean);
  }, [geoDistricts, locations, province]);

  const filteredLocations = useMemo(() => {
    const provinceKey = normalizeLocationKey(province);
    const districtKey = normalizeLocationKey(district);

    return locations.filter((item) => {
      if (provinceKey && normalizeLocationKey(item.province) !== provinceKey) {
        return false;
      }
      if (districtKey && normalizeLocationKey(item.district) !== districtKey) {
        return false;
      }
      return true;
    });
  }, [locations, province, district]);

  useEffect(() => {
    if (filteredLocations.length === 0) {
      setSelectedId(null);
      return;
    }

    if (selectedId === null || !filteredLocations.some((item) => item.id === selectedId)) {
      setSelectedId(filteredLocations[0].id);
    }
  }, [filteredLocations, selectedId]);

  const selectedLocation = locations.find((item) => item.id === selectedId);
  const activeLocation = selectedLocation ?? filteredLocations[0] ?? locations[0];
  const activeAddress = activeLocation
    ? `${activeLocation.address}, ${activeLocation.district}, ${activeLocation.province}`
    : siteConfig.address;
  const label = activeLocation ? activeAddress : "Giao hoặc đến lấy tại";

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
                disabled={isGeoLoading || provinces.length === 0}
              >
                <option value="">
                  {isGeoLoading ? "Đang tải..." : "- Chọn Tỉnh/Thành -"}
                </option>
                {provinces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Quận/Huyện</label>
              <select
                className="field mt-2"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                disabled={!province || isDistrictLoading}
              >
                <option value="">
                  {isDistrictLoading ? "Đang tải..." : "- Chọn Quận/Huyện -"}
                </option>
                {districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="border border-forest/10 bg-white p-3 text-xs text-ink/70">
            Giao hoặc đến lấy tại: <span className="font-semibold">{activeAddress}</span>
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
