/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle eccrypto native module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "path": require.resolve("path-browserify"),
      "fs": false,
    }

    // Ignore native module build errors
    config.resolve.alias = {
      ...config.resolve.alias,
      "./build/Release/ecdh": false,
    }

    return config
  },
}

module.exports = nextConfig 