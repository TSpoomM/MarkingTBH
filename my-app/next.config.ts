import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/markingsticker";
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // allowedDevOrigins: ["10.3.8.126"],
};

export default nextConfig;
