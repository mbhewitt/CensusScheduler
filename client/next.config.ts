import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-lib / pdfjs-dist / formidable are used only server-side (SAP upload +
  // split). Keep them out of the bundler so pdfjs's ESM worker/eval and
  // formidable's native bits load from node_modules at runtime intact.
  serverExternalPackages: ["pdfjs-dist", "pdf-lib", "formidable"],
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
