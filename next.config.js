/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: __dirname },
  experimental: {
    allowedDevOrigins: [
      'http://localhost:9000',
      'http://localhost:6000'
    ],
  },
};

module.exports = nextConfig;