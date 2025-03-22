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

// Get provider for a specific chain
export const getChainProvider = (chainId: string) => {
  const config = chainConfigs[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return new ethers.providers.JsonRpcProvider(config.rpcUrl);
};

// Get block explorer URL for a specific chain and address
export const getExplorerUrl = (chainId: string, address: string) => {
  const config = chainConfigs[chainId];
  if (!config) return `https://etherscan.io/address/${address}`;
  return `${config.blockExplorerUrl}/address/${address}`;
};

// Format address for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Get chain color theme
export const getChainColorTheme = (chainId: string) => {
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
