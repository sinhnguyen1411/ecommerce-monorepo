"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

import { isAuthOnlyPath } from "@/lib/auth-route";
import { useContactSettings } from "@/lib/client-content";
import { defaultContactSettings } from "@/lib/content";

export default function SocialFloatingButtons() {
  const pathname = usePathname();
  const settings = useContactSettings();
  const hiddenOnRoute = isAuthOnlyPath(pathname);
  const [isDesktop, setIsDesktop] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [footerLift, setFooterLift] = useState(0);

  const mobilePhone =
    settings.mobilePhone?.trim() ||
    settings.phone?.trim() ||
    defaultContactSettings.phone;
  const phoneDigits = mobilePhone.replace(/[^0-9+]/g, "");
  const facebookUrl = settings.facebookUrl?.trim() || defaultContactSettings.facebookUrl;
  const zaloUrl = settings.zaloUrl?.trim() || defaultContactSettings.zaloUrl;
  const baseButton = "social-floating__btn";
  const iconClassName = "h-6 w-6";
  const floatingClassName = useMemo(() => {
    const classes = [
      "social-floating",
      "fixed",
      "bottom-6",
      "right-6",
      "z-[70]",
      "flex",
      "flex-col",
      "gap-3"
    ];
    if (isDesktop) {
      classes.push("social-floating--desktop");
      if (!expanded) {
        classes.push("social-floating--compact");
      }
    } else {
      classes.push("social-floating--mobile");
    }
    if (footerLift > 0) {
      classes.push("social-floating--lifted");
    }
    return classes.join(" ");
  }, [expanded, footerLift, isDesktop]);
  const dynamicBottom = 24 + Math.min(footerLift, 260);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const media = window.matchMedia("(min-width: 1024px)");
    const handleMedia = () => {
      const nextDesktop = media.matches;
      setIsDesktop(nextDesktop);
      setExpanded(!nextDesktop);
    };
    handleMedia();
    media.addEventListener("change", handleMedia);
    return () => media.removeEventListener("change", handleMedia);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const updateLift = () => {
      const footer = document.querySelector(".footer-main");
      if (!footer) {
        setFooterLift(0);
        return;
      }
      const rect = footer.getBoundingClientRect();
      const overlap = Math.max(0, window.innerHeight - rect.top);
      setFooterLift(overlap > 0 ? overlap + 16 : 0);
    };
    updateLift();
    window.addEventListener("resize", updateLift);
    window.addEventListener("scroll", updateLift, { passive: true });
    return () => {
      window.removeEventListener("resize", updateLift);
      window.removeEventListener("scroll", updateLift);
    };
  }, []);

  if (hiddenOnRoute) {
    return null;
  }

  return (
    <div
      className={floatingClassName}
      style={{ bottom: `${dynamicBottom}px` }}
      onMouseEnter={() => {
        if (isDesktop) {
          setExpanded(true);
        }
      }}
      onMouseLeave={() => {
        if (isDesktop) {
          setExpanded(false);
        }
      }}
      onFocusCapture={() => {
        if (isDesktop) {
          setExpanded(true);
        }
      }}
      onBlurCapture={(event) => {
        if (!isDesktop) {
          return;
        }
        const related = event.relatedTarget as Node | null;
        if (!related || !event.currentTarget.contains(related)) {
          setExpanded(false);
        }
      }}
    >
      <Link
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        className={`${baseButton} social-floating__btn--facebook`}
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
        className={`${baseButton} social-floating__btn--phone`}
      >
        <Phone className={iconClassName} />
      </Link>
      <Link
        href={zaloUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Zalo"
        className={`${baseButton} social-floating__btn--zalo`}
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
