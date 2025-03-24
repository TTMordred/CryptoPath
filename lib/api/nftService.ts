import { toast } from "sonner";
import axios from 'axios';
import { ethers } from 'ethers';
import {
  fetchContractCollectionInfo,
  fetchNFTData,
  fetchContractNFTs,
  NFTMetadata,
  POPULAR_NFT_COLLECTIONS
} from './nftContracts';
import {
  CollectionNFT,
  CollectionNFTsResponse,
  fetchCollectionInfo as _alchemyFetchCollectionInfo,
  fetchCollectionNFTs as alchemyFetchCollectionNFTs
} from './alchemyNFTApi';
import { getChainProvider, getExplorerUrl, chainConfigs } from './chainProviders';

// Environment variables for API keys
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';
const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY || '';
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
const BSCSCAN_API_KEY = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || '';

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20;

// Cache for collection data to reduce API calls
const collectionsCache = new Map<string, any>();
const nftCache = new Map<string, {
  data: CollectionNFT[];
  totalCount: number;
  timestamp: number;
  expires: number;
}>();
const collectionNFTsCache = new Map<string, {timestamp: number, nfts: CollectionNFT[]}>();

// Cache TTL in milliseconds (10 minutes)
const COLLECTION_CACHE_TTL = 10 * 60 * 1000;

/**
 * Chain ID to network mapping for API endpoints
 */
const CHAIN_ID_TO_NETWORK: Record<string, string> = {
  '0x1': 'eth-mainnet',
  '0x5': 'eth-goerli',
  '0xaa36a7': 'eth-sepolia',
  '0x89': 'polygon-mainnet',
  '0x13881': 'polygon-mumbai',
  '0xa': 'optimism-mainnet',
  '0xa4b1': 'arbitrum-mainnet',
  '0x38': 'bsc-mainnet',
  '0x61': 'bsc-testnet',
};

/**
 * Enhanced collection metadata
 */
export interface CollectionMetadata {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  bannerImageUrl?: string;
  totalSupply: string;
  floorPrice?: string;
  volume24h?: string;
  chain: string;
  contractAddress: string;
  verified?: boolean;
  category?: string;
  featured?: boolean;
  standard?: string;
  creatorAddress?: string;
  owners?: number;
  website?: string;
  discord?: string;
  twitter?: string;
}

/**
 * API availability tracking to manage fallbacks
 */
interface ApiStatus {
  alchemy: boolean;
  moralis: boolean;
  etherscan: boolean;
  bscscan: boolean;
  lastChecked: number;
}

// Track API health to manage fallbacks
const apiStatus: ApiStatus = {
  alchemy: true,
  moralis: true,
  etherscan: true,
  bscscan: true,
  lastChecked: 0
};

/**
 * Check if a chain is BNB/BSC-based
 */
function isBNBChain(chainId: string): boolean {
  return chainId === '0x38' || chainId === '0x61';
}

/**
 * Check if a chain is Ethereum-based
 */
function isEthereumChain(chainId: string): boolean {
  return chainId === '0x1' || chainId === '0xaa36a7' || chainId === '0x5';
}

/**
 * Fetch NFT collection information with caching
 */
export async function fetchCollectionInfo(contractAddress: string, chainId: string): Promise<CollectionMetadata> {
  // Create a cache key
  const cacheKey = `${chainId}-${contractAddress.toLowerCase()}`;
  
  // Check cache first
  if (collectionsCache.has(cacheKey)) {
    return collectionsCache.get(cacheKey);
  }
  
  try {
    // Try to fetch from blockchain first
    const contractInfo = await fetchContractCollectionInfo(contractAddress, chainId);
    
    let metadata: Partial<CollectionMetadata> = {
      id: contractAddress.toLowerCase(),
      name: contractInfo.name || 'Unknown Collection',
      symbol: contractInfo.symbol || '',
      description: '',
      imageUrl: '/fallback-collection-logo.png',
      totalSupply: contractInfo.totalSupply || '0',
      chain: chainId,
      contractAddress: contractAddress.toLowerCase(),
      standard: contractInfo.standard || 'ERC721',
    };
    
    // Set API fallback order based on chain
    if (isBNBChain(chainId)) {
      // BNB Chain: Try Moralis -> BSCScan -> Contract fallback
      if (apiStatus.moralis) {
        try {
          const moralisData = await fetchCollectionInfoFromMoralis(contractAddress, chainId);
          metadata = { ...metadata, ...moralisData };
        } catch (error) {
          console.warn("Moralis metadata fetch failed:", error);
          apiStatus.moralis = false;
          apiStatus.lastChecked = Date.now();
        }
      }
      
      if (apiStatus.bscscan && (!metadata.description || !metadata.imageUrl)) {
        try {
          const bscscanData = await fetchCollectionInfoFromBSCScan(contractAddress, chainId);
          metadata = { ...metadata, ...bscscanData };
        } catch (error) {
          console.warn("BSCScan metadata fetch failed:", error);
          apiStatus.bscscan = false;
          apiStatus.lastChecked = Date.now();
        }
      }
    } else {
      // Ethereum: Try Alchemy -> Moralis -> Etherscan -> Contract fallback
      if (apiStatus.alchemy) {
        try {
          const alchemyData = await fetchCollectionInfoFromAlchemy(contractAddress, chainId);
          metadata = { ...metadata, ...alchemyData };
        } catch (error) {
          console.warn("Alchemy metadata fetch failed:", error);
          apiStatus.alchemy = false;
          apiStatus.lastChecked = Date.now();
        }
      }
      
      if (apiStatus.moralis && (!metadata.description || !metadata.imageUrl)) {
        try {
          const moralisData = await fetchCollectionInfoFromMoralis(contractAddress, chainId);
          metadata = { ...metadata, ...moralisData };
        } catch (error) {
          console.warn("Moralis metadata fetch failed:", error);
          apiStatus.moralis = false;
          apiStatus.lastChecked = Date.now();
        }
      }
      
      if (apiStatus.etherscan && (!metadata.description || !metadata.imageUrl)) {
        try {
          const etherscanData = await fetchCollectionInfoFromEtherscan(contractAddress, chainId);
          metadata = { ...metadata, ...etherscanData };
        } catch (error) {
          console.warn("Etherscan metadata fetch failed:", error);
          apiStatus.etherscan = false;
          apiStatus.lastChecked = Date.now();
        }
      }
    }
    
    // Try marketplace data lookup for floor price, etc.
    const marketData = await fetchMarketplaceData(contractAddress, chainId);
    metadata.floorPrice = marketData?.floorPrice || '0';
    metadata.volume24h = marketData?.volume24h || '0';
    
    // Every 5 minutes, reset API status to retry failed providers
    if (Date.now() - apiStatus.lastChecked > 5 * 60 * 1000) {
      apiStatus.alchemy = true;
      apiStatus.moralis = true;
      apiStatus.etherscan = true;
      apiStatus.bscscan = true;
      apiStatus.lastChecked = Date.now();
    }
    
    // Save to cache
    const fullMetadata = metadata as CollectionMetadata;
    collectionsCache.set(cacheKey, fullMetadata);
    
    return fullMetadata;
  } catch (error) {
    console.error('Error fetching collection information:', error);
    toast.error("Failed to load collection info");
    
    // Return a minimal fallback
    return {
      id: contractAddress.toLowerCase(),
      name: 'Unknown Collection',
      symbol: '',
      description: '',
      imageUrl: '/fallback-collection-logo.png',
      totalSupply: '0',
      chain: chainId,
      contractAddress: contractAddress.toLowerCase(),
      standard: 'ERC721'
    };
  }
}

/**
 * Fetch collection info from Alchemy
 */
async function fetchCollectionInfoFromAlchemy(contractAddress: string, chainId: string): Promise<Partial<CollectionMetadata>> {
  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getContractMetadata`;
  const url = new URL(apiUrl);
  url.searchParams.append('contractAddress', contractAddress);
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    description: data?.contractMetadata?.openSea?.description || '',
    imageUrl: data?.contractMetadata?.openSea?.imageUrl || '',
    bannerImageUrl: data?.contractMetadata?.openSea?.bannerImageUrl || '',
    verified: data?.contractMetadata?.openSea?.safelistRequestStatus === 'verified',
    category: data?.contractMetadata?.openSea?.category || 'Art',
    creatorAddress: data?.contractMetadata?.openSea?.creator || '',
    website: data?.contractMetadata?.openSea?.externalUrl || '',
    discord: data?.contractMetadata?.openSea?.discordUrl || '',
    twitter: data?.contractMetadata?.openSea?.twitterUsername 
      ? `https://twitter.com/${data.contractMetadata.openSea.twitterUsername}` 
      : ''
  };
}

/**
 * Fetch collection info from Moralis
 */
async function fetchCollectionInfoFromMoralis(contractAddress: string, chainId: string): Promise<Partial<CollectionMetadata>> {
  if (!MORALIS_API_KEY) {
    throw new Error('Moralis API key not available');
  }
  
  // Convert chainId to Moralis format
  const moralisChain = isBNBChain(chainId) 
    ? (chainId === '0x38' ? 'bsc' : 'bsc testnet')
    : (chainId === '0x1' ? 'eth' : chainId === '0xaa36a7' ? 'sepolia' : 'goerli');
  
  const options = {
    method: 'GET',
    url: `https://deep-index.moralis.io/api/v2/nft/${contractAddress}/metadata`,
    params: {chain: moralisChain},
    headers: {
      accept: 'application/json',
      'X-API-Key': MORALIS_API_KEY
    }
  };
  
  const response = await axios.request(options);
  
  if (response.status !== 200) {
    throw new Error(`Moralis API error: ${response.status}`);
  }
  
  const data = response.data;
  
  return {
    name: data?.name || '',
    symbol: data?.symbol || '',
    totalSupply: data?.synced_at ? data.total_supply?.toString() || '0' : '0',
    description: data?.description || '',
    imageUrl: data?.token_uri_metadata?.image || data?.metadata?.image || '',
    category: data?.token_uri_metadata?.category || 'Art'
  };
}

/**
 * Fetch collection info from Etherscan
 */
async function fetchCollectionInfoFromEtherscan(contractAddress: string, chainId: string): Promise<Partial<CollectionMetadata>> {
  if (!ETHERSCAN_API_KEY) {
    throw new Error('Etherscan API key not available');
  }
  
  // Only applicable for Ethereum chains
  if (!isEthereumChain(chainId)) {
    throw new Error('Etherscan only supports Ethereum chains');
  }
  
  // Get appropriate Etherscan domain
  let domain = 'api.etherscan.io';
  if (chainId === '0xaa36a7') {
    domain = 'api-sepolia.etherscan.io';
  } else if (chainId === '0x5') {
    domain = 'api-goerli.etherscan.io';
  }
  
  // Fetch contract ABI to check if it's verified
  const abiUrl = `https://${domain}/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
  const abiResponse = await fetch(abiUrl);
  if (!abiResponse.ok) {
    throw new Error(`Etherscan API error: ${abiResponse.status}`);
  }
  
  const abiData = await abiResponse.json();
  const isVerified = abiData.status === '1' && abiData.message === 'OK';
  
  // Get contract source code which may contain metadata
  const sourceUrl = `https://${domain}/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
  const sourceResponse = await fetch(sourceUrl);
  if (!sourceResponse.ok) {
    throw new Error(`Etherscan API error: ${sourceResponse.status}`);
  }
  
  const sourceData = await sourceResponse.json();
  
  const result: Partial<CollectionMetadata> = { verified: isVerified };
  
  if (sourceData.status === '1' && sourceData.result && sourceData.result.length > 0) {
    const contractSource = sourceData.result[0];
    
    // Try to extract metadata from contract source
    try {
      if (contractSource.Implementation) {
        result.name = contractSource.ContractName || '';
      }
    } catch (e) {
      console.warn('Error parsing Etherscan metadata:', e);
    }
  }
  
  return result;
}

/**
 * Fetch collection info from BSCScan
 */
async function fetchCollectionInfoFromBSCScan(contractAddress: string, chainId: string): Promise<Partial<CollectionMetadata>> {
  if (!BSCSCAN_API_KEY) {
    throw new Error('BSCScan API key not available');
  }
  
  // Only applicable for BNB chains
  if (!isBNBChain(chainId)) {
    throw new Error('BSCScan only supports BNB Chain');
  }
  
  // Get appropriate BSCScan domain
  const domain = chainId === '0x38' ? 'api.bscscan.com' : 'api-testnet.bscscan.com';
  
  // Fetch contract ABI to check if it's verified
  const abiUrl = `https://${domain}/api?module=contract&action=getabi&address=${contractAddress}&apikey=${BSCSCAN_API_KEY}`;
  const abiResponse = await fetch(abiUrl);
  if (!abiResponse.ok) {
    throw new Error(`BSCScan API error: ${abiResponse.status}`);
  }
  
  const abiData = await abiResponse.json();
  const isVerified = abiData.status === '1' && abiData.message === 'OK';
  
  // Get contract source code which may contain metadata
  const sourceUrl = `https://${domain}/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${BSCSCAN_API_KEY}`;
  const sourceResponse = await fetch(sourceUrl);
  if (!sourceResponse.ok) {
    throw new Error(`BSCScan API error: ${sourceResponse.status}`);
  }
  
  const sourceData = await sourceResponse.json();
  
  const result: Partial<CollectionMetadata> = { verified: isVerified };
  
  if (sourceData.status === '1' && sourceData.result && sourceData.result.length > 0) {
    const contractSource = sourceData.result[0];
    
    // Try to extract metadata from contract source
    try {
      if (contractSource.Implementation) {
        result.name = contractSource.ContractName || '';
      }
    } catch (e) {
      console.warn('Error parsing BSCScan metadata:', e);
    }
  }
  
  return result;
}

/**
 * Fetch marketplace data (floor price, volume, etc.)
 */
async function fetchMarketplaceData(contractAddress: string, chainId: string) {
  // In a real implementation, this would query APIs like OpenSea, Blur, or LooksRare
  // For now, return mock data based on known collections
  
  // Mock data for popular collections
  const popularCollections = POPULAR_NFT_COLLECTIONS[chainId as keyof typeof POPULAR_NFT_COLLECTIONS] || [];
  const isPopular = popularCollections.some(c => 
    c.address.toLowerCase() === contractAddress.toLowerCase()
  );
  
  if (isPopular) {
    // For Ethereum collections
    if (chainId === '0x1') {
      if (contractAddress.toLowerCase() === '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d') {
        // BAYC
        return { floorPrice: '30.5', volume24h: '450.23' };
      } else if (contractAddress.toLowerCase() === '0xed5af388653567af2f388e6224dc7c4b3241c544') {
        // Azuki
        return { floorPrice: '8.75', volume24h: '175.45' };
      } else if (contractAddress.toLowerCase() === '0x60e4d786628fea6478f785a6d7e704777c86a7c6') {
        // MAYC
        return { floorPrice: '10.2', volume24h: '250.15' };
      }
    }
    
    // For BNB Chain collections
    if (chainId === '0x38') {
      if (contractAddress.toLowerCase() === '0x0a8901b0e25deb55a87524f0cc164e9644020eba') {
        // Pancake Squad
        return { floorPrice: '2.5', volume24h: '35.7' };
      }
    }
    
    // For testnet collections
    if (chainId === '0x61' && contractAddress.toLowerCase() === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551') {
      // CryptoPath Genesis
      return { floorPrice: '10.0', volume24h: '150.5' };
    }
  }
  
  // For other collections, generate some random but realistic data
  const baseFloorPrice = chainId === '0x1' ? (0.1 + Math.random() * 2) : (0.05 + Math.random());
  const baseVolume = baseFloorPrice * (10 + Math.random() * 100);
  
  return {
    floorPrice: baseFloorPrice.toFixed(3),
    volume24h: baseVolume.toFixed(2)
  };
}

/**
 * Fetch NFTs for a specific collection with pagination and filtering
 */
export async function fetchCollectionNFTs(
  contractAddress: string, 
  chainId: string,
  options: {
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc',
    searchQuery?: string,
    attributes?: Record<string, string[]>,
    pageKey?: string
  } = {}
): Promise<{
  nfts: NFTMetadata[],
  totalCount: number,
  pageKey?: string
}> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'tokenId',
    sortDirection = 'asc',
    searchQuery = '',
    attributes = {},
    pageKey
  } = options;
  
  // Check if we should use direct contract fetching for known collections
  const useDirectFetching = [
    '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551', // CryptoPath Genesis on BNB Testnet
    '0x7c09282c24c363073e0f30d74c301c312e5533ac'
  ].includes(contractAddress.toLowerCase());
  
  try {
    let nfts: NFTMetadata[] = [];
    let totalCount = 0;
    let resultPageKey: string | undefined = undefined;
    
    if (useDirectFetching) {
      // Simply proceed with direct fetching if this is a known collection
      const cacheKey = `${chainId}-${contractAddress.toLowerCase()}-nfts`;
      const cachedData = collectionNFTsCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        nfts = cachedData.nfts;
      } else {
        // Fetch directly from contract
        const startIndex = (page - 1) * pageSize;
        nfts = await fetchContractNFTs(contractAddress, chainId, startIndex, pageSize);
        
        // Save to cache
        collectionNFTsCache.set(cacheKey, {
          timestamp: Date.now(),
          nfts
        });
      }
      
      totalCount = nfts.length > 0 ? parseInt(await fetchCollectionInfo(contractAddress, chainId).then(info => info.totalSupply)) : 0;
    } else {
      // Define API strategies based on chain
      if (isBNBChain(chainId)) {
        // BNB Chain: Try Moralis first (priority), then BSCScan, finally contract fallback
        let success = false;
        
        // Try Moralis first for BNB Chain (preferred)
        if (MORALIS_API_KEY) {
          try {
            console.log('Trying Moralis for BNB Chain');
            const result = await fetchNFTsFromMoralis(contractAddress, chainId, page, pageSize);
            nfts = result.nfts;
            totalCount = result.totalCount;
            success = true;
            console.log('Successfully fetched from Moralis');
          } catch (error) {
            console.warn("Moralis NFT fetch failed:", error);
            apiStatus.moralis = false;
            apiStatus.lastChecked = Date.now();
          }
        } else {
          console.log('Skipping Moralis - No API key available');
        }
        
        // Try BSCScan as fallback for BNB Chain
        if (!success && BSCSCAN_API_KEY) {
          try {
            console.log('Trying BSCScan for BNB Chain');
            const result = await fetchNFTsFromBSCScan(contractAddress, chainId, page, pageSize);
            nfts = result.nfts;
            totalCount = result.totalCount;
            success = true;
            console.log('Successfully fetched from BSCScan');
          } catch (error) {
            console.warn("BSCScan NFT fetch failed:", error);
            apiStatus.bscscan = false;
            apiStatus.lastChecked = Date.now();
          }
        } else if (!success) {
          console.log('Skipping BSCScan - No API key available');
        }
        
        // Last resort for BNB Chain: direct contract fetching
        if (!success) {
          console.log('Falling back to direct contract fetching for BNB Chain');
          const startIndex = (page - 1) * pageSize;
          try {
            nfts = await fetchContractNFTs(contractAddress, chainId, startIndex, pageSize);
            // Generate a mock total count if contract fetching worked but we don't know the total
            totalCount = nfts.length > 0 ? Math.max(nfts.length, pageSize * 2) : 0;
            
            // If we have collection info, use that for total supply
            try {
              const info = await fetchCollectionInfo(contractAddress, chainId);
              if (info && info.totalSupply) {
                totalCount = parseInt(info.totalSupply);
              }
            } catch (e) {
              console.warn('Could not fetch total supply from collection info');
            }
          } catch (contractError) {
            console.error('Contract fetching failed:', contractError);
            // Return empty list as last resort
            nfts = [];
            totalCount = 0;
          }
        }
      } else {
        // Ethereum: Try Alchemy (priority) -> Moralis -> Etherscan -> Contract fallback
        let success = false;
        
        // Try Alchemy first for Ethereum (preferred)
        if (ALCHEMY_API_KEY) {
          try {
            console.log('Trying Alchemy for Ethereum');
            const result = await fetchNFTsFromAlchemy(contractAddress, chainId, page, pageSize);
            nfts = result.nfts;
            totalCount = result.totalCount;
            resultPageKey = result.pageKey;
            success = true;
            console.log('Successfully fetched from Alchemy');
          } catch (error) {
            console.warn("Alchemy NFT fetch failed:", error);
            apiStatus.alchemy = false;
            apiStatus.lastChecked = Date.now();
          }
        } else {
          console.log('Skipping Alchemy - No API key available');
        }
        
        // Try Moralis as second option for Ethereum
        if (!success && MORALIS_API_KEY) {
          try {
            console.log('Trying Moralis for Ethereum');
            const result = await fetchNFTsFromMoralis(contractAddress, chainId, page, pageSize);
            nfts = result.nfts;
            totalCount = result.totalCount;
            success = true;
            console.log('Successfully fetched from Moralis');
          } catch (error) {
            console.warn("Moralis NFT fetch failed:", error);
            apiStatus.moralis = false;
            apiStatus.lastChecked = Date.now();
          }
        } else if (!success) {
          console.log('Skipping Moralis - No API key available');
        }
        
        // Try Etherscan as third option for Ethereum
        if (!success && ETHERSCAN_API_KEY) {
          try {
            console.log('Trying Etherscan for Ethereum');
            const result = await fetchNFTsFromEtherscan(contractAddress, chainId, page, pageSize);
            nfts = result.nfts;
            totalCount = result.totalCount;
            success = true;
            console.log('Successfully fetched from Etherscan');
          } catch (error) {
            console.warn("Etherscan NFT fetch failed:", error);
            apiStatus.etherscan = false;
            apiStatus.lastChecked = Date.now();
          }
        } else if (!success) {
          console.log('Skipping Etherscan - No API key available');
        }
        
        // Last resort for Ethereum: direct contract fetching
        if (!success) {
          console.log('Falling back to direct contract fetching for Ethereum');
          const startIndex = (page - 1) * pageSize;
          try {
            nfts = await fetchContractNFTs(contractAddress, chainId, startIndex, pageSize);
            // Generate a mock total count if contract fetching worked but we don't know the total
            totalCount = nfts.length > 0 ? Math.max(nfts.length, pageSize * 2) : 0;
            
            // If we have collection info, use that for total supply
            try {
              const info = await fetchCollectionInfo(contractAddress, chainId);
              if (info && info.totalSupply) {
                totalCount = parseInt(info.totalSupply);
              }
            } catch (e) {
              console.warn('Could not fetch total supply from collection info');
            }
          } catch (contractError) {
            console.error('Contract fetching failed:', contractError);
            // Return empty list as last resort
            nfts = [];
            totalCount = 0;
          }
        }
      }
    }
    
    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nfts = nfts.filter(nft => 
        nft.name.toLowerCase().includes(query) || 
        nft.tokenId.toLowerCase().includes(query) ||
        nft.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply attribute filtering
    if (Object.keys(attributes).length > 0) {
      nfts = nfts.filter(nft => {
        if (!nft.attributes) return false;
        
        // Check if NFT matches all selected attribute filters
        return Object.entries(attributes).every(([traitType, values]) => {
          if (values.length === 0) return true; // Skip this attribute if no values selected
          
          const nftAttribute = nft.attributes?.find(attr => 
            attr.trait_type.toLowerCase() === traitType.toLowerCase()
          );
          
          if (!nftAttribute || !values.includes(nftAttribute.value)) {
            return false;
          }
          return true;
        });
      });
    }
    
    // Apply sorting
    nfts.sort((a, b) => {
      if (sortBy === 'tokenId') {
        // Handle numeric tokenIds properly
        const idA = parseInt(a.tokenId, 10) || 0;
        const idB = parseInt(b.tokenId, 10) || 0;
        return sortDirection === 'asc' ? idA - idB : idB - idA;
      } else if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      // Add more sort options as needed
      return 0;
    });
    
    // Reset API status every 5 minutes to retry failed providers
    if (Date.now() - apiStatus.lastChecked > 5 * 60 * 1000) {
      apiStatus.alchemy = true;
      apiStatus.moralis = true;
      apiStatus.etherscan = true;
      apiStatus.bscscan = true;
      apiStatus.lastChecked = Date.now();
    }
    
    return {
      nfts,
      totalCount,
      pageKey: resultPageKey
    };
  } catch (error) {
    console.error(`Error fetching NFTs for collection ${contractAddress}:`, error);
    toast.error("Failed to load collection NFTs");
    return { nfts: [], totalCount: 0 };
  }
}

/**
 * Fetch NFTs from Alchemy API
 */
async function fetchNFTsFromAlchemy(
  contractAddress: string, 
  chainId: string,
  page: number,
  pageSize: number
): Promise<{
  nfts: NFTMetadata[],
  totalCount: number,
  pageKey?: string
}> {
  // Use our existing Alchemy API integration
  const result = await alchemyFetchCollectionNFTs(
    contractAddress,
    chainId,
    page,
    pageSize,
    'tokenId',
    'asc'
  );
  
  // Map to our NFTMetadata format
  const mappedNfts: NFTMetadata[] = result.nfts.map(nft => ({
    id: `${contractAddress.toLowerCase()}-${nft.tokenId}`,
    tokenId: nft.tokenId,
    name: nft.name || `NFT #${nft.tokenId}`,
    description: nft.description || '',
    imageUrl: nft.imageUrl || '',
    attributes: nft.attributes || [],
    chain: chainId
  }));
  
  return {
    nfts: mappedNfts,
    totalCount: result.totalCount,
    pageKey: result.pageKey
  };
}

/**
 * Fetch NFTs from Moralis API with better error handling
 */
async function fetchNFTsFromMoralis(
  contractAddress: string, 
  chainId: string,
  page: number,
  pageSize: number
): Promise<{
  nfts: NFTMetadata[],
  totalCount: number
}> {
  if (!MORALIS_API_KEY) {
    throw new Error('Moralis API key not available');
  }
  
  // Convert chainId to Moralis format
  const moralisChain = isBNBChain(chainId) 
    ? (chainId === '0x38' ? 'bsc' : 'bsc testnet')
    : (chainId === '0x1' ? 'eth' : chainId === '0xaa36a7' ? 'sepolia' : 'goerli');
  
  try {
    const options = {
      method: 'GET',
      url: `https://deep-index.moralis.io/api/v2/nft/${contractAddress}`,
      params: {
        chain: moralisChain,
        format: 'decimal',
        limit: pageSize,
        cursor: '', // Moralis uses cursor-based pagination
        offset: (page - 1) * pageSize
      },
      headers: {
        accept: 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    };
    
    const response = await axios.request(options);
    
    if (response.status !== 200) {
      throw new Error(`Moralis API error: ${response.status}`);
    }
    
    const data = response.data;
    
    // Map Moralis data to our format
    const nfts: NFTMetadata[] = data.result.map((item: any) => {
      // Try to parse metadata
      let attributes: {trait_type: string, value: string}[] = [];
      let name = `NFT #${item.token_id}`;
      let description = '';
      let imageUrl = '';
      
      try {
        if (item.metadata) {
          const metadata = typeof item.metadata === 'string' 
            ? JSON.parse(item.metadata) 
            : item.metadata;
          
          name = metadata.name || name;
          description = metadata.description || '';
          imageUrl = metadata.image || '';
          
          if (metadata.attributes && Array.isArray(metadata.attributes)) {
            attributes = metadata.attributes.map((attr: any) => ({
              trait_type: attr.trait_type || '',
              value: attr.value || ''
            }));
          }
        }
      } catch (e) {
        console.warn('Error parsing Moralis NFT metadata:', e);
      }
      
      return {
        id: `${contractAddress.toLowerCase()}-${item.token_id}`,
        tokenId: item.token_id,
        name,
        description,
        imageUrl,
        attributes,
        chain: chainId
      };
    });
    
    return {
      nfts,
      totalCount: data.total || nfts.length
    };
  } catch (error) {
    console.error('Error in fetchNFTsFromMoralis:', error);
    throw error;
  }
}

/**
 * Fetch NFTs from Etherscan API
 */
async function fetchNFTsFromEtherscan(
  contractAddress: string, 
  chainId: string,
  page: number,
  pageSize: number
): Promise<{
  nfts: NFTMetadata[],
  totalCount: number
}> {
  if (!ETHERSCAN_API_KEY) {
    throw new Error('Etherscan API key not available');
  }
  
  if (!isEthereumChain(chainId)) {
    throw new Error('Etherscan only supports Ethereum chains');
  }
  
  // Get appropriate Etherscan domain
  let domain = 'api.etherscan.io';
  if (chainId === '0xaa36a7') {
    domain = 'api-sepolia.etherscan.io';
  } else if (chainId === '0x5') {
    domain = 'api-goerli.etherscan.io';
  }
  
  // Get token info from ABI
  const apiUrl = `https://${domain}/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&page=${page}&offset=${pageSize}&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Etherscan API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`);
  }
  
  // Need to deduplicate token IDs as transfer events might have duplicates
  const tokenSet = new Set<string>();
  const transferEvents = data.result || [];
  
  transferEvents.forEach((tx: any) => {
    tokenSet.add(tx.tokenID);
  });
  
  const tokenIds = Array.from(tokenSet).slice(0, pageSize);
  
  // For each token ID, try to get metadata from the NFT contract
  const nftPromises = tokenIds.map(async (tokenId) => {
    try {
      // Try direct contract query for token URI and metadata
      const provider = getChainProvider(chainId);
      const abi = ["function tokenURI(uint256 tokenId) view returns (string)"];
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      // Get token URI
      const tokenUri = await contract.tokenURI(tokenId).catch(() => '');
      
      // Fetch metadata if token URI is available
      let metadata: any = {};
      if (tokenUri) {
        try {
          // Handle IPFS URIs
          const metadataUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const metadataResponse = await fetch(metadataUrl);
          if (metadataResponse.ok) {
            metadata = await metadataResponse.json();
          }
        } catch (e) {
          console.warn(`Error fetching metadata for token ${tokenId}:`, e);
        }
      }
      
      // Create NFTMetadata object
      return {
        id: `${contractAddress.toLowerCase()}-${tokenId}`,
        tokenId,
        name: metadata.name || `NFT #${tokenId}`,
        description: metadata.description || '',
        imageUrl: metadata.image || '',
        attributes: metadata.attributes || [],
        chain: chainId
      };
    } catch (e) {
      console.warn(`Error getting NFT data for token ${tokenId}:`, e);
      // Return placeholder for errors
      return {
        id: `${contractAddress.toLowerCase()}-${tokenId}`,
        tokenId,
        name: `NFT #${tokenId}`,
        description: '',
        imageUrl: '',
        attributes: [],
        chain: chainId
      };
    }
  });
  
  const nfts = await Promise.all(nftPromises);
  
  // Get total count - this is a rough estimate based on transfer events
  const apiUrlForCount = `https://${domain}/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
  
  let totalCount = tokenSet.size;
  try {
    const countResponse = await fetch(apiUrlForCount);
    if (countResponse.ok) {
      const countData = await countResponse.json();
      if (countData.status === '1') {
        totalCount = parseInt(countData.result, 10);
      }
    }
  } catch (e) {
    console.warn('Error getting total token count:', e);
  }
  
  return {
    nfts,
    totalCount
  };
}

/**
 * Fetch NFTs from BSCScan API with better error handling
 */
async function fetchNFTsFromBSCScan(
  contractAddress: string, 
  chainId: string,
  page: number,
  pageSize: number
): Promise<{
  nfts: NFTMetadata[],
  totalCount: number
}> {
  if (!BSCSCAN_API_KEY) {
    throw new Error('BSCScan API key not available');
  }
  
  if (!isBNBChain(chainId)) {
    throw new Error('BSCScan only supports BNB Chain');
  }
  
  // Get appropriate BSCScan domain
  const domain = chainId === '0x38' ? 'api.bscscan.com' : 'api-testnet.bscscan.com';
  
  // Get token info from BSCScan
  const apiUrl = `https://${domain}/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&page=${page}&offset=${pageSize}&sort=asc&apikey=${BSCSCAN_API_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`BSCScan API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1') {
      // Handle rate limits gracefully
      if (data.message?.includes('rate limit')) {
        console.warn('BSCScan rate limit reached');
        return { nfts: [], totalCount: 0 };
      }
      throw new Error(`BSCScan API error: ${data.message}`);
    }
    
    // Need to deduplicate token IDs as transfer events might have duplicates
    const tokenSet = new Set<string>();
    const transferEvents = data.result || [];
    
    transferEvents.forEach((tx: any) => {
      tokenSet.add(tx.tokenID);
    });
    
    const tokenIds = Array.from(tokenSet).slice(0, pageSize);
    
    // For each token ID, try to get metadata from the NFT contract
    const nftPromises = tokenIds.map(async (tokenId) => {
      try {
        // Try direct contract query for token URI and metadata
        const provider = getChainProvider(chainId);
        const abi = ["function tokenURI(uint256 tokenId) view returns (string)"];
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        // Get token URI
        let tokenUri = '';
        try {
          tokenUri = await contract.tokenURI(tokenId).catch(() => '');
        } catch (e) {
          console.warn(`Error getting tokenURI for token ${tokenId}:`, e);
        }
        
        // Fetch metadata if token URI is available
        let metadata: any = {};
        if (tokenUri) {
          try {
            // Handle IPFS URIs
            const metadataUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            const metadataResponse = await fetch(metadataUrl);
            if (metadataResponse.ok) {
              metadata = await metadataResponse.json();
            }
          } catch (e) {
            console.warn(`Error fetching metadata for token ${tokenId}:`, e);
          }
        }
        
        // Create NFTMetadata object
        return {
          id: `${contractAddress.toLowerCase()}-${tokenId}`,
          tokenId,
          name: metadata.name || `NFT #${tokenId}`,
          description: metadata.description || '',
          imageUrl: metadata.image || '',
          attributes: metadata.attributes || [],
          chain: chainId
        };
      } catch (e) {
        console.warn(`Error getting NFT data for token ${tokenId}:`, e);
        // Return placeholder for errors
        return {
          id: `${contractAddress.toLowerCase()}-${tokenId}`,
          tokenId,
          name: `NFT #${tokenId}`,
          description: '',
          imageUrl: '',
          attributes: [],
          chain: chainId
        };
      }
    });
    
    const nfts = await Promise.all(nftPromises);
    
    // Get total count - this is a rough estimate based on transfer events
    const apiUrlForCount = `https://${domain}/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${BSCSCAN_API_KEY}`;
    
    let totalCount = tokenSet.size;
    try {
      const countResponse = await fetch(apiUrlForCount);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        if (countData.status === '1') {
          totalCount = parseInt(countData.result, 10);
        }
      }
    } catch (e) {
      console.warn('Error getting total token count:', e);
    }
    
    return {
      nfts,
      totalCount
    };
  } catch (error) {
    console.error('Error in fetchNFTsFromBSCScan:', error);
    throw error;
  }
}

/**
 * Fetch user-owned NFTs across all collections
 */
export async function fetchUserNFTs(address: string, chainId: string, pageKey?: string): Promise<{
  ownedNfts: any[],
  totalCount: number,
  pageKey?: string
}> {
  if (!address) {
    throw new Error("Address is required to fetch NFTs");
  }

  // Set API fallback order based on chain
  if (isBNBChain(chainId)) {
    // BNB Chain: Try Moralis -> BSCScan -> Contract fallback
    if (apiStatus.moralis) {
      try {
        return await fetchUserNFTsFromMoralis(address, chainId);
      } catch (error) {
        console.warn("Moralis user NFTs fetch failed:", error);
        apiStatus.moralis = false;
        apiStatus.lastChecked = Date.now();
      }
    }
    
    if (apiStatus.bscscan) {
      try {
        return await fetchUserNFTsFromBSCScan(address, chainId);
      } catch (error) {
        console.warn("BSCScan user NFTs fetch failed:", error);
        apiStatus.bscscan = false;
        apiStatus.lastChecked = Date.now();
      }
    }
  } else {
    // Ethereum: Try Alchemy -> Moralis -> Etherscan -> Contract fallback
    if (apiStatus.alchemy) {
      try {
        const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
        
        const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs`;
        const url = new URL(apiUrl);
        url.searchParams.append('owner', address);
        url.searchParams.append('withMetadata', 'true');
        url.searchParams.append('excludeFilters[]', 'SPAM');
        url.searchParams.append('pageSize', '100');
        
        if (pageKey) {
          url.searchParams.append('pageKey', pageKey);
        }

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.warn("Alchemy user NFTs fetch failed:", error);
        apiStatus.alchemy = false;
        apiStatus.lastChecked = Date.now();
      }
    }
    
    if (apiStatus.moralis) {
      try {
        return await fetchUserNFTsFromMoralis(address, chainId);
      } catch (error) {
        console.warn("Moralis user NFTs fetch failed:", error);
        apiStatus.moralis = false;
        apiStatus.lastChecked = Date.now();
      }
    }
    
    if (apiStatus.etherscan) {
      try {
        return await fetchUserNFTsFromEtherscan(address, chainId);
      } catch (error) {
        console.warn("Etherscan user NFTs fetch failed:", error);
        apiStatus.etherscan = false;
        apiStatus.lastChecked = Date.now();
      }
    }
  }
  
  // Fallback to local mock if all APIs fail
  console.warn("All APIs failed, using mock data");
  
  // Generate some mock NFTs for the demo
  const mockNFTs = [];
  // Generate a deterministic but "random-looking" set of NFTs based on user address
  const numNFTs = parseInt(address.slice(-2), 16) % 10 + 1; // 1-10 NFTs
  
  for (let i = 0; i < numNFTs; i++) {
    mockNFTs.push({
      contract: {
        address: `0x${address.slice(2, 10)}${i.toString(16).padStart(2, '0')}${address.slice(12, 42)}`
      },
      id: {
        tokenId: `${i + 1}`
      },
      title: `Mock NFT #${i + 1}`,
      description: "This is a mock NFT generated because APIs were unavailable",
      tokenUri: {
        gateway: ""
      },
      media: [{
        gateway: `/Img/nft/sample-${(i % 5) + 1}.jpg`
      }],
      metadata: {
        name: `Mock NFT #${i + 1}`,
        attributes: [
          { trait_type: "Rarity", value: ["Common", "Uncommon", "Rare", "Epic", "Legendary"][i % 5] },
          { trait_type: "Type", value: ["Art", "Collectible", "Game", "Utility"][i % 4] }
        ]
      }
    });
  }
  
  return {
    ownedNfts: mockNFTs,
    totalCount: mockNFTs.length
  };
}

/**
 * Fetch user NFTs from Moralis
 */
async function fetchUserNFTsFromMoralis(address: string, chainId: string): Promise<{
  ownedNfts: any[],
  totalCount: number,
  pageKey?: string
}> {
  if (!MORALIS_API_KEY) {
    throw new Error('Moralis API key not available');
  }
  
  // Convert chainId to Moralis format
  const moralisChain = isBNBChain(chainId) 
    ? (chainId === '0x38' ? 'bsc' : 'bsc testnet')
    : (chainId === '0x1' ? 'eth' : chainId === '0xaa36a7' ? 'sepolia' : 'goerli');
  
  const options = {
    method: 'GET',
    url: `https://deep-index.moralis.io/api/v2/${address}/nft`,
    params: {
      chain: moralisChain,
      format: 'decimal',
      limit: '100',
      normalizeMetadata: 'true'
    },
    headers: {
      accept: 'application/json',
      'X-API-Key': MORALIS_API_KEY
    }
  };
  
  const response = await axios.request(options);
  
  if (response.status !== 200) {
    throw new Error(`Moralis API error: ${response.status}`);
  }
  
  const data = response.data;
  
  // Map Moralis NFT data to a format compatible with Alchemy's
  const formattedNfts = data.result.map((item: any) => {
    // Try to parse metadata
    let metadata = {};
    try {
      if (item.normalized_metadata) {
        metadata = item.normalized_metadata;
      } else if (item.metadata && typeof item.metadata === 'string') {
        metadata = JSON.parse(item.metadata);
      } else if (item.metadata) {
        metadata = item.metadata;
      }
    } catch (e) {
      console.warn('Error parsing Moralis NFT metadata:', e);
    }
    
    const imageUrl = (
      metadata && (metadata as any).image
        ? (metadata as any).image.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : ''
    );
    
    return {
      contract: {
        address: item.token_address
      },
      id: {
        tokenId: item.token_id
      },
      title: (metadata as any)?.name || `NFT #${item.token_id}`,
      description: (metadata as any)?.description || '',
      tokenUri: {
        gateway: item.token_uri || ''
      },
      media: [{
        gateway: imageUrl
      }],
      metadata: metadata
    };
  });
  
  return {
    ownedNfts: formattedNfts,
    totalCount: data.total || formattedNfts.length,
    pageKey: data.cursor || undefined
  };
}

/**
 * Fetch user NFTs from Etherscan
 */
async function fetchUserNFTsFromEtherscan(address: string, chainId: string): Promise<{
  ownedNfts: any[],
  totalCount: number
}> {
  if (!ETHERSCAN_API_KEY) {
    throw new Error('Etherscan API key not available');
  }
  
  if (!isEthereumChain(chainId)) {
    throw new Error('Etherscan only supports Ethereum chains');
  }
  
  // Get appropriate Etherscan domain
  let domain = 'api.etherscan.io';
  if (chainId === '0xaa36a7') {
    domain = 'api-sepolia.etherscan.io';
  } else if (chainId === '0x5') {
    domain = 'api-goerli.etherscan.io';
  }
  
  // Get ERC-721 token transfers for the address
  const apiUrl = `https://${domain}/api?module=account&action=tokennfttx&address=${address}&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Etherscan API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`);
  }
  
  // Group transactions by token contract and ID to find current holdings
  const nftHoldings = new Map<string, any>();
  const transferEvents = data.result || [];
  
  // Process transfer events to determine current holdings
  transferEvents.forEach((tx: any) => {
    const contractAddress = tx.contractAddress.toLowerCase();
    const tokenId = tx.tokenID;
    const key = `${contractAddress}-${tokenId}`;
    
    // Check if this is a transfer TO the user (current owner)
    if (tx.to.toLowerCase() === address.toLowerCase()) {
      if (!nftHoldings.has(key)) {
        nftHoldings.set(key, {
          contractAddress,
          tokenId,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol
        });
      }
    } 
    // Check if this is a transfer FROM the user (no longer owner)
    else if (tx.from.toLowerCase() === address.toLowerCase()) {
      nftHoldings.delete(key);
    }
  });
  
  // Convert to array
  const nfts = Array.from(nftHoldings.values());
  
  // For each NFT, try to get additional metadata
  const formattedNfts = await Promise.all(nfts.map(async (nft) => {
    try {
      // Try to get token URI and metadata
      const provider = getChainProvider(chainId);
      const abi = ["function tokenURI(uint256 tokenId) view returns (string)"];
      const contract = new ethers.Contract(nft.contractAddress, abi, provider);
      
      let tokenUri = '';
      try {
        tokenUri = await contract.tokenURI(nft.tokenId);
      } catch (e) {
        console.warn(`Error getting tokenURI for ${nft.contractAddress} - ${nft.tokenId}:`, e);
      }
      
      // Fetch metadata if tokenURI is available
      let metadata = {};
      let imageUrl = '';
      if (tokenUri) {
        try {
          // Handle IPFS URIs
          const metadataUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const metadataResponse = await fetch(metadataUrl);
          if (metadataResponse.ok) {
            metadata = await metadataResponse.json();
            imageUrl = (metadata as any).image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '';
          }
        } catch (e) {
          console.warn(`Error fetching metadata for ${nft.contractAddress} - ${nft.tokenId}:`, e);
        }
      }
      
      return {
        contract: {
          address: nft.contractAddress
        },
        id: {
          tokenId: nft.tokenId
        },
        title: (metadata as any)?.name || `${nft.tokenName} #${nft.tokenId}`,
        description: (metadata as any)?.description || '',
        tokenUri: {
          gateway: tokenUri
        },
        media: [{
          gateway: imageUrl
        }],
        metadata
      };
    } catch (e) {
      console.warn(`Error processing NFT ${nft.contractAddress} - ${nft.tokenId}:`, e);
      
      // Return basic info without metadata
      return {
        contract: {
          address: nft.contractAddress
        },
        id: {
          tokenId: nft.tokenId
        },
        title: `${nft.tokenName} #${nft.tokenId}`,
        description: '',
        media: [{ gateway: '' }],
        metadata: {}
      };
    }
  }));
  
  return {
    ownedNfts: formattedNfts,
    totalCount: formattedNfts.length
  };
}

/**
 * Fetch user NFTs from BSCScan
 */
async function fetchUserNFTsFromBSCScan(address: string, chainId: string): Promise<{
  ownedNfts: any[],
  totalCount: number
}> {
  if (!BSCSCAN_API_KEY) {
    throw new Error('BSCScan API key not available');
  }
  
  if (!isBNBChain(chainId)) {
    throw new Error('BSCScan only supports BNB Chain');
  }
  
  // Get appropriate BSCScan domain
  const domain = chainId === '0x38' ? 'api.bscscan.com' : 'api-testnet.bscscan.com';
  
  // Get ERC-721 token transfers for the address
  const apiUrl = `https://${domain}/api?module=account&action=tokennfttx&address=${address}&page=1&offset=100&sort=desc&apikey=${BSCSCAN_API_KEY}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`BSCScan API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status !== '1') {
    throw new Error(`BSCScan API error: ${data.message}`);
  }
  
  // Group transactions by token contract and ID to find current holdings
  const nftHoldings = new Map<string, any>();
  const transferEvents = data.result || [];
  
  // Process transfer events to determine current holdings
  transferEvents.forEach((tx: any) => {
    const contractAddress = tx.contractAddress.toLowerCase();
    const tokenId = tx.tokenID;
    const key = `${contractAddress}-${tokenId}`;
    
    // Check if this is a transfer TO the user (current owner)
    if (tx.to.toLowerCase() === address.toLowerCase()) {
      if (!nftHoldings.has(key)) {
        nftHoldings.set(key, {
          contractAddress,
          tokenId,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol
        });
      }
    } 
    // Check if this is a transfer FROM the user (no longer owner)
    else if (tx.from.toLowerCase() === address.toLowerCase()) {
      nftHoldings.delete(key);
    }
  });
  
  // Convert to array
  const nfts = Array.from(nftHoldings.values());
  
  // For each NFT, try to get additional metadata
  const formattedNfts = await Promise.all(nfts.map(async (nft) => {
    try {
      // Try to get token URI and metadata
      const provider = getChainProvider(chainId);
      const abi = ["function tokenURI(uint256 tokenId) view returns (string)"];
      const contract = new ethers.Contract(nft.contractAddress, abi, provider);
      
      let tokenUri = '';
      try {
        tokenUri = await contract.tokenURI(nft.tokenId);
      } catch (e) {
        console.warn(`Error getting tokenURI for ${nft.contractAddress} - ${nft.tokenId}:`, e);
      }
      
      // Fetch metadata if tokenURI is available
      let metadata = {};
      let imageUrl = '';
      if (tokenUri) {
        try {
          // Handle IPFS URIs
          const metadataUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const metadataResponse = await fetch(metadataUrl);
          if (metadataResponse.ok) {
            metadata = await metadataResponse.json();
            imageUrl = (metadata as any).image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '';
          }
        } catch (e) {
          console.warn(`Error fetching metadata for ${nft.contractAddress} - ${nft.tokenId}:`, e);
        }
      }
      
      return {
        contract: {
          address: nft.contractAddress
        },
        id: {
          tokenId: nft.tokenId
        },
        title: (metadata as any)?.name || `${nft.tokenName} #${nft.tokenId}`,
        description: (metadata as any)?.description || '',
        tokenUri: {
          gateway: tokenUri
        },
        media: [{
          gateway: imageUrl
        }],
        metadata
      };
    } catch (e) {
      console.warn(`Error processing NFT ${nft.contractAddress} - ${nft.tokenId}:`, e);
      
      // Return basic info without metadata
      return {
        contract: {
          address: nft.contractAddress
        },
        id: {
          tokenId: nft.tokenId
        },
        title: `${nft.tokenName} #${nft.tokenId}`,
        description: '',
        media: [{ gateway: '' }],
        metadata: {}
      };
    }
  }));
  
  return {
    ownedNfts: formattedNfts,
    totalCount: formattedNfts.length
  };
}

/**
 * Fetch popular NFT collections for a specific chain
 */
export async function fetchPopularCollections(chainId: string): Promise<CollectionMetadata[]> {
  try {
    const cacheKey = `popular-collections-${chainId}`;
    
    // Check cache first
    if (collectionsCache.has(cacheKey)) {
      return collectionsCache.get(cacheKey);
    }
    
    // Get list of popular collection addresses for this chain
    const popularCollections = POPULAR_NFT_COLLECTIONS[chainId as keyof typeof POPULAR_NFT_COLLECTIONS] || [];
    
    // Fetch detailed info for each collection
    const collectionsPromises = popularCollections.map(collection => 
      fetchCollectionInfo(collection.address, chainId)
    );
    
    const collectionsData = await Promise.all(collectionsPromises);
    
    // Cache the results
    collectionsCache.set(cacheKey, collectionsData);
    
    return collectionsData;
  } catch (error) {
    console.error('Error fetching popular collections:', error);
    return [];
  }
}

import { 
  fetchCollectionNFTs as _duplicateAlchemyFetchCollectionNFTs, 
  fetchUserNFTs as alchemyFetchUserNFTs
} from './alchemyNFTApi';

// Cache system for NFTs
const NFT_CACHE = new Map<string, { data: any, timestamp: number }>();
const PAGINATION_CACHE = new Map<string, { data: any, timestamp: number, page: number }>();
const COLLECTION_CACHE = new Map<string, { data: any, timestamp: number }>();

// Cache TTL settings
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const PAGINATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds for pagination cache
const MEMORY_ESTIMATE_FACTOR = 6000; // bytes per NFT (rough estimate including image URLs and metadata)

// Progressive loading state
type OnProgressCallback = (loaded: number, total: number) => void;
interface ProgressiveLoadingOptions {
  batchSize?: number;
  initialPageSize?: number;
  maxBatches?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  attributes?: Record<string, string[]>;
  onProgress?: OnProgressCallback;
}

// Interface for NFT Collection response
interface NFTResponse {
  nfts: any[];
  totalCount: number;
  nextCursor?: string;
  hasMoreBatches?: boolean;
  progress: number;
}

/**
 * Fetch NFTs with optimized cursor-based pagination
 */
export async function fetchNFTsWithOptimizedCursor(
  contractAddress: string,
  chainId: string,
  cursor?: string,
  pageSize: number = 50,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<NFTResponse> {
  // Generate cache key based on all parameters
  const cacheKey = `${contractAddress}-${chainId}-${cursor}-${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  
  // Check cache first
  const cached = NFT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached NFT data for', cacheKey);
    return { ...cached.data, progress: 100 };
  }
  
  try {
    // Fetch data from API
    const result = await fetchCollectionNFTs(
      contractAddress,
      chainId,
      {
        page: cursor === '1' ? 1 : undefined,
        pageSize,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      }
    );
    
    // Calculate progress (rough estimate)
    const progress = Math.min(100, Math.round((result.nfts.length / (result.totalCount || 1)) * 100));
    
    // Ensure we have a next cursor for collections that don't support cursors
    // For these collections, we'll synthesize a cursor based on token IDs
    const syntheticCursor = result.pageKey || generateSyntheticCursor(result.nfts, sortBy, sortDirection);
    
    const response = {
      nfts: result.nfts,
      totalCount: result.totalCount,
      nextCursor: syntheticCursor,
      progress
    };
    
    // Cache the response
    NFT_CACHE.set(cacheKey, { data: response, timestamp: Date.now() });
    
    return response;
  } catch (error) {
    console.error('Error in fetchNFTsWithOptimizedCursor:', error);
    throw error;
  }
}

/**
 * Generate a synthetic cursor when API doesn't provide one
 * This helps with collections that don't support cursor-based pagination
 */
function generateSyntheticCursor(
  nfts: any[],
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc'
): string | undefined {
  // If no NFTs, there's no next page
  if (!nfts || nfts.length === 0) {
    return undefined;
  }
  
  // For token ID based sorting, create a cursor based on the last token ID
  if (sortBy === 'tokenId') {
    const lastNft = sortDirection === 'asc' ? nfts[nfts.length - 1] : nfts[0];
    if (lastNft && lastNft.tokenId) {
      // For ascending, next token would be lastTokenId + 1
      // For descending, next token would be lastTokenId - 1
      const lastTokenId = parseInt(lastNft.tokenId);
      if (!isNaN(lastTokenId)) {
        const nextId = sortDirection === 'asc' ? lastTokenId + 1 : lastTokenId - 1;
        // Only return a synthetic cursor if nextId is positive (valid)
        if (nextId >= 0) {
          return `synthetic:${sortBy}:${nextId}:${sortDirection}`;
        }
      }
    }
  }
  
  // For other sort types, just indicate there might be a next page if we have a full page
  if (nfts.length >= 20) { // Assume a full page is at least 20 items
    return 'synthetic:nextpage';
  }
  
  return undefined;
}

/**
 * Fetch NFTs using progressive loading to load all items in batches
 */
export async function fetchNFTsWithProgressiveLoading(
  contractAddress: string,
  chainId: string,
  options: ProgressiveLoadingOptions = {}
): Promise<NFTResponse> {
  const {
    batchSize = 50,
    initialPageSize = 50,
    maxBatches = 5,
    sortBy = 'tokenId',
    sortDirection = 'asc',
    searchQuery = '',
    attributes = {},
    onProgress
  } = options;
  
  // Generate cache key
  const cacheKey = `progressive-${contractAddress}-${chainId}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  
  // Check cache first
  const cached = NFT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached progressive NFT data for', cacheKey);
    if (onProgress) onProgress(cached.data.nfts.length, cached.data.totalCount);
    return { ...cached.data, progress: 100 };
  }
  
  // Initial load
  let result = await fetchCollectionNFTs(
    contractAddress,
    chainId,
    {
      page: 1,
      pageSize: initialPageSize,
      sortBy,
      sortDirection,
      searchQuery,
      attributes
    }
  );
  
  const allNfts = [...result.nfts];
  const totalCount = result.totalCount || 0;
  
  // Don't attempt to load more if there's no pageKey or the collection is small
  if (!result.pageKey || allNfts.length >= totalCount || allNfts.length >= batchSize * maxBatches) {
    const progress = Math.min(100, Math.round((allNfts.length / (totalCount || 1)) * 100));
    const response = {
      nfts: allNfts,
      totalCount,
      hasMoreBatches: false,
      progress
    };
    
    NFT_CACHE.set(cacheKey, { data: response, timestamp: Date.now() });
    
    if (onProgress) onProgress(allNfts.length, totalCount);
    return response;
  }
  
  // Progressive loading with batches
  let pageKey = result.pageKey;
  let batchCount = 1;
  let hasMoreBatches = true;
  
  while (pageKey && batchCount < maxBatches && allNfts.length < totalCount) {
    try {
      // Simulate progressive loading by using pageKey as an ID
      result = await fetchCollectionNFTs(
        contractAddress,
        chainId,
        {
          pageKey,
          pageSize: batchSize,
          sortBy,
          sortDirection,
          searchQuery,
          attributes
        }
      );
      
      allNfts.push(...result.nfts);
      
      // Update progress callback
      if (onProgress) {
        onProgress(allNfts.length, totalCount);
      }
      
      // Update pageKey for next batch
      pageKey = result.pageKey || '';
      batchCount++;
      
      // Break if we've loaded enough or there's no more data
      if (!pageKey || allNfts.length >= totalCount) {
        hasMoreBatches = false;
        break;
      }
    } catch (error) {
      console.error('Error in progressive loading batch:', error);
      hasMoreBatches = true;
      break;
    }
  }
  
  // Prepare response
  const progress = Math.min(100, Math.round((allNfts.length / (totalCount || 1)) * 100));
  const response = {
    nfts: allNfts,
    totalCount,
    hasMoreBatches: !!pageKey && allNfts.length < totalCount,
    progress
  };
  
  // Cache the aggregated result
  NFT_CACHE.set(cacheKey, { data: response, timestamp: Date.now() });
  
  return response;
}

/**
 * Fetch NFTs with standard pagination
 */
export async function fetchPaginatedNFTs(
  contractAddress: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<{
  nfts: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  cursor?: string;
}> {
  // Generate cache key based on all parameters
  const cacheKey = `pagination-${contractAddress}-${chainId}-${page}-${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  
  // Check cache first
  const cachedData = PAGINATION_CACHE.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < PAGINATION_CACHE_TTL)) {
    console.log('Using cached pagination data for page', page);
    return cachedData.data;
  }
  
  try {
    // Look up previous page in cache to get cursor for current page
    // This is essential for collections where direct page access isn't supported
    let cursor: string | undefined;
    let previousCursor: string | undefined;
    
    // Special case for first page
    if (page === 1) {
      cursor = '1'; // Starting cursor
    } else {
      // Try to find the previous page cursor from cache
      const prevPageKey = `pagination-${contractAddress}-${chainId}-${page-1}-${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
      const prevPageData = PAGINATION_CACHE.get(prevPageKey);
      
      if (prevPageData) {
        cursor = prevPageData.data.cursor; // Get cursor for next page
        console.log(`Found cursor for page ${page} from cache:`, cursor);
      }
      
      // If we don't have a cursor from previous page, we need to fetch sequentially
      if (!cursor) {
        console.log(`No cursor found for page ${page}, fetching sequentially`);
        
        // Start from page 1 and work our way up
        let currentCursor = '1';
        let currentPage = 1;
        
        while (currentPage < page && currentCursor) {
          console.log(`Fetching intermediate page ${currentPage} to get to page ${page}`);
          
          // Fetch this page to get cursor for next page
          const intermediateResult = await fetchNFTsWithOptimizedCursor(
            contractAddress,
            chainId,
            currentCursor,
            pageSize,
            sortBy,
            sortDirection,
            searchQuery,
            attributes
          );
          
          // Store this page in cache
          const intermediatePageKey = `pagination-${contractAddress}-${chainId}-${currentPage}-${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
          
          PAGINATION_CACHE.set(intermediatePageKey, {
            data: {
              nfts: intermediateResult.nfts,
              totalCount: intermediateResult.totalCount,
              currentPage,
              totalPages: Math.ceil(intermediateResult.totalCount / pageSize),
              cursor: intermediateResult.nextCursor
            },
            timestamp: Date.now(),
            page: currentPage // Add the page property here too
          });
          
          currentCursor = intermediateResult.nextCursor || '';
          
          // If there's no next cursor, we've reached the end
          if (!currentCursor) {
            console.log(`Reached the end of collection at page ${currentPage}`);
            break;
          }
          
          currentPage++;
          
          // If we've reached our target page, use this cursor
          if (currentPage === page) {
            cursor = currentCursor;
            console.log(`Found cursor for target page ${page}:`, cursor);
          }
          
          // Avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    // If we still don't have a cursor and we're not on page 1, 
    // we can't fetch this page directly
    if (!cursor && page !== 1) {
      console.log(`Could not determine cursor for page ${page}, returning empty results`);
      return {
        nfts: [],
        totalCount: 0,
        currentPage: page,
        totalPages: page - 1 // Assume this is beyond the last page
      };
    }
    
    // Fetch the data using the cursor we've determined
    console.log(`Fetching page ${page} with cursor:`, cursor);
    const result = await fetchNFTsWithOptimizedCursor(
      contractAddress,
      chainId,
      cursor,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      attributes
    );
    
    // Calculate total pages based on total count
    const totalCount = result.totalCount || Math.max(result.nfts.length, pageSize * page);
    const totalPages = Math.max(page, Math.ceil(totalCount / pageSize));
    
    // Prepare result with next cursor for pagination
    const paginationResult = {
      nfts: result.nfts,
      totalCount,
      currentPage: page,
      totalPages,
      cursor: result.nextCursor // Store cursor for next page
    };
    
    // Cache the result - FIX: Add page property
    PAGINATION_CACHE.set(cacheKey, {
      data: paginationResult,
      timestamp: Date.now(),
      page: page // Add the missing page property here
    });
    
    return paginationResult;
  } catch (error) {
    console.error('Error in fetchPaginatedNFTs:', error);
    
    // Provide fallback with mock data
    const mockData = generateMockNFTs(contractAddress, chainId, page, pageSize);
    // Ensure we have a reasonable total for mocks - at least 50x the page size
    const totalEstimate = Math.max(1000, page * pageSize * 2);
    const totalPages = Math.ceil(totalEstimate / pageSize);
    
    return {
      nfts: mockData,
      totalCount: totalEstimate,
      currentPage: page,
      totalPages,
      cursor: mockData.length === pageSize ? 'mock-next-cursor' : undefined
    };
  }
}

/**
 * Clear the NFT cache for a specific collection
 */
export function clearSpecificCollectionCache(
  contractAddress: string,
  chainId: string
): void {
  // Clear all cache entries that match the collection and chain
  for (const key of NFT_CACHE.keys()) {
    if (key.includes(`${contractAddress}-${chainId}`)) {
      NFT_CACHE.delete(key);
    }
  }
  
  console.log(`Cleared cache for collection ${contractAddress} on chain ${chainId}`);
}

/**
 * Clear all collection caches
 */
export function clearCollectionCache(
  contractAddress?: string,
  chainId?: string
): void {
  if (contractAddress && chainId) {
    clearSpecificCollectionCache(contractAddress, chainId);
  } else {
    NFT_CACHE.clear();
    console.log('Cleared all NFT caches');
  }
}

/**
 * Clear pagination cache for a collection
 */
export function clearPaginationCache(
  contractAddress: string,
  chainId: string
): void {
  // Clear all pagination cache entries that match the collection and chain
  for (const key of PAGINATION_CACHE.keys()) {
    if (key.includes(`pagination-${contractAddress}-${chainId}`)) {
      PAGINATION_CACHE.delete(key);
    }
  }
  
  console.log(`Cleared pagination cache for collection ${contractAddress} on chain ${chainId}`);
}

/**
 * Estimate memory usage for a collection based on number of NFTs
 */
export function estimateCollectionMemoryUsage(
  nftCount: number
): string {
  const bytesEstimate = nftCount * MEMORY_ESTIMATE_FACTOR;
  
  if (bytesEstimate < 1024) {
    return `${bytesEstimate} bytes`;
  } else if (bytesEstimate < 1024 * 1024) {
    return `${(bytesEstimate / 1024).toFixed(2)} KB`;
  } else if (bytesEstimate < 1024 * 1024 * 1024) {
    return `${(bytesEstimate / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytesEstimate / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Fetch user's NFT collections with caching
 */
export async function fetchUserCollections(
  address: string,
  chainId: string
): Promise<any[]> {
  // Generate cache key
  const cacheKey = `user-collections-${address}-${chainId}`;
  
  // Check cache first
  const cached = COLLECTION_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached user collections');
    return cached.data;
  }
  
  try {
    // Fetch user NFTs from API
    const response = await fetchUserNFTs(address, chainId);
    
    // Group NFTs by collection
    const collections = new Map<string, any>();
    
    response.ownedNfts.forEach((nft: any) => {
      const contractAddress = nft.contract?.address;
      if (!contractAddress) return;
      
      if (!collections.has(contractAddress)) {
        collections.set(contractAddress, {
          contractAddress,
          name: nft.contract.name || 'Unknown Collection',
          symbol: nft.contract.symbol || '',
          count: 0,
          imageUrl: nft.media?.[0]?.gateway || '',
          chain: chainId
        });
      }
      
      const collection = collections.get(contractAddress);
      collection.count++;
      
      // Use first NFT image if collection image is missing
      if (!collection.imageUrl && nft.media?.[0]?.gateway) {
        collection.imageUrl = nft.media[0].gateway;
      }
    });
    
    const result = Array.from(collections.values());
    
    // Cache the result
    COLLECTION_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error('Error fetching user collections:', error);
    throw error;
  }
}

/**
 * Get collection metadata with caching
 */
export async function getCollectionMetadata(
  contractAddress: string,
  chainId: string
): Promise<any> {
  // Generate cache key
  const cacheKey = `metadata-${contractAddress}-${chainId}`;
  
  // Check cache first
  const cached = COLLECTION_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached collection metadata');
    return cached.data;
  }
  
  try {
    const metadata = await fetchCollectionInfo(contractAddress, chainId);
    
    // Add chain ID to metadata
    const metadataWithChain = {
      ...metadata,
      chain: chainId
    };
    
    // Cache the result
    COLLECTION_CACHE.set(cacheKey, { 
      data: metadataWithChain, 
      timestamp: Date.now() 
    });
    
    return metadataWithChain;
  } catch (error) {
    console.error('Error fetching collection metadata:', error);
    throw error;
  }
}

/**
 * Filter NFTs by attribute
 */
export function filterNFTsByAttributes(
  nfts: any[],
  attributes: Record<string, string[]>
): any[] {
  if (!attributes || Object.keys(attributes).length === 0) {
    return nfts;
  }
  
  return nfts.filter(nft => {
    if (!nft.attributes) return false;
    
    // Check if NFT matches all selected attribute filters
    return Object.entries(attributes).every(([traitType, values]) => {
      // Find an attribute that matches the trait type
      const attribute = nft.attributes.find(
        (attr: any) => attr.trait_type.toLowerCase() === traitType.toLowerCase()
      );
      
      // If not found but filter exists, exclude NFT
      if (!attribute) return false;
      
      // Check if attribute value is in the selected values
      return values.some(value => 
        attribute.value.toLowerCase() === value.toLowerCase()
      );
    });
  });
}

/**
 * Sort NFTs based on criteria
 */
export function sortNFTs(
  nfts: any[],
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc'
): any[] {
  const sortedNFTs = [...nfts];
  
  sortedNFTs.sort((a, b) => {
    let valueA, valueB;
    
    if (sortBy === 'tokenId') {
      // Handle numeric tokenIds properly
      valueA = parseInt(a.tokenId, 10) || 0;
      valueB = parseInt(b.tokenId, 10) || 0;
    } else if (sortBy === 'name') {
      valueA = a.name || '';
      valueB = a.name || '';
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else {
      // Default fallback for unknown sort criteria
      valueA = a[sortBy] || 0;
      valueB = b[sortBy] || 0;
    }
    
    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  });
  
  return sortedNFTs;
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(
  contractAddress: string,
  chainId: string
): Promise<any> {
  // This would normally fetch real stats from an API
  // For now, we'll return mock data
  const metadata = await getCollectionMetadata(contractAddress, chainId);
  
  return {
    floorPrice: Math.random() * 5 + 0.1,
    volume24h: Math.random() * 100,
    totalListings: Math.floor(Math.random() * 500),
    totalOwners: Math.floor(Math.random() * 2000),
    totalSupply: metadata.totalSupply || 10000,
  };
}

/**
 * Fetch paginated NFTs for PaginatedNFTGrid component
 * Specifically designed to handle the unique needs of pagination components
 */
export async function fetchPaginatedNFTsForGrid(
  contractAddress: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
) {
  // Use cached data if available
  const cacheKey = `pagination-${contractAddress}-${chainId}-${page}-${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  
  const cachedData = PAGINATION_CACHE.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < PAGINATION_CACHE_TTL)) {
    return cachedData.data;
  }
  
  try {
    // For page 1, fetch directly
    if (page === 1) {
      const result = await fetchNFTsWithOptimizedCursor(
        contractAddress,
        chainId,
        '1',
        pageSize,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      );
      
      // Ensure we have a valid totalCount - default to at least the length of returned NFTs
      const totalCount = result.totalCount || Math.max(result.nfts.length, 100);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      
      const paginationResult = {
        nfts: result.nfts,
        currentPage: page,
        totalPages,
        totalCount
      };
      
      // Cache the result
      PAGINATION_CACHE.set(cacheKey, {
        data: paginationResult,
        timestamp: Date.now(),
        page: page
      });
      
      return paginationResult;
    }
    
    // ...existing code for subsequent pages...
    
    // Ensure we always return totalCount even when error occurs
    const mockData = generateMockNFTs(contractAddress, chainId, page, pageSize);
    const totalCount = Math.max(1000, mockData.length * 50); // Ensure a reasonable default total
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      nfts: mockData,
      currentPage: page,
      totalPages,
      totalCount
    };
  } catch (error) {
    console.error('Error in fetchPaginatedNFTs:', error);
    
    // Provide fallback with mock data
    const mockData = generateMockNFTs(contractAddress, chainId, page, pageSize);
    // Ensure we have a reasonable total for mocks - at least 50x the page size
    const totalCount = 1000; // Mock total
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      nfts: mockData,
      currentPage: page,
      totalPages,
      totalCount
    };
  }
}

/**
 * Generate mock NFTs for testing or when API calls fail
 */
export function generateMockNFTs(contractAddress: string, chainId: string, page: number, pageSize: number): any[] {
  const nfts: any[] = [];
  const startIndex = (page - 1) * pageSize + 1;
  
  // Normalized contract address
  const normalizedAddress = contractAddress.toLowerCase();
  
  // Generate NFTs for this page
  for (let i = 0; i < pageSize; i++) {
    const tokenId = String(startIndex + i);
    
    // Generate deterministic but varied attributes based on token ID
    const tokenNum = parseInt(tokenId, 10);
    const seed = tokenNum % 100;
    
    // Background options
    const backgrounds = ['Blue', 'Red', 'Green', 'Purple', 'Gold', 'Black', 'White'];
    const backgroundIndex = seed % backgrounds.length;
    
    // Species options
    const species = ['Human', 'Ape', 'Robot', 'Alien', 'Zombie', 'Demon', 'Angel'];
    const speciesIndex = (seed * 3) % species.length;
    
    // Rarity options
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    const rarityIndex = Math.floor(seed / 20); // 0-4
    
    // For special collections, use customized naming
    const name = normalizedAddress === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551' 
      ? `CryptoPath Genesis #${tokenId}`
      : `NFT #${tokenId}`;
      
    const description = normalizedAddress === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551'
      ? `A unique NFT from the CryptoPath Genesis Collection with ${rarities[rarityIndex]} rarity.`
      : `NFT #${tokenId} from the collection`;
    
    nfts.push({
      id: `${contractAddress.toLowerCase()}-${tokenId}`,
      tokenId: tokenId,
      name: name,
      description: description,
      imageUrl: `/Img/nft/sample-${(seed % 5) + 1}.jpg`, // Using sample images 1-5
      attributes: [
        { trait_type: 'Background', value: backgrounds[backgroundIndex] },
        { trait_type: 'Species', value: species[speciesIndex] },
        { trait_type: 'Rarity', value: rarities[rarityIndex] },
        // Network attribute for filtering
        { trait_type: 'Network', value: chainId === '0x1' ? 'Ethereum' : 
                             chainId === '0xaa36a7' ? 'Sepolia' :
                             chainId === '0x38' ? 'BNB Chain' : 'BNB Testnet' }
      ],
      chain: chainId
    });
  }
  
  return nfts;
}

/**
 * Apply filtering to NFTs
 * Enhances filtering logic to work with API-fetched data
 */
export function applyFilters(
  nfts: any[],
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): any[] {
  let filtered = [...nfts];
  
  // Apply search filter first
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(nft => 
      nft.name?.toLowerCase().includes(query) || 
      nft.tokenId?.toString().toLowerCase().includes(query) ||
      nft.description?.toLowerCase().includes(query)
    );
  }
  
  // Then apply attribute filters if any
  if (Object.keys(attributes).length > 0) {
    filtered = filtered.filter(nft => {
      // Skip NFTs with no attributes if we're filtering by attributes
      if (!nft.attributes || !Array.isArray(nft.attributes)) return false;
      
      // Check if all attribute filters are satisfied
      return Object.entries(attributes).every(([traitType, values]) => {
        // If no values selected for this trait, skip this filter
        if (!values || values.length === 0) return true;
        
        // Find the matching attribute for this trait type
        const matchingAttribute = nft.attributes.find((attr: any) => 
          attr.trait_type?.toLowerCase() === traitType.toLowerCase()
        );
        
        // If trait not found, filter out
        if (!matchingAttribute) return false;
        
        // Check if the attribute value is in our selected values
        return values.some(value => 
          matchingAttribute.value?.toString().toLowerCase() === value.toLowerCase()
        );
      });
    });
  }
  
  return filtered;
}
