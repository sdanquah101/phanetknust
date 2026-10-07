import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@phanet/ui", "@phanet/supabase"],
  // The certificate PDF reads its fonts from disk at request time.
  outputFileTracingIncludes: { "/certificates/[code]/pdf": ["./public/fonts/certificate/**/*"] },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "10mb" }, staleTimes: { dynamic: 30, static: 300 } },
};

export default nextConfig;
