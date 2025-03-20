
import axios from 'axios';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

interface AlchemyChain {
  name: string;
  chainId: string;
  network: string;
  baseUrl: string;
  currency: string;
  icon?: string;
}

export const SUPPORTED_CHAINS: AlchemyChain[] = [
  { 
    name: 'Ethereum', 
    chainId: '1', 
    network: 'eth-mainnet', 
    baseUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    currency: 'ETH',
    icon: '/icons/eth.svg'
  },
  { 
    name: 'Polygon', 
    chainId: '137', 
    network: 'polygon-mainnet', 
    baseUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    currency: 'MATIC',
    icon: '/icons/matic.svg'
  },
  { 
    name: 'Arbitrum', 
    chainId: '42161', 
    network: 'arb-mainnet', 
    baseUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    currency: 'ARB',
    icon: '/icons/arb.svg'
  },
  { 
    name: 'Optimism', 
    chainId: '10', 
    network: 'opt-mainnet', 
    baseUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    currency: 'OP',
    icon: '/icons/op.svg'
  },
  { 
    name: 'Base', 
    chainId: '8453', 
    network: 'base-mainnet', 
    baseUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    currency: 'ETH',
    icon: '/icons/base.svg'
  }
];

export interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  logo?: string;
  usdPrice?: number;
  usdValue?: number;
  balanceFormatted?: string;
  chain: string;
  chainName: string;
  chainIcon?: string;
}

const getTokenBalances = async (address: string, chain: AlchemyChain): Promise<TokenBalance[]> => {
  try {
    const response = await axios.post(chain.baseUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenBalances',
      params: [address]
    });

    const tokenBalances = response.data.result.tokenBalances || [];
    
    if (tokenBalances.length === 0) {
      return [];
    }

    // Get token metadata
    const metadataPromises = tokenBalances.map(async (token: any) => {
      try {
        const metadataResponse = await axios.post(chain.baseUrl, {
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [token.contractAddress]
        });

        return metadataResponse.data.result;
      } catch (error) {
        console.error(`Error fetching token metadata for ${token.contractAddress}:`, error);
        return {
          name: 'Unknown Token',
          symbol: 'UNKNOWN',
          decimals: 18,
          logo: null
        };
      }
    });

    const metadataResults = await Promise.allSettled(metadataPromises);
    
    return tokenBalances.map((token: any, index: number) => {
      const metadata = metadataResults[index].status === 'fulfilled' 
        ? (metadataResults[index] as PromiseFulfilledResult<any>).value 
        : { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
      
      const decimals = metadata.decimals || 18;
      const balanceFormatted = (parseInt(token.tokenBalance, 16) / Math.pow(10, decimals)).toString();
      
      return {
        contractAddress: token.contractAddress,
        tokenBalance: token.tokenBalance,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        logo: metadata.logo,
        balanceFormatted,
        chain: chain.network,
        chainName: chain.name,
        chainIcon: chain.icon
      };
    });
  } catch (error) {
    console.error(`Error fetching token balances from Alchemy for ${chain.name}:`, error);
    return [];
  }
};

export const getNativeBalance = async (address: string, chain: AlchemyChain): Promise<TokenBalance | null> => {
  try {
    const response = await axios.post(chain.baseUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    const balance = response.data.result;
    const balanceFormatted = (parseInt(balance, 16) / 1e18).toString();

    return {
      contractAddress: 'native',
      tokenBalance: balance,
      name: chain.currency,
      symbol: chain.currency,
      decimals: 18,
      balanceFormatted,
      chain: chain.network,
      chainName: chain.name,
      chainIcon: chain.icon
    };
  } catch (error) {
    console.error(`Error fetching native balance from Alchemy for ${chain.name}:`, error);
    return null;
  }
};

export const getWalletTokens = async (address: string, chains: AlchemyChain[] = SUPPORTED_CHAINS): Promise<TokenBalance[]> => {
  try {
    // Process chains in parallel for better performance
    const promises = chains.flatMap(chain => [
      getNativeBalance(address, chain),
      getTokenBalances(address, chain)
    ]);

    const results = await Promise.allSettled(promises);
    
    let allTokens: TokenBalance[] = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        if (Array.isArray(result.value)) {
          allTokens = [...allTokens, ...result.value];
        } else if (result.value) {
          allTokens.push(result.value);
        }
      }
    });
    
    return allTokens;
  } catch (error) {
    console.error('Error fetching wallet tokens from Alchemy:', error);
    return [];
  }
};

// Get token prices for ERC20 tokens using external price API
export const enrichTokensWithPrices = async (tokens: TokenBalance[]): Promise<TokenBalance[]> => {
  try {
    // Group tokens by chain
    const tokensByChain: Record<string, string[]> = {};
    
    tokens.forEach(token => {
      if (token.contractAddress === 'native') return; // Skip native tokens (we'll handle them separately)
      
      if (!tokensByChain[token.chain]) {
        tokensByChain[token.chain] = [];
      }
      
      tokensByChain[token.chain].push(token.contractAddress);
    });
    
    // Get prices for tokens
    const pricePromises = Object.entries(tokensByChain).map(async ([chain, addresses]) => {
      try {
        // Use CoinGecko or similar API to get prices
        // This is a placeholder - you would need to implement an actual price API call
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/token_price', {
          params: {
            contract_addresses: addresses.join(','),
            vs_currencies: 'usd',
            include_market_cap: 'true',
            include_24hr_vol: 'true',
            include_24hr_change: 'true',
            include_last_updated_at: 'true',
          }
        });
        
        return {
          chain,
          prices: response.data
        };
      } catch (error) {
        console.error(`Error fetching prices for chain ${chain}:`, error);
        return {
          chain,
          prices: {}
        };
      }
    });
    
    const priceResults = await Promise.allSettled(pricePromises);
    
    // Create a map of token prices
    const priceMap: Record<string, Record<string, { usd: number }>> = {};
    
    priceResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const { chain, prices } = result.value;
        priceMap[chain] = prices;
      }
    });
    
    // Enrich tokens with prices
    return tokens.map(token => {
      if (token.contractAddress === 'native') {
        // Handle native token pricing separately (ETH, MATIC, etc.)
        // This would be another API call to get the current price
        return {
          ...token,
          usdPrice: 0, // Placeholder
          usdValue: 0 // Placeholder
        };
      }
      
      const price = priceMap[token.chain]?.[token.contractAddress.toLowerCase()]?.usd || 0;
      const balance = parseFloat(token.balanceFormatted || '0');
      
      return {
        ...token,
        usdPrice: price,
        usdValue: balance * price
      };
    });
  } catch (error) {
    console.error('Error enriching tokens with prices:', error);
    return tokens;
  }
};

// Price API for native tokens
export const getNativePrices = async (): Promise<Record<string, number>> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'ethereum,polygon,arbitrum,optimism,base',
        vs_currencies: 'usd'
      }
    });
    
    return {
      'eth-mainnet': response.data.ethereum?.usd || 0,
      'polygon-mainnet': response.data.polygon?.usd || 0,
      'arb-mainnet': response.data.arbitrum?.usd || 0,
      'opt-mainnet': response.data.optimism?.usd || 0,
      'base-mainnet': response.data.base?.usd || 0
    };
  } catch (error) {
    console.error('Error fetching native token prices:', error);
    return {};
  }
};
