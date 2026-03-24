const candidateImageOrigins = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.API_INTERNAL_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://img.vietqr.io",
  "https://images.pexels.com",
  "https://images.unsplash.com",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);

function toRemotePattern(origin) {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return {
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      port: parsed.port || "",
      pathname: "/**"
    };
  } catch {
    return null;
  }
}

const remotePatternMap = new Map();
for (const origin of candidateImageOrigins) {
  const pattern = toRemotePattern(origin);
  if (!pattern) {
    continue;
  }
  const key = `${pattern.protocol}:${pattern.hostname}:${pattern.port}`;
  remotePatternMap.set(key, pattern);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: Array.from(remotePatternMap.values())
  }
};

module.exports = nextConfig;
