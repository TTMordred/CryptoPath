import type { NextConfig } from "next";

const nextConfig: NextConfig = {
images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.opensea.io",
        pathname: "/api/v1/asset/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
};

export default nextConfig;
