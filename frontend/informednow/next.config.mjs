/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
          return [
              {
                  source: "/api/:path*", // Matches any request starting with /api/
                  destination: "http://localhost:3000/api/:path*", // Proxies it to your Express backend
              },
          ];
    }, 
};

export default nextConfig;