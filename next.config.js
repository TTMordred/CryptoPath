// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // why so many? all for nft...
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.opensea.io",
        pathname: "/api/v1/asset/**",
      },
      // Add these to your existing remotePatterns array
      {
        protocol: "https", 
        hostname: "openseauserdata.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.seadn.io",
        pathname: "/**",
      },
      // 
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/**",
      },
      {
        protocol: "http", // For local development server
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pepunks.mypinata.cloud",
        pathname: "/**",
        },
      {
        protocol: "https",
        hostname: "eth-mainnet.g.alchemy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.mint.fun",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "underground.mypinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nftstorage.link",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pepunks.mypinata.cloud",
        pathname: "/**", // Changed from "/ipfs/**" to "/**" to match all paths
      },
      {
        protocol: "https",
        hostname: "metadata.ens.domains",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "zerion-dna.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nft-assets.skybornegenesis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thesadtimescdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "elementals-images.azuki.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maroon-petite-shrew-493.mypinata.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.bueno.art",
        pathname: "/**",
      },
      // Additional common NFT image hosts
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.infura.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.filebase.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "gateway.ipfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dweb.link",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.4everland.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/Orlandovpjr/**",
      },
      {
        protocol: "https",
        hostname: "openseauserdata.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.opensea.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.seadn.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.rariblecdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gu-ids.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.alchemyapi.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s2.coinmarketcap.com",
        pathname: "/**",
      },
      // Adding more blockchain image hosts
      {
        protocol: "https",
        hostname: "assets.foundation.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.superrare.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.mirror-media.xyz",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.zora.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.nftport.xyz",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "metadata.mintable.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.solsea.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "1sc60ixn9c.execute-api.us-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
    // In development mode, disable the strict checking to allow any image
    unoptimized: process.env.NODE_ENV === 'development',
    // unoptimized: false,
  },
  env: {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
        buffer: require.resolve("buffer/"),
        fs: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // Ignore native module build errors
    config.resolve.alias = {
      ...config.resolve.alias,
      "./build/Release/ecdh": false,
    };

    return config;
  },
  // Add important settings for Vercel deployment
  experimental: {},
  // Add extra security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;