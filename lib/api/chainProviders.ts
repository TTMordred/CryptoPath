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
  const explorers: Record<string, string> = {
    '0x1': 'https://etherscan.io',
    '0x38': 'https://bscscan.com',
    '0x61': 'https://testnet.bscscan.com'
  };
  return `${explorers[chainId] || 'https://etherscan.io'}/${type}/${path}`;
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
  // Default theme (Ethereum)
  let theme = {
    primary: '#6b8df7',
    secondary: '#3b5cf5',
    accent: '#4b6ef5',    // Added missing property
    light: '#d4ddff',     // Added missing property
    backgroundClass: 'bg-blue-900/20',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
    buttonClass: 'bg-blue-600 hover:bg-blue-700'
  };
  
  // BNB Chain theme
  if (chainId === '0x38' || chainId === '0x61') {
    theme = {
      primary: '#F0B90B',
      secondary: '#F8D12F',
      accent: '#EDAA00',    // Added missing property
      light: '#FFF3D3',     // Added missing property
      backgroundClass: 'bg-yellow-900/20',
      borderClass: 'border-yellow-500/30',
      textClass: 'text-yellow-400',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700'
    };
  }
  
  return theme;
};

/**
 * Get the name of a network from its chain ID
 * @param chainId The chain ID
 * @returns Human-readable network name
 */
export const getNetworkName = (chainId: string): string => {
  const networks: Record<string, string> = {
    '0x1': 'Ethereum',
    '0x38': 'BNB Chain',
    '0x61': 'BNB Testnet'
  };
  return networks[chainId] || 'Unknown Network';
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

/**
 * Convert hex chain ID to decimal
 * @param hexChainId The chain ID in hex format (e.g., '0x1')
 * @returns The chain ID in decimal format (e.g., 1)
 */
export const chainIdToDecimal = (hexChainId: string): number => {
  return parseInt(hexChainId, 16);
};

/**
 * Convert decimal chain ID to hex format
 * @param decimalChainId The chain ID in decimal format (e.g., 1)
 * @returns The chain ID in hex format (e.g., '0x1')
 */
export const decimalToChainId = (decimalChainId: number): string => {
  return `0x${decimalChainId.toString(16)}`;
};

/**
 * Get configuration for all supported networks
 * @returns Array of chain configurations
 */
export const getSupportedNetworks = (): ChainConfig[] => {
  return Object.values(chainConfigs);
};

/**
 * Check if a chain is supported
 * @param chainId The chain ID to check
 * @returns Boolean indicating if the chain is supported
 */
export const isChainSupported = (chainId: string): boolean => {
  return !!chainConfigs[chainId];
};
