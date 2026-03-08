/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['static.wixstatic.com', 'media.wix.com', 'wcnalqnkvspthewjyhqt.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.wixstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.wix.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Add experimental features for better error handling
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
