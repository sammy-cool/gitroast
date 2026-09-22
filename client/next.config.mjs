/** @type {import('next').NextConfig} */
const nextConfig = {
  // WHY compress: enables Gzip compression for Next.js responses (HTML, CSS, JS)
  compress: true,

  // WHY images: enables next/image optimization with AVIF/WebP for GitHub avatars
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
