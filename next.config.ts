import type { NextConfig } from "next";

const localBasePath = process.env.LOCAL_BASE_PATH === "1" ? "/japanese" : "";

const nextConfig: NextConfig = {
  basePath: localBasePath,
};

export default nextConfig;
