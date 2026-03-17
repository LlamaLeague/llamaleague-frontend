/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `https://llamaleague-api.onrender.com/api/:path*`,
      },
    ]
  },
}

export default nextConfig