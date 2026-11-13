import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// The dev server blocks pages opened from any address except "localhost", and a blocked page never
// becomes interactive (buttons do nothing). Allow this computer's own addresses (127.0.0.1, its Wi-Fi
// IP, so phones/tablets on your network work), plus APP_URL and DEV_ORIGINS. Dev server only.
const ownAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4")
  .map((n) => n!.address);

const devOrigins = [
  ...new Set(
    [process.env.APP_URL, ...(process.env.DEV_ORIGINS ?? "").split(","), ...ownAddresses]
      .map((v) => v?.trim())
      .filter((v): v is string => !!v)
      .map((v) => {
        try {
          return new URL(v.includes("://") ? v : `http://${v}`).hostname;
        } catch {
          return "";
        }
      })
      .filter((h) => h && h !== "localhost"),
  ),
];

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
