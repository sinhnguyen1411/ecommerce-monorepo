"use client";

import { useContactSettings } from "@/lib/client-content";

export default function ContactMap() {
  const settings = useContactSettings();

  return (
    <iframe
      src={settings.mapUrl}
      width="100%"
      height="450"
      style={{ border: 0 }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
