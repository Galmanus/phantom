// next.config.mjs
const nextConfig = {
  // Skip type checking during build (SDK has pre-existing TypeScript issues)
  typescript: {
    ignoreBuildErrors: true,
  },
  // REQUIRED: WASM support
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }
    // Prevent WASM from being processed as normal asset
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })
    return config
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // REQUIRED for SharedArrayBuffer (Atomics, WASM threads)
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Security hardening
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://*.infura.io https://*.alchemy.com https://api.avnu.fi https://*.vesu.xyz wss://*.starknet.io https://starknet-sepolia.public.blastapi.io",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
      {
        source: '/:path*.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
        ],
      },
    ]
  },
}

export default nextConfig