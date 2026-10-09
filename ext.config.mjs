// X-Frame-Options ALLOWALL lets the platform embed the live preview in an iframe.
// Keep this — removing it breaks the preview pane.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Google fetches /google<token>.html to verify this app's Search Console
  // property. The path is whatever Google issued, so it is read from the
  // environment rather than hardcoded, and no rewrite exists until one is.
  async rewrites() {
    const token = process.env.GSC_SITE_VERIFICATION_TOKEN;
    if (!token) return [];
    return [{ source: `/${token}`, destination: "/api/site-verification" }];
  },

  // Preview is served from a tunnel hostname, not localhost. Next 16 blocks
  // cross-origin dev-only requests (HMR websocket) by default.
  allowedDevOrigins: ["*.modal.host", "*.w.modal.host"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Frame-Options", value: "ALLOWALL" }],
      },
    ];
  },
};

export default nextConfig;
