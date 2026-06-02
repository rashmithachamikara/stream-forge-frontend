/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@streamforge/js-sdk'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig
