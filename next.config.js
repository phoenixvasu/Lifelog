/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    unoptimized: true, // Temporarily disable image optimization to debug the issue
  },
};

module.exports = nextConfig;
