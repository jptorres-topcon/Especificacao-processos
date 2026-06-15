/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/adapter-pg", "pg"],
  },
};

export default nextConfig;
