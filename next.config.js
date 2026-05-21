/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' nur außerhalb von Vercel aktivieren (Docker/Self-Hosting)
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'sumizzyukytgjllgwjqo.supabase.co',
      },
    ],
  },
};
module.exports = nextConfig;
