import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/reports/2024",
        destination: "/reports/2024/index.html",
        permanent: true,
      },
      {
        source: "/reports/2023",
        destination: "/reports/2023/index.html",
        permanent: true,
      },
      {
        source: "/reports/2013-2022",
        destination: "/reports/2013-2022/index.html",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
