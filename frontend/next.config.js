/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        THROTTL_API_URL: process.env.THROTTL_API_URL || 'http://localhost:8080',
        PROMETHEUS_URL: process.env.PROMETHEUS_URL || 'http://localhost:9090',
        GRAFANA_URL: process.env.GRAFANA_URL || 'http://localhost:3000',
    },
    async rewrites() {
        return [
            {
                source: '/api/throttl/:path*',
                destination: `${process.env.THROTTL_API_URL || 'http://localhost:8080'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;