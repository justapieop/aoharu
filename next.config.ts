import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: '1gb',
    serverActions: {
      bodySizeLimit: '1gb',
    },
  },
};

export default nextConfig;
