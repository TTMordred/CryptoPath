import { Transaction, TransactionType } from "./types";
import { METHOD_SIGNATURES, KNOWN_ADDRESSES } from "./constants";

// Format addresses for display
export function shortenAddress(address: string): string {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format known addresses with friendly names
export function formatAddress(address: string, isUserAddress = false): { formatted: string, name: string | null } {
  if (!address) return { formatted: 'N/A', name: null };
  
  const lowerAddress = address.toLowerCase();
  
  if (isUserAddress) {
    return { 
      formatted: `${address.slice(0, 6)}...${address.slice(-4)}`, 
      name: 'You'
    };
  }
  
  if (KNOWN_ADDRESSES[lowerAddress]) {
    return {
      formatted: `${address.slice(0, 6)}...${address.slice(-4)}`,
      name: KNOWN_ADDRESSES[lowerAddress]
    };
  }
  
  return {
    formatted: `${address.slice(0, 6)}...${address.slice(-4)}`,
    name: null
  };
}

// Enhanced transaction type categorization
export function categorizeTransaction(tx: Transaction, userAddress: string): TransactionType {
  if (!tx.from || !tx.to) return "unknown";
  
  const userAddressLower = userAddress.toLowerCase();
  const fromLower = typeof tx.from === 'string' ? tx.from.toLowerCase() : '';
  const toLower = typeof tx.to === 'string' ? tx.to.toLowerCase() : '';
  
  // Check if this is a contract deployment
  if (tx.to === '' || tx.to === '0x' || tx.to === '0x0000000000000000000000000000000000000000') {
    return "contract_deploy";
  }
  
  // Check for known method signatures in input data
  if (tx.input && tx.input !== '0x' && tx.input.length >= 10) {
    const methodId = tx.input.slice(0, 10).toLowerCase();
    if (METHOD_SIGNATURES[methodId]) {
      return METHOD_SIGNATURES[methodId].type;
    }
  }
  
  // Check for NFT transfers (typically has ERC721 transfer events)
  if (tx.tokenTransfers?.some(t => t.tokenSymbol?.includes('NFT') || t.value === '1')) {
    return "nft_transfer";
  }
  
  // Fallback to basic direction categorization
  if (fromLower === userAddressLower && toLower === userAddressLower) return "swap";
  if (fromLower === userAddressLower) return "outflow";
  if (toLower === userAddressLower) return "inflow";
  
  return "transfer";
}

// Get transaction method name from input data
export function getTransactionMethod(tx: Transaction): { id: string, name: string } {
  if (!tx.input || tx.input === '0x' || tx.input.length < 10) {
    return { id: '', name: 'Transfer' }; // Simple ETH transfer
  }
  
  const methodId = tx.input.slice(0, 10).toLowerCase();
  
  if (METHOD_SIGNATURES[methodId]) {
    return { id: methodId, name: METHOD_SIGNATURES[methodId].name };
  }
  
  return { id: methodId, name: 'Unknown Method' };
}

// Get block explorer URL based on network
export function getBlockExplorerUrl(txHash: string, network: string): string {
  const baseUrl = network === 'mainnet' ? 'https://etherscan.io/tx/' : 
               network === 'optimism' ? 'https://optimistic.etherscan.io/tx/' :
               network === 'arbitrum' ? 'https://arbiscan.io/tx/' :
               'https://etherscan.io/tx/';

  return `${baseUrl}${txHash}`;
}
