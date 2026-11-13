import type { NextConfig } from "next";

// Let phones/tablets on your network use the dev server (e.g. APP_URL="http://192.168.1.25:3000").
// Without this, Next.js blocks their dev requests and pages never become interactive.
const devOrigins = [process.env.APP_URL, ...(process.env.DEV_ORIGINS ?? "").split(",")]
  .map((v) => v?.trim())
  .filter((v): v is string => !!v)
  .map((v) => {
    try {
      return new URL(v.includes("://") ? v : `http://${v}`).hostname;
    } catch {
      return "";
    }
  })
  .filter((h) => h && h !== "localhost");

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  // Classic dynamic rendering: almost every page is personalised per family.
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }, // camera: QR card scanner only
        ],
      },
    ];
  },
};

export default nextConfig;
