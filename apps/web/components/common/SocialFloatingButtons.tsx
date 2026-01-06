import Link from "next/link";
import { Facebook, MessageCircle, MessageSquare } from "lucide-react";

import { siteConfig } from "@/lib/site";

export default function SocialFloatingButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <Link
        href={siteConfig.social.zalo}
        target="_blank"
        rel="noreferrer"
        aria-label="Zalo"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-white shadow-lg transition hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </Link>
      <Link
        href={siteConfig.social.messenger}
        target="_blank"
        rel="noreferrer"
        aria-label="Messenger"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-sun text-ink shadow-lg transition hover:scale-105"
      >
        <MessageSquare className="h-5 w-5" />
      </Link>
      <Link
        href={siteConfig.social.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-clay text-white shadow-lg transition hover:scale-105"
      >
        <Facebook className="h-5 w-5" />
      </Link>
    </div>
  );
}
