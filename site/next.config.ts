import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lib/db reads SQL migrations from disk at runtime; ship them with every
  // server function (Vercel only bundles files it can trace by default).
  outputFileTracingIncludes: {
    "/**": ["./db/migrations/**/*.sql"],
  },
};

export default nextConfig;
