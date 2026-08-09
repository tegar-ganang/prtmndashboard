import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "103.174.115.172",
      ],
    },
  },
};

export default nextConfig;