import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1"],
  async redirects() {
    return [
      { source: "/chatbot", destination: "/dashboard", permanent: true },
      { source: "/dashboard/new", destination: "/dashboard", permanent: true },
      { source: "/register/check-email", destination: "/login", permanent: true },
      { source: "/register/verify-phone", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
