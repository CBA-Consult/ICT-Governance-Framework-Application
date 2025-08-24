/**
 * Next.js config: proxy API requests to the local Express API during development.
 * This keeps frontend code using relative `/api/...` unchanged while the API
 * runs on port 4000.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
