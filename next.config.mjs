/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    domains: ["kifashionbackend2-production.up.railway.app"],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

  // Production optimization
  compress: true,
  poweredByHeader: false,

  // Output configuration for Vercel
  output: "standalone",
};

export default nextConfig;
