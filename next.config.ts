import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increased to support video file uploads
    },
  } as any, // Type assertion needed for experimental features
};

export default nextConfig;
