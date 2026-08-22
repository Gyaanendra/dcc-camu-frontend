/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: ['100.70.11.51', '100.70.11.51:3000', 'localhost:3000', '127.0.0.1:3000'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
