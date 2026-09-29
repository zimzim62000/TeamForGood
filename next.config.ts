import type { NextConfig } from "next";

const configuredAncestors = (process.env.FRAME_ANCESTORS ?? "").split(" ").map((value) => value.trim()).filter(Boolean);
const frameAncestors = ["'self'", ...configuredAncestors, "capacitor://localhost", "https://localhost"];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors.join(" ")}` },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }];
  },
};

export default nextConfig;
