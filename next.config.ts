import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "encrypted-tbn0.gstatic.com",
      "encrypted-tbn1.gstatic.com",
      // add more if needed
    ],
  },
};

export default nextConfig;
