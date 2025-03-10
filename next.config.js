/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer/'),
        fs: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        zlib: false
      }
    }

    // Ignore native module build errors
    config.resolve.alias = {
      ...config.resolve.alias,
      './build/Release/ecdh': false,
    }

    return config
  },
}

module.exports = nextConfig 