import { ethers } from 'ethers';

export interface ChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  symbol: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export interface ChainTheme {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  textClass: string;
  backgroundClass: string;
  borderClass: string;
}

export const chainConfigs: Record<string, ChainConfig> = {
  // Ethereum Mainnet
  '0x1': {
    id: '0x1',
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    symbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false,
  },
  // Sepolia Testnet
  '0xaa36a7': {
    id: '0xaa36a7',
    name: 'Sepolia',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    symbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: true,
  },
  // BNB Chain Mainnet
  '0x38': {
    id: '0x38',
    name: 'BNB Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    blockExplorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    testnet: false,
  },
  // BNB Chain Testnet
  '0x61': {
    id: '0x61',
    name: 'BNB Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    symbol: 'tBNB',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: {
      name: 'Test BNB',
      symbol: 'tBNB',
      decimals: 18
    },
    testnet: true,
  },
};

/**
 * Get a provider for a specific chain
 * @param chainId The chain ID to get a provider for
 * @returns Ethers provider for the specified chain
 */
export const getChainProvider = (chainId: string) => {
  const config = chainConfigs[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return new ethers.providers.JsonRpcProvider(config.rpcUrl);
};

/**
 * Get the block explorer URL for a specific chain and address/transaction/etc
 * @param chainId The chain ID to get the explorer URL for
 * @param path The path to add to the URL (e.g., address, tx)
 * @param type The type of path (address, tx, token, block)
 * @returns The full explorer URL
 */
export function getExplorerUrl(chainId: string, path: string = '', type: 'address' | 'tx' | 'token' | 'block' = 'address'): string {
  const config = chainConfigs[chainId];
  if (!config) {
    // Default to Ethereum mainnet if chain not found
    return `https://etherscan.io/${type}/${path}`;
  }
  
  return `${config.blockExplorerUrl}/${type}/${path}`;
}

/**
 * Format an address for display (shortening it)
 * @param address The address to format
 * @returns Formatted address string
 */
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Get theme colors and classes for a specific chain
 * @param chainId The chain ID to get colors for
 * @returns Object with color values and utility classes
 */
export const getChainColorTheme = (chainId: string): ChainTheme => {
  switch (chainId) {
    case '0x1':
    case '0xaa36a7':
      return {
        primary: '#6b8df7',
        secondary: '#3b5ff7',
        accent: 'blue',
        light: '#d0d8ff',
        backgroundClass: 'bg-blue-500/20',
        borderClass: 'border-blue-500/50',
        textClass: 'text-blue-400'
      };
    case '0x38':
    case '0x61':
      return {
        primary: '#F0B90B',
        secondary: '#E6A50A',
        accent: 'yellow',
        light: '#FFF4D0',
        backgroundClass: 'bg-yellow-500/20',
        borderClass: 'border-yellow-500/50',
        textClass: 'text-yellow-500'
      };
    default:
      return {
        primary: '#6b8df7',
        secondary: '#3b5ff7',
        accent: 'blue',
        light: '#d0d8ff',
        backgroundClass: 'bg-blue-500/20',
        borderClass: 'border-blue-500/50',
        textClass: 'text-blue-400'
      };
  }
};

/**
 * Get the name of a network from its chain ID
 * @param chainId The chain ID
 * @returns Human-readable network name
 */
export const getNetworkName = (chainId: string): string => {
  const config = chainConfigs[chainId];
  return config?.name || 'Unknown Network';
};

/**
 * Check if a chain is a testnet
 * @param chainId The chain ID to check
 * @returns Boolean indicating if it's a testnet
 */
export const isTestnet = (chainId: string): boolean => {
  const config = chainConfigs[chainId];
  return config?.testnet || false;
};

/**
 * Get the native currency symbol for a chain
 * @param chainId The chain ID
 * @returns The currency symbol (e.g., ETH, BNB)
 */
export const getCurrencySymbol = (chainId: string): string => {
  const config = chainConfigs[chainId];
  return config?.nativeCurrency.symbol || 'ETH';
};

/**
 * Format a currency amount with proper symbol
 * @param amount The amount to format
 * @param chainId The chain ID for currency symbol
 * @param decimals Number of decimal places to show
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, chainId: string, decimals: number = 4): string => {
  const symbol = getCurrencySymbol(chainId);
  return `${amount.toFixed(decimals)} ${symbol}`;
};
