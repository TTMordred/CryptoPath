import axios from 'axios';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
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
