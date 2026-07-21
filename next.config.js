/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  basePath: isProd ? "/knitknit" : "",
  assetPrefix: isProd ? "/knitknit/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/knitknit" : "",
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
