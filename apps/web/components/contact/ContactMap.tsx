"use client";

import { useContactSettings } from "@/lib/client-content";
import type { ContactSettings } from "@/lib/content";

export default function ContactMap({
  contactSettings
}: {
  contactSettings?: ContactSettings;
}) {
  const liveSettings = useContactSettings();
  const settings = contactSettings || liveSettings;

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
