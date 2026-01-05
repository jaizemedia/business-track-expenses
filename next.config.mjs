/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.gstatic.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
