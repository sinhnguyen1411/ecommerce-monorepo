"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

import { isAuthOnlyPath } from "@/lib/auth-route";
import { useContactSettings } from "@/lib/client-content";
import { defaultContactSettings } from "@/lib/content";

export default function SocialFloatingButtons() {
  const pathname = usePathname();
  const settings = useContactSettings();
  if (isAuthOnlyPath(pathname)) {
    return null;
  }

  const mobilePhone =
    settings.mobilePhone?.trim() ||
    settings.phone?.trim() ||
    defaultContactSettings.phone;
  const phoneDigits = mobilePhone.replace(/[^0-9+]/g, "");
  const facebookUrl = settings.facebookUrl?.trim() || defaultContactSettings.facebookUrl;
  const zaloUrl = settings.zaloUrl?.trim() || defaultContactSettings.zaloUrl;
  const baseButton =
    "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-[box-shadow,filter] duration-200 hover:shadow-xl hover:brightness-110 cursor-pointer";
  const iconClassName = "h-6 w-6";

  return (
    <div className="social-floating fixed bottom-6 right-6 z-[70] flex flex-col gap-3">
      <Link
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        className={`${baseButton} bg-[#1877f2]`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={iconClassName}
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978c.401 0 .955.042 1.468.103a9 9 0 0 1 1.141.195v3.325a9 9 0 0 0-.653-.036a27 27 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.7 1.7 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103l-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647"
          />
        </svg>
      </Link>
      <Link
        href={`tel:${phoneDigits}`}
        aria-label="Gọi di động"
        className={`${baseButton} bg-[#1d4ed8]`}
      >
        <Phone className={iconClassName} />
      </Link>
      <Link
        href={zaloUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Zalo"
        className={`${baseButton} bg-[#0068ff]`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={iconClassName}
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M12.49 10.272v-.45h1.347v6.322h-.77a.576.576 0 0 1-.577-.573v.001a3.27 3.27 0 0 1-1.938.632a3.284 3.284 0 0 1-3.284-3.282a3.284 3.284 0 0 1 3.284-3.282a3.27 3.27 0 0 1 1.937.632zM6.919 7.79v.205c0 .382-.051.694-.3 1.06l-.03.034a8 8 0 0 0-.242.285L2.024 14.8h4.895v.768a.576.576 0 0 1-.577.576H0v-.362c0-.443.11-.641.25-.847L4.858 9.23H.192V7.79zm8.551 8.354a.48.48 0 0 1-.48-.48V7.79h1.441v8.354zM20.693 9.6a3.306 3.306 0 1 1 .002 6.612a3.306 3.306 0 0 1-.002-6.612m-10.14 5.253a1.932 1.932 0 1 0 0-3.863a1.932 1.932 0 0 0 0 3.863m10.14-.003a1.945 1.945 0 1 0 0-3.89a1.945 1.945 0 0 0 0 3.89"
          />
        </svg>
      </Link>
    </div>
  );
}
