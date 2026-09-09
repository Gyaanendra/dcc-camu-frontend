/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['100.70.11.51', '100.70.11.51:3000', 'localhost:3000', '127.0.0.1:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Proxy same-origin /api/* calls to the backend. The browser only ever
  // talks to the frontend origin, so every request is first-party: no CORS
  // preflights and no third-party cookie blocking between Vercel apps.
  async rewrites() {
    const backendApi = process.env.NEXT_PUBLIC_API_URL || 'https://dcc-camu-backend.vercel.app/api';
    return [
      {
        source: '/api/:path*',
        destination: `${backendApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
