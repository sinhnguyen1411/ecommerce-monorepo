"use client";

import { useMemo } from "react";

import { AdminField, selectClass } from "./AdminHelpers";

export type AdminLinkOption = {
  value: string;
  label: string;
  group: string;
};

function groupOptions(options: AdminLinkOption[]) {
  const map = new Map<string, AdminLinkOption[]>();
  options.forEach((item) => {
    const bucket = map.get(item.group) || [];
    bucket.push(item);
    map.set(item.group, bucket);
  });
  return Array.from(map.entries());
}

export default function AdminLinkPicker({
  label,
  value,
  options,
  onChange,
  onBlur,
  helper,
  testId
}: {
  label: string;
  value: string;
  options: AdminLinkOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  helper?: string;
  testId?: string;
}) {
  const groups = useMemo(() => groupOptions(options), [options]);
  const isLegacyValue = Boolean(value) && !options.some((item) => item.value === value);

  return (
    <AdminField
      label={label}
      helper={helper || "Chọn liên kết có sẵn để đảm bảo đúng route runtime."}
    >
      <div className="space-y-2">
        <select
          className={selectClass}
          value={isLegacyValue ? "__legacy__" : value}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === "__legacy__") {
              return;
            }
            onChange(nextValue);
          }}
          onBlur={onBlur}
          data-testid={testId}
        >
          <option value="/">Trang chủ (/)</option>
          {isLegacyValue ? (
            <option value="__legacy__">{`Legacy link: ${value}`}</option>
          ) : null}
          {groups.map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((item) => (
                <option key={`${group}-${item.value}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {isLegacyValue ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
            Link cũ không còn trong danh sách chuẩn. Vui lòng chọn lại để publish.
          </p>
        ) : null}
      </div>
    </AdminField>
  );
}
