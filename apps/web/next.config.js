/** @type {import('next').NextConfig} */
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const parsedDirectusUrl = new URL(directusUrl);

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: parsedDirectusUrl.protocol.replace(":", ""),
        hostname: parsedDirectusUrl.hostname,
        port: parsedDirectusUrl.port,
        pathname: "/**"
      }
    ]
  }
};

module.exports = nextConfig;

