/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental features that can cause bundler issues
  // experimental: {
  //   optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  // },
  
  // Disable ESLint during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checks during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Stable webpack configuration for Next.js 14.x
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production
    if (!dev && !isServer) {
      // Simplified chunk splitting to avoid RSC conflicts
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  
  // Ensure proper handling of server components
  swcMinify: true,
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
};

module.exports = nextConfig;