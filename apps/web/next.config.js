/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ["api.vietqr.io"],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**"
      }
    ]
  }
};

module.exports = nextConfig;
