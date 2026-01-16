import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export app as static HTML so nginx can serve it from /var/www/dovec-frontend
  output: "export",
};

export default nextConfig;
