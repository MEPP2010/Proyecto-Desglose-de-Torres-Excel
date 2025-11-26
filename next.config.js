/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⭐ Deshabilitar cache estático agresivo
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  
  // ⭐ Headers para evitar cache del navegador
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;