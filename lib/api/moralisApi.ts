import axios from 'axios';
import { toast } from 'sonner';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjY4ODEyMzE5LWNiMDAtNDA3MC1iOTEyLWIzNTllYjI4ZjQyOCIsIm9yZ0lkIjoiNDM3Nzk0IiwidXNlcklkIjoiNDUwMzgyIiwidHlwZUlkIjoiYTU5Mzk2NGYtZWUxNi00NGY3LWIxMDUtZWNhMzAwMjUwMDg4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDI3ODk3MzEsImV4cCI6NDg5ODU0OTczMX0.4XB5n8uVFQkMwMO2Ck4FbNQw8daQp1uDdMvXmYFr9WA';

// Simple in-memory cache for API responses
const responseCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Rate limiting 
const REQUEST_DELAY = 500; // ms between requests
let lastRequestTime = 0;

// Chain mapping from chain ID to Moralis chain name
const CHAIN_MAPPING: Record<string, string> = {
  '0x1': 'eth',
  '0xaa36a7': 'sepolia',
  '0x38': 'bsc',
  '0x61': 'bsc testnet'
};

/**
 * Makes a rate-limited request to Moralis API
 */
async function moralisRequest(
  endpoint: string,
  params: Record<string, any> = {},
  chainId: string
): Promise<any> {
  // Validate chain
  const chain = CHAIN_MAPPING[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  // Create cache key
  const cacheKey = `${endpoint}-${chain}-${JSON.stringify(params)}`;
  
  // Check cache first
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
    return cachedResponse.data;
  }
  
  // Ensure rate limiting
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - elapsed));
  }
  
  try {
    // Add API key and chain to parameters
    const requestParams = {
      ...params,
      chain: chain
    };
    
    // Make API request
    const response = await axios.get(`https://deep-index.moralis.io/api/v2/${endpoint}`, {
      params: requestParams,
      headers: {
        'Accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Cache the result
    responseCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  } catch (error: any) {
    console.error(`Moralis API error (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get NFTs by contract address
 */
export async function getNFTsByContract(
  contractAddress: string,
  chainId: string,
  cursor?: string,
  limit: number = 20
): Promise<any> {
  try {
    const response = await moralisRequest(
      `nft/${contractAddress}`,
      { 
        limit, 
        cursor,
        normalizeMetadata: true,
        media_items: true
      },
      chainId
    );
    return response;
  } catch (error) {
    console.error('Error fetching NFTs by contract:', error);
    throw error;
  }
}

/**
 * Get NFT metadata for a specific token
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string,
  chainId: string
): Promise<any> {
  try {
    const response = await moralisRequest(
      `nft/${contractAddress}/${tokenId}`,
      { normalizeMetadata: true, media_items: true },
      chainId
    );
    return response;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}

/**
 * Get contract metadata
 */
export async function getContractMetadata(
  contractAddress: string,
  chainId: string
): Promise<any> {
  try {
    const response = await moralisRequest(
      `nft/${contractAddress}/metadata`,
      {},
      chainId
    );
    return response;
  } catch (error) {
    console.error('Error fetching contract metadata:', error);
    throw error;
  }
}

/**
 * Get NFTs owned by a wallet address
 */
export async function getNFTsByWallet(
  walletAddress: string,
  chainId: string,
  cursor?: string,
  limit: number = 20
): Promise<any> {
  try {
    const response = await moralisRequest(
      `${walletAddress}/nft`,
      { 
        limit, 
        cursor,
        normalizeMetadata: true,
        media_items: true 
      },
      chainId
    );
    return response;
  } catch (error) {
    console.error('Error fetching NFTs by wallet:', error);
    throw error;
  }
}

/**
 * Transform Moralis NFT data to match our CollectionNFT format
 */
export function transformMoralisNFT(nft: any, chainId: string): any {
  // Extract image URL from metadata
  let imageUrl = '';
  
  // Handle different media formats - Moralis has inconsistent response structures
  if (nft.media) {
    if (Array.isArray(nft.media)) {
      // If media is an array, find the first image item
      const mediaItem = nft.media.find((m: any) => 
        m.media_collection && ['image', 'image_large', 'image_thumbnail'].includes(m.media_collection)
      );
      if (mediaItem && mediaItem.media_url) {
        imageUrl = mediaItem.media_url;
      }
    } else if (typeof nft.media === 'object' && nft.media !== null) {
      // If media is an object (BNB Chain specific format)
      if (nft.media.original_media_url) {
        imageUrl = nft.media.original_media_url;
      } else if (nft.media.media_url) {
        imageUrl = nft.media.media_url;
      }
    }
  }
  
  // Fallback to normalized metadata image
  if (!imageUrl && nft.normalized_metadata && nft.normalized_metadata.image) {
    imageUrl = nft.normalized_metadata.image;
    
    // Handle IPFS URLs
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
  }
  
  // Additional fallback for the raw metadata
  if (!imageUrl && nft.metadata) {
    try {
      // Sometimes metadata is a string that needs parsing
      const parsedMetadata = typeof nft.metadata === 'string' 
        ? JSON.parse(nft.metadata) 
        : nft.metadata;
      
      if (parsedMetadata.image) {
        imageUrl = parsedMetadata.image;
        if (imageUrl.startsWith('ipfs://')) {
          imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
        }
      }
    } catch (e) {
      console.warn('Error parsing NFT metadata:', e);
    }
  }
  
  // Get attributes safely - checking all possible paths
  let attributes = [];
  if (nft.normalized_metadata && Array.isArray(nft.normalized_metadata.attributes)) {
    attributes = nft.normalized_metadata.attributes;
  } else if (nft.metadata) {
    try {
      const parsedMetadata = typeof nft.metadata === 'string' 
        ? JSON.parse(nft.metadata) 
        : nft.metadata;
      
      if (Array.isArray(parsedMetadata.attributes)) {
        attributes = parsedMetadata.attributes;
      }
    } catch (e) {
      // Ignore parsing errors for attributes
    }
  }
  
  return {
    id: `${nft.token_address.toLowerCase()}-${nft.token_id}`,
    tokenId: nft.token_id,
    name: nft.normalized_metadata?.name || `NFT #${nft.token_id}`,
    description: nft.normalized_metadata?.description || '',
    imageUrl: imageUrl,
    attributes: attributes,
    chain: chainId
  };
}

const BASE_URL = 'https://deep-index.moralis.io/api/v2';

interface MoralisChain {
  chainId: string;
  apiName: string;
  name: string;
  currency: string;
  icon?: string;
}

export const SUPPORTED_CHAINS: MoralisChain[] = [
  { chainId: '0x1', apiName: 'eth', name: 'Ethereum', currency: 'ETH', icon: '/icons/eth.svg' },
  { chainId: '0x38', apiName: 'bsc', name: 'BNB Smart Chain', currency: 'BNB', icon: '/icons/bnb.svg' },
  { chainId: '0x89', apiName: 'polygon', name: 'Polygon', currency: 'MATIC', icon: '/icons/matic.svg' },
  { chainId: '0xa86a', apiName: 'avalanche', name: 'Avalanche', currency: 'AVAX', icon: '/icons/avax.svg' },
  { chainId: '0xfa', apiName: 'fantom', name: 'Fantom', currency: 'FTM', icon: '/icons/ftm.svg' },
  { chainId: '0xa4b1', apiName: 'arbitrum', name: 'Arbitrum', currency: 'ARB', icon: '/icons/arb.svg' },
  { chainId: '0xa', apiName: 'optimism', name: 'Optimism', currency: 'OP', icon: '/icons/op.svg' },
  { chainId: '0x2105', apiName: 'base', name: 'Base', currency: 'ETH', icon: '/icons/base.svg' },
  { chainId: '0x14a33', apiName: 'base-goerli', name: 'Base Goerli', currency: 'ETH' },
  { chainId: '0x144', apiName: 'cronos', name: 'Cronos', currency: 'CRO', icon: '/icons/cro.svg' },
  { chainId: '0x64', apiName: 'gnosis', name: 'Gnosis', currency: 'XDAI', icon: '/icons/xdai.svg' },
];

export interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  usdPrice?: number;
  usdValue?: number;
  chain: string;
  chainName: string;
  chainIcon?: string;
}

export interface NativeBalance {
  balance: string;
  decimals: 18;
  name: string;
  symbol: string;
  usdPrice?: number;
  usdValue?: number;
  chain: string;
  chainName: string;
  chainIcon?: string;
}

interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  thumbnail?: string;
  usdPrice?: number;
}

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': MORALIS_API_KEY || '',
    'Accept': 'application/json'
  }
});

// Add request/response interceptors for better debugging
instance.interceptors.request.use(request => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Moralis API Request:', request.url, request.params);
  }
  return request;
});

instance.interceptors.response.use(
  response => response,
  error => {
    console.error('Moralis API Error:', 
      error.response?.data || error.message,
      'URL:', error.config?.url,
      'Status:', error.response?.status
    );
    return Promise.reject(error);
  }
);

export const getTokenBalances = async (address: string, chain: MoralisChain): Promise<TokenBalance[]> => {
  try {
    const response = await instance.get(`/${address}/erc20`, {
      params: {
        chain: chain.apiName
      }
    });

    const tokens = response.data;
    
    // Fetch token prices if tokens exist
    let tokenPrices: Record<string, number> = {};
    if (tokens.length > 0) {
      const tokenAddresses = tokens.map((token: any) => token.token_address);
      const priceResponse = await instance.get(`/erc20/prices`, {
        params: {
          chain: chain.apiName,
          include: 'percent_change',
          address: tokenAddresses.join(',')
        }
      });
      tokenPrices = priceResponse.data?.tokenPrices?.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.address.toLowerCase()] = curr.usdPrice;
        return acc;
      }, {}) || {};
    }

    return tokens.map((token: any) => {
      const usdPrice = tokenPrices[token.token_address.toLowerCase()] || 0;
      const balance = token.balance / Math.pow(10, token.decimals);
      const usdValue = balance * usdPrice;
      
      return {
        ...token,
        balance: balance.toString(),
        usdPrice,
        usdValue,
        chain: chain.apiName,
        chainName: chain.name,
        chainIcon: chain.icon
      };
    });
  } catch (error) {
    console.error(`Error fetching token balances for ${chain.name}:`, error);
    // Check if this is a rate limit or invalid API key issue
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error("Moralis API key is missing or invalid");
      } else if (error.response.status === 429) {
        console.error("Moralis API rate limit exceeded");
      }
    }
    return [];
  }
};

export const getNativeBalance = async (address: string, chain: MoralisChain): Promise<NativeBalance | null> => {
  try {
    const response = await instance.get(`/${address}/balance`, {
      params: {
        chain: chain.apiName
      }
    });

    // Get price of native token
    const priceResponse = await instance.get(`/erc20/${chain.currency}/price`, {
      params: {
        chain: chain.apiName
      }
    });

    const balance = parseInt(response.data.balance) / 1e18;
    const usdPrice = priceResponse.data?.usdPrice || 0;
    
    return {
      balance: balance.toString(),
      decimals: 18,
      name: chain.currency,
      symbol: chain.currency,
      usdPrice,
      usdValue: balance * usdPrice,
      chain: chain.apiName,
      chainName: chain.name,
      chainIcon: chain.icon
    };
  } catch (error) {
    console.error(`Error fetching native balance for ${chain.name}:`, error);
    return null;
  }
};

export const getWalletTokens = async (address: string, chains: MoralisChain[] = SUPPORTED_CHAINS): Promise<(TokenBalance | NativeBalance)[]> => {
  try {
    // Process chains in parallel for better performance
    const promises = chains.flatMap(chain => [
      getNativeBalance(address, chain),
      getTokenBalances(address, chain)
    ]);

    const results = await Promise.allSettled(promises);
    
    let allTokens: (TokenBalance | NativeBalance)[] = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        if (Array.isArray(result.value)) {
          allTokens = [...allTokens, ...result.value];
        } else if (result.value) {
          allTokens.push(result.value);
        }
      }
    });
    
    // Sort by USD value (highest first)
    return allTokens.sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    return [];
  }
};
