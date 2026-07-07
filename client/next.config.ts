import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-lib / pdfjs-dist / formidable are used only server-side (SAP upload +
  // split). Keep them out of the bundler so pdfjs's ESM worker/eval and
  // formidable's native bits load from node_modules at runtime intact.
  serverExternalPackages: ["pdfjs-dist", "pdf-lib", "formidable"],
  async headers() {
    return [
      {
        // Force browsers to revalidate HTML documents so a deploy/revert
        // actually reaches users instead of getting stuck behind a stale
        // cached page (#488 — this bit us hard on 2026-07-06). Matches page
        // routes only: NOT /_next/* (hashed static assets keep their built-in
        // immutable caching), NOT /api/*, and NOT anything with a file
        // extension (.js/.css/.png/etc.). must-revalidate + no-cache means the
        // browser may keep a copy but must check it's current on each load.
        source: "/((?!_next/|api/|.*\\.).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
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
