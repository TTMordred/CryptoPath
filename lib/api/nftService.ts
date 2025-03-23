import { toast } from "sonner";
import axios from 'axios';
import { ethers } from 'ethers';
import {
  fetchContractCollectionInfo,
  fetchNFTData,
  fetchContractNFTs,
  fetchOwnedNFTs,
  NFTMetadata,
  POPULAR_NFT_COLLECTIONS
} from './nftContracts';
import {
  CollectionNFT,
  CollectionNFTsResponse
} from './alchemyNFTApi';
import { getChainProvider, getExplorerUrl, ChainConfig, chainConfigs } from './chainProviders';

// Environment variables for API keys
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';
const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY || '';

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
const CACHE_TTL = 10 * 60 * 1000;

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
    
    // Try Alchemy for additional metadata
    let alchemyData = null;
    try {
      const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
      const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getContractMetadata`;
      const url = new URL(apiUrl);
      url.searchParams.append('contractAddress', contractAddress);
      
      const response = await fetch(url.toString());
      if (response.ok) {
        alchemyData = await response.json();
      }
    } catch (err) {
      console.warn("Alchemy metadata fetch failed:", err);
    }
    
    // Try marketplace data lookup for floor price, etc.
    const marketData = await fetchMarketplaceData(contractAddress, chainId);
    
    // Combine all data sources
    const metadata: CollectionMetadata = {
      id: contractAddress.toLowerCase(),
      name: contractInfo.name || 'Unknown Collection',
      symbol: contractInfo.symbol || '',
      description: alchemyData?.contractMetadata?.openSea?.description || '',
      imageUrl: alchemyData?.contractMetadata?.openSea?.imageUrl || '/fallback-collection-logo.png',
      bannerImageUrl: alchemyData?.contractMetadata?.openSea?.bannerImageUrl || '',
      totalSupply: contractInfo.totalSupply || '0',
      floorPrice: marketData?.floorPrice || '0',
      volume24h: marketData?.volume24h || '0',
      chain: chainId,
      contractAddress: contractAddress.toLowerCase(),
      verified: alchemyData?.contractMetadata?.openSea?.safelistRequestStatus === 'verified',
      category: alchemyData?.contractMetadata?.openSea?.category || 'Art',
      featured: false,
      standard: contractInfo.standard || 'ERC721',
      creatorAddress: alchemyData?.contractMetadata?.openSea?.creator || '',
      website: alchemyData?.contractMetadata?.openSea?.externalUrl || '',
      discord: alchemyData?.contractMetadata?.openSea?.discordUrl || '',
      twitter: alchemyData?.contractMetadata?.openSea?.twitterUsername 
        ? `https://twitter.com/${alchemyData.contractMetadata.openSea.twitterUsername}` 
        : '',
    };
    
    // Save to cache
    collectionsCache.set(cacheKey, metadata);
    
    return metadata;
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
    attributes?: Record<string, string[]>
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
    attributes = {}
  } = options;
  
  // Check if we should use direct contract fetching or API
  // For well-known collections or testnet, use direct contract fetching
  const useDirectFetching = [
    // Our CryptoPath Genesis on BNB Testnet
    '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551',
    // Some popular testnet or demo collections
    '0x7c09282c24c363073e0f30d74c301c312e5533ac'
  ].includes(contractAddress.toLowerCase());
  
  try {
    let nfts: NFTMetadata[] = [];
    let totalCount = 0;
    
    if (useDirectFetching) {
      // Check cache first
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
      // Use Alchemy API for production collections
      const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
      const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTsForCollection`;
      const url = new URL(apiUrl);
      url.searchParams.append('contractAddress', contractAddress);
      url.searchParams.append('withMetadata', 'true');
      url.searchParams.append('startToken', ((page - 1) * pageSize).toString());
      url.searchParams.append('limit', pageSize.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map Alchemy data to our format
      nfts = data.nfts.map((nft: any) => ({
        id: `${contractAddress.toLowerCase()}-${nft.id.tokenId || ''}`,
        tokenId: nft.id.tokenId || '',
        name: nft.title || `NFT #${parseInt(nft.id.tokenId || '0', 16).toString()}`,
        description: nft.description || '',
        imageUrl: nft.media?.[0]?.gateway || '',
        attributes: nft.metadata?.attributes || [],
        chain: chainId
      }));
      
      totalCount = data.totalCount || nfts.length;
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
        for (const [traitType, values] of Object.entries(attributes)) {
          if (values.length === 0) continue;
          
          const nftAttribute = nft.attributes?.find(attr => attr.trait_type === traitType);
          if (!nftAttribute || !values.includes(nftAttribute.value)) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Apply sorting
    nfts.sort((a, b) => {
      if (sortBy === 'tokenId') {
        const idA = parseInt(a.tokenId, 16) || 0;
        const idB = parseInt(b.tokenId, 16) || 0;
        return sortDirection === 'asc' ? idA - idB : idB - idA;
      } else if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      // Add more sort options as needed
      return 0;
    });
    
    return {
      nfts,
      totalCount,
      pageKey: undefined // Alchemy might return a pageKey for pagination
    };
  } catch (error) {
    console.error(`Error fetching NFTs for collection ${contractAddress}:`, error);
    toast.error("Failed to load collection NFTs");
    return { nfts: [], totalCount: 0 };
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

  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  
  try {
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
    console.error(`Error fetching NFTs for ${address}:`, error);
    toast.error("Failed to load NFTs");
    return { ownedNfts: [], totalCount: 0 };
  }
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
    const popularAddresses = POPULAR_NFT_COLLECTIONS[chainId as keyof typeof POPULAR_NFT_COLLECTIONS] || [];
    
    if (popularAddresses.length === 0) {
      return [];
    }
    
    // Fetch detailed info for each collection
    const collectionPromises = popularAddresses.map(async (collection) => {
      const collectionInfo = await fetchCollectionInfo(collection.address, chainId);
      
      // Add extra details that might be missing from the base fetch
      return {
        ...collectionInfo,
        name: collection.name || collectionInfo.name,
        description: collection.description || collectionInfo.description,
        // For our special CryptoPath collection on BNB Testnet
        ...(collection.address.toLowerCase() === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551' && chainId === '0x61' ? {
          featured: true,
          imageUrl: '/Img/logo/cryptopath.png',
          bannerImageUrl: '/Img/logo/logo4.svg'
        } : {})
      };
    });
    
    const collections = await Promise.all(collectionPromises);
    
    // Cache the results
    collectionsCache.set(cacheKey, collections);
    
    return collections;
  } catch (error) {
    console.error('Error fetching popular collections:', error);
    toast.error("Failed to load popular collections");
    return [];
  }
}

/**
 * Fetch marketplace trading history for an NFT
 */
export async function fetchTradeHistory(
  contractAddress: string,
  tokenId?: string,
  chainId: string = '0x1'
): Promise<any[]> {
  // This would normally connect to a blockchain indexer service
  // For now, return mock data
  
  // Generate realistic mock data based on contract and token
  const now = Date.now();
  const history = [];
  const events = ['Sale', 'Transfer', 'Mint', 'List'];
  const priceBase = tokenId ? 
    (parseInt(tokenId, 16) % 100) / 10 + 0.5 : // Use tokenId to generate a base price
    5 + Math.random() * 15; // Random base price for collection
  
  // Special handling for known collections to make data more realistic
  let isSpecialCollection = false;
  
  if (chainId === '0x1') {
    if (contractAddress.toLowerCase() === '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d') {
      // BAYC
      isSpecialCollection = true;
      const bayc_events = [
        {
          id: '1',
          event: 'Sale',
          price: (75 + Math.random() * 20).toFixed(2),
          timestamp: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
        {
          id: '2',
          event: 'Sale',
          price: (60 + Math.random() * 15).toFixed(2),
          timestamp: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
        {
          id: '3',
          event: 'Mint',
          timestamp: new Date(now - 1000 * 60 * 60 * 24 * 365).toISOString(),
        }
      ];
      
      for (const evt of bayc_events) {
        history.push({
          ...evt,
          tokenId: tokenId || Math.floor(Math.random() * 10000).toString(),
          from: evt.event === 'Mint' ? '0x0000000000000000000000000000000000000000' : `0x${Math.random().toString(16).slice(2, 42)}`,
          to: `0x${Math.random().toString(16).slice(2, 42)}`,
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`
        });
      }
    }
  } else if (chainId === '0x61' && contractAddress.toLowerCase() === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551') {
    // CryptoPath Genesis on BNB Testnet
    isSpecialCollection = true;
    const cryptopath_events = [
      {
        id: '1',
        event: 'Sale',
        price: (12.5 + Math.random() * 5).toFixed(2),
        timestamp: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      },
      {
        id: '2',
        event: 'List',
        price: (10 + Math.random() * 5).toFixed(2),
        timestamp: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
      {
        id: '3',
        event: 'Transfer',
        timestamp: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
      {
        id: '4',
        event: 'Mint',
        timestamp: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
      }
    ];
    
    for (const evt of cryptopath_events) {
      history.push({
        ...evt,
        tokenId: tokenId || Math.floor(Math.random() * 1000).toString(),
        from: evt.event === 'Mint' ? '0x0000000000000000000000000000000000000000' : `0x${Math.random().toString(16).slice(2, 42)}`,
        to: evt.event === 'List' ? '0x0000000000000000000000000000000000000000' : `0x${Math.random().toString(16).slice(2, 42)}`,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`
      });
    }
  }
  
  // Generate generic events if no special collection was matched
  if (!isSpecialCollection) {
    // Create 3-6 random events
    const numEvents = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numEvents; i++) {
      const event = events[Math.floor(Math.random() * events.length)];
      const daysAgo = Math.floor(Math.random() * 180); // Random event up to 6 months ago
      const priceMultiplier = 0.8 + Math.random() * 0.4; // Random price variation
      
      history.push({
        id: i.toString(),
        event,
        tokenId: tokenId || Math.floor(Math.random() * 10000).toString(),
        from: event === 'Mint' ? '0x0000000000000000000000000000000000000000' : `0x${Math.random().toString(16).slice(2, 42)}`,
        to: event === 'List' ? '0x0000000000000000000000000000000000000000' : `0x${Math.random().toString(16).slice(2, 42)}`,
        price: event === 'Sale' || event === 'List' ? (priceBase * priceMultiplier).toFixed(2) : undefined,
        timestamp: new Date(now - 1000 * 60 * 60 * 24 * daysAgo - 1000 * 60 * 60 * Math.random() * 24).toISOString(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`
      });
    }
  }
  
  // Sort by timestamp
  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Fetch price history data for charts
 */
export async function fetchPriceHistory(
  contractAddress: string,
  tokenId?: string,
  chainId: string = '0x1'
): Promise<any[]> {
  // Generate realistic price history data based on real market trends
  const now = Date.now();
  const data = [];
  const days = 90; // 3 months of data
  
  // Determine base price and volatility based on collection
  let basePrice = 1;
  let volatility = 0.05;
  let trend = 0; // Neutral trend by default
  
  // Special handling for known collections
  if (chainId === '0x1') {
    if (contractAddress.toLowerCase() === '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d') {
      // BAYC - high value, high volatility
      basePrice = 70;
      volatility = 0.08;
      trend = 0.001; // Slight uptrend
    } else if (contractAddress.toLowerCase() === '0xed5af388653567af2f388e6224dc7c4b3241c544') {
      // Azuki
      basePrice = 8;
      volatility = 0.06;
      trend = 0.0005;
    } else if (contractAddress.toLowerCase() === '0x60e4d786628fea6478f785a6d7e704777c86a7c6') {
      // MAYC
      basePrice = 10;
      volatility = 0.07;
      trend = 0.0007;
    }
  } else if (chainId === '0x38') {
    if (contractAddress.toLowerCase() === '0x0a8901b0e25deb55a87524f0cc164e9644020eba') {
      // Pancake Squad
      basePrice = 2;
      volatility = 0.04;
      trend = 0.0008; // Stronger uptrend
    }
  } else if (chainId === '0x61' && contractAddress.toLowerCase() === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551') {
    // CryptoPath Genesis
    basePrice = 10;
    volatility = 0.06;
    trend = 0.002; // Strong growth
  } else {
    // Use token ID to influence base price if available
    basePrice = tokenId ? 
      (parseInt(tokenId, 16) % 100) / 10 + 0.5 : // Use tokenId to generate a base price
      1 + Math.random() * 5; // Random base price for collection
  }
  
  // Generate prices with realistic market movements
  let price = basePrice;
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - 1000 * 60 * 60 * 24 * i);
    
    // Apply market factors
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? (Math.random() > 0.5 ? 0.01 : -0.01) : 0; // Weekend volatility
    
    // Market cycle - simulate some cyclical behavior (10-day cycles)
    const cycleFactor = 0.02 * Math.sin(i / 10);
    
    // Apply trend (accumulated over time) + random volatility + cyclical factor + weekend effect
    price = price * (1 + trend + (Math.random() - 0.5) * volatility + cycleFactor + weekendFactor);
    
    // Floor at 10% of base price to avoid unrealistic crashes
    price = Math.max(price, basePrice * 0.1);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: price.toFixed(4)
    });
  }
  
  return data;
}

/**
 * Get all traits and their values for a collection
 */
export async function fetchCollectionTraits(contractAddress: string, chainId: string): Promise<Record<string, string[]>> {
  try {
    // Try to get traits from Alchemy API
    const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
    const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getContractMetadata`;
    const url = new URL(apiUrl);
    url.searchParams.append('contractAddress', contractAddress);
    
    const response = await fetch(url.toString());
    
    if (response.ok) {
      const data = await response.json();
      
      // Check if the data includes attribute data
      if (data.contractMetadata?.openSea?.traits) {
        const traits: Record<string, string[]> = {};
        
        // Parse OpenSea traits format
        for (const [traitType, values] of Object.entries(data.contractMetadata.openSea.traits)) {
          traits[traitType] = Array.isArray(values) ? values : Object.keys(values as object);
        }
        
        return traits;
      }
    }
    
    // Fallback: Fetch a sample of NFTs and extract traits
    const nfts = await fetchCollectionNFTs(contractAddress, chainId, {
      pageSize: 100  // Fetch a larger sample to get more traits
    });
    
    const traits: Record<string, string[]> = {};
    
    // Extract unique traits and values
    nfts.nfts.forEach(nft => {
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          if (!traits[attr.trait_type]) {
            traits[attr.trait_type] = [];
          }
          
          if (!traits[attr.trait_type].includes(attr.value)) {
            traits[attr.trait_type].push(attr.value);
          }
        });
      }
    });
    
    // Sort values for each trait
    for (const traitType in traits) {
      traits[traitType].sort();
    }
    
    return traits;
  } catch (error) {
    console.error('Error fetching collection traits:', error);
    return {};
  }
}

/**
 * Search for NFT collections across supported networks
 */
export async function searchNFTCollections(
  query: string,
  chainIds: string[] = ['0x1', '0x38']
): Promise<CollectionMetadata[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    
    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Search for collections on each chain
    const searchPromises = chainIds.map(async (chainId) => {
      try {
        // Get popular collections for this chain
        const collections = await fetchPopularCollections(chainId);
        
        // Filter collections by search term
        return collections.filter(collection => 
          collection.name.toLowerCase().includes(normalizedQuery) ||
          collection.description.toLowerCase().includes(normalizedQuery) ||
          collection.symbol.toLowerCase().includes(normalizedQuery) ||
          collection.contractAddress.toLowerCase() === normalizedQuery
        );
      } catch (error) {
        console.error(`Error searching collections on chain ${chainId}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(searchPromises);
    
    // Flatten results and sort by relevance
    // For exact contract address matches, put them at the top
    return results.flat().sort((a, b) => {
      // Exact contract address match gets highest priority
      if (a.contractAddress.toLowerCase() === normalizedQuery) return -1;
      if (b.contractAddress.toLowerCase() === normalizedQuery) return 1;
      
      // Exact name match gets second priority
      const aNameMatch = a.name.toLowerCase() === normalizedQuery;
      const bNameMatch = b.name.toLowerCase() === normalizedQuery;
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Otherwise, sort by name
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error searching collections:', error);
    toast.error("Failed to search collections");
    return [];
  }
}

/**
 * Get statistics for a collection (floor price history, volume, etc.)
 */
export async function getCollectionStats(
  contractAddress: string,
  chainId: string,
  period: '1d' | '7d' | '30d' | 'all' = '7d'
): Promise<{
  floorPrice: number;
  volume: number;
  change: number;
  sales: number;
  averagePrice: number;
  owners: number;
  holders: { count: number, percentage: number };
  priceHistory: Array<{ date: string; price: number }>;
}> {
  try {
    // Get price history for the chosen period
    const priceData = await fetchPriceHistory(contractAddress, undefined, chainId);
    
    // Filter data based on period
    const now = new Date();
    const pastDate = new Date();
    
    switch (period) {
      case '1d':
        pastDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        pastDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        pastDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        // No filtering for 'all'
        break;
    }
    
    // Filter and format price history
    const filteredPriceData = period === 'all'
      ? priceData
      : priceData.filter(item => new Date(item.date) >= pastDate);
    
    const priceHistory = filteredPriceData.map(item => ({
      date: item.date,
      price: parseFloat(item.price)
    }));
    
    // Calculate statistics
    const latestPrice = priceHistory.length > 0 
      ? priceHistory[priceHistory.length - 1].price 
      : 0;
    
    const oldestPrice = priceHistory.length > 0 
      ? priceHistory[0].price 
      : latestPrice;
    
    const priceChange = oldestPrice > 0 
      ? ((latestPrice - oldestPrice) / oldestPrice) * 100 
      : 0;
    
    // Get collection info for additional stats
    const collection = await fetchCollectionInfo(contractAddress, chainId);
    
    // Generate realistic mock data
    const totalSupply = parseInt(collection.totalSupply) || 10000;
    const ownersCount = Math.floor(totalSupply * (0.3 + Math.random() * 0.4)); // 30-70% of supply
    const salesCount = Math.floor(ownersCount * (0.1 + Math.random() * 0.4)); // 10-50% of owners
    const volume = salesCount * latestPrice;
    
    return {
      floorPrice: latestPrice,
      volume: volume,
      change: priceChange,
      sales: salesCount,
      averagePrice: volume / salesCount,
      owners: ownersCount,
      holders: {
        count: ownersCount,
        percentage: (ownersCount / totalSupply) * 100
      },
      priceHistory
    };
  } catch (error) {
    console.error("Error fetching collection stats:", error);
    toast.error("Failed to fetch collection statistics");
    
    // Return default values
    return {
      floorPrice: 0,
      volume: 0,
      change: 0,
      sales: 0,
      averagePrice: 0,
      owners: 0,
      holders: { count: 0, percentage: 0 },
      priceHistory: []
    };
  }
}

/**
 * Get detailed NFT metadata with rarity scores
 */
export async function getNFTWithRarityScore(
  contractAddress: string,
  tokenId: string,
  chainId: string
): Promise<NFTMetadata & { rarityScore: number; rarityRank?: number; traitRarity: Record<string, number> }> {
  try {
    // Get the NFT
    const nft = await fetchNFTData(contractAddress, tokenId, chainId);
    
    if (!nft) {
      throw new Error("NFT not found");
    }
    
    // Get all traits for the collection to calculate rarity
    const collectionTraits = await fetchCollectionTraits(contractAddress, chainId);
    
    // Calculate rarity score for each trait
    const traitRarity: Record<string, number> = {};
    let totalRarityScore = 0;
    
    if (nft.attributes && nft.attributes.length > 0) {
      nft.attributes.forEach(attr => {
        if (!collectionTraits[attr.trait_type]) return;
        
        // Calculate trait rarity percentage
        const traitValues = collectionTraits[attr.trait_type];
        const traitOccurrence = traitValues.length > 0 ? 1 / traitValues.length : 0;
        
        // Calculate trait rarity score (rarer = higher score)
        const rarityScore = traitValues.includes(attr.value)
          ? 1 / (traitValues.filter(v => v === attr.value).length / traitValues.length)
          : 10; // Very rare if it's unique
        
        traitRarity[attr.trait_type] = rarityScore;
        totalRarityScore += rarityScore;
      });
    }
    
    // Add missing traits as a rarity factor
    const missingTraits = Object.keys(collectionTraits).filter(
      trait => !nft.attributes?.some(attr => attr.trait_type === trait)
    );
    
    missingTraits.forEach(trait => {
      traitRarity[`missing_${trait}`] = 5; // Missing traits add to rarity
      totalRarityScore += 5;
    });
    
    // Normalize rarity score (0-100 scale)
    const normalizedRarityScore = Math.min(100, totalRarityScore / (Object.keys(collectionTraits).length || 1));
    
    return {
      ...nft,
      rarityScore: normalizedRarityScore,
      traitRarity
    };
  } catch (error) {
    console.error("Error calculating NFT rarity:", error);
    
    // Return the NFT without rarity if available, otherwise rethrow
    const nft = await fetchNFTData(contractAddress, tokenId, chainId);
    if (nft) {
      return {
        ...nft,
        rarityScore: 0,
        traitRarity: {}
      };
    }
    
    throw error;
  }
}

/**
 * Get similar NFTs to a specific NFT
 */
export async function getSimilarNFTs(
  contractAddress: string,
  tokenId: string,
  chainId: string,
  limit: number = 6
): Promise<NFTMetadata[]> {
  try {
    // Get the reference NFT
    const nft = await fetchNFTData(contractAddress, tokenId, chainId);
    
    if (!nft || !nft.attributes) {
      throw new Error("NFT not found or has no attributes");
    }
    
    // Fetch a batch of NFTs from the same collection
    const { nfts } = await fetchCollectionNFTs(contractAddress, chainId, {
      pageSize: 50,
      sortBy: 'tokenId',
      sortDirection: 'asc'
    });
    
    // Filter out the reference NFT
    const otherNFTs = nfts.filter(item => item.tokenId !== tokenId);
    
    // Calculate similarity score for each NFT
    const scoredNFTs = otherNFTs.map(item => {
      if (!item.attributes || !nft.attributes) return { nft: item, score: 0 };
      
      let score = 0;
      
      // Calculate score based on matching attributes
      nft.attributes.forEach(refAttr => {
        const matchingAttr = item.attributes?.find(attr => 
          attr.trait_type === refAttr.trait_type
        );
        
        if (matchingAttr) {
          // Direct match adds more points
          if (matchingAttr.value === refAttr.value) {
            score += 10;
          } else {
            // Same trait type but different value
            score += 2;
          }
        }
      });
      
      return { nft: item, score };
    });
    
    // Sort by similarity score (highest first) and take top 'limit'
    return scoredNFTs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.nft);
  } catch (error) {
    console.error("Error finding similar NFTs:", error);
    return [];
  }
}

/**
 * Get estimated NFT value based on traits and recent sales
 */
export async function estimateNFTValue(
  contractAddress: string,
  tokenId: string,
  chainId: string
): Promise<{ estimatedValue: number; confidenceScore: number; similarSales: any[] }> {
  try {
    // Get NFT with rarity info
    const nftWithRarity = await getNFTWithRarityScore(contractAddress, tokenId, chainId);
    
    // Get collection floor price
    const stats = await getCollectionStats(contractAddress, chainId, '7d');
    
    // Get similar NFTs to compare
    const similarNFTs = await getSimilarNFTs(contractAddress, tokenId, chainId, 10);
    
    // Mock sale data for similar NFTs
    const similarSales = similarNFTs.map(nft => {
      // Generate realistic sale price based on collection floor and rarity
      const rarityFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2 range
      const priceVariance = stats.floorPrice * rarityFactor;
      
      return {
        tokenId: nft.tokenId,
        name: nft.name,
        price: priceVariance.toFixed(3),
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date in last 30 days
      };
    });
    
    // Calculate estimated value based on rarity score and floor price
    const rarityMultiplier = (nftWithRarity.rarityScore / 50) + 0.5; // 0.5-2.5x based on rarity
    let estimatedValue = stats.floorPrice * rarityMultiplier;
    
    // Floor price safeguard
    estimatedValue = Math.max(estimatedValue, stats.floorPrice * 0.8);
    
    // Confidence score based on available data
    const confidenceScore = Math.min(85, 40 + (similarNFTs.length * 5));
    
    return {
      estimatedValue,
      confidenceScore,
      similarSales
    };
  } catch (error) {
    console.error("Error estimating NFT value:", error);
    return {
      estimatedValue: 0,
      confidenceScore: 0,
      similarSales: []
    };
  }
}

/**
 * Enhanced NFT fetching service with caching, pagination and virtualization support
 */
export async function fetchNFTsWithVirtualization(
  contractAddress: string,
  chainId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<{
  nfts: CollectionNFT[],
  totalCount: number,
  hasMore: boolean,
  pageKey?: string
}> {
  // Create a cache key based on all parameters
  const cacheKey = `${contractAddress}-${chainId}-${page}-${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  // Check if we have cached data and it's not expired
  const cachedData = nftCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < cachedData.expires) {
    return {
      nfts: cachedData.data,
      totalCount: cachedData.totalCount,
      hasMore: cachedData.data.length < cachedData.totalCount
    };
  }
  try {
    const response = await fetchCollectionNFTs(contractAddress, chainId, {
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      attributes
    });

    const nftsWithChain = response.nfts.map(nft => ({
      ...nft,
      chain: chainId
    }));
    
    // Store in cache
    nftCache.set(cacheKey, {
      data: nftsWithChain,
      totalCount: response.totalCount,
      timestamp: Date.now(),
      expires: CACHE_TTL
    });
    return {
      nfts: nftsWithChain,
      totalCount: response.totalCount,
      hasMore: response.nfts.length < response.totalCount,
      pageKey: response.pageKey
    };
  } catch (error) {
    console.error('Error fetching NFTs with virtualization:', error);
    toast.error('Failed to load NFTs. Please try again.');
    return { nfts: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Get cursor-based paginated NFTs similar to OpenSea
 */
export async function fetchNFTsWithCursor(
  contractAddress: string,
  chainId: string,
  cursor?: string,
  limit: number = DEFAULT_PAGE_SIZE,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<{
  nfts: any[],
  totalCount: number,
  nextCursor?: string
}> {
  // Calculate the "page" based on cursor if provided
  // This is a simplified approach - in a real app you'd parse the cursor
  const page = cursor ? parseInt(cursor, 10) : 1;
  
  try {
    const response = await fetchCollectionNFTs(contractAddress, chainId, {
      page,
      pageSize: limit,
      sortBy,
      sortDirection,
      searchQuery,
      attributes
    });
    
    // Create a new cursor for the next page
    const nextCursor = response.pageKey || (
      response.nfts.length === limit ? (page + 1).toString() : undefined
    );
    
    return {
      nfts: response.nfts,
      totalCount: response.totalCount,
      nextCursor
    };
  } catch (error) {
    console.error('Error fetching NFTs with cursor:', error);
    toast.error('Failed to load NFTs. Please try again.');
    return { nfts: [], totalCount: 0 };
  }
}

/**
 * Clear all NFT cache data
 */
export function clearNFTCache() {
  nftCache.clear();
  // Also clear advanced cache
  advancedNFTCache.clearAll();
}

/**
 * Clear cache for a specific collection
 */
export function clearCollectionCache(contractAddress: string, chainId: string) {
  const cacheKeyPrefix = `${contractAddress}-${chainId}`;
  
  // Iterate through all keys and delete matching ones
  for (const key of nftCache.keys()) {
    if (key.startsWith(cacheKeyPrefix)) {
      nftCache.delete(key);
    }
  }
}

/**
 * Get NFT indexing status - simulating OpenSea's indexing progress
 */
export async function getNFTIndexingStatus(contractAddress: string, chainId: string): Promise<{
  status: 'completed' | 'in_progress' | 'not_started', 
  progress: number
}> {
  // Simulate different statuses based on contract address
  const lastChar = contractAddress.slice(-1);
  const charCode = lastChar.charCodeAt(0);
  
  if (charCode % 3 === 0) {
    return { status: 'completed', progress: 100 };
  } else if (charCode % 3 === 1) {
    const progress = Math.floor(Math.random() * 90) + 10; // 10-99%
    return { status: 'in_progress', progress };
  } else {
    return { status: 'not_started', progress: 0 };
  }
}

/**
 * Calculate visible range for virtualized rendering
 */
export function calculateVisibleRange(
  scrollTop: number, 
  viewportHeight: number, 
  itemHeight: number, 
  itemCount: number,
  buffer: number = 5 // Number of items to render above/below viewport
): { startIndex: number, endIndex: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer
  );
  
  return { startIndex, endIndex };
}

/**
 * Generate placeholder data for NFTs that are being loaded
 */
export function generatePlaceholderNFTs(count: number, startIndex: number = 0): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${startIndex + i}`,
    tokenId: `${startIndex + i}`,
    name: `Loading...`,
    description: '',
    imageUrl: '',
    isPlaceholder: true,
    attributes: []
  }));
}

// Create a more sophisticated cache system with IndexedDB support
class AdvancedNFTCache {
  private memoryCache: Map<string, {
    data: any[];
    totalCount: number;
    timestamp: number;
    expires: number;
  }> = new Map();
  
  private readonly MEMORY_CACHE_LIMIT = 1000; // Max items to store in memory
  private readonly DB_NAME = 'nft_cache_db';
  private readonly STORE_NAME = 'nfts';
  private dbPromise: Promise<IDBDatabase> | null = null;
  
  constructor() {
    // Initialize IndexedDB for large collections
    this.initDB();
  }
  
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    
    this.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported. Using memory cache only.');
        resolve(null as unknown as IDBDatabase);
        return;
      }
      
      const request = window.indexedDB.open(this.DB_NAME, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'cacheKey' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Failed to open IndexedDB'));
      };
    });
    
    return this.dbPromise;
  }
  
  async get(key: string): Promise<{
    data: any[];
    totalCount: number;
    timestamp: number;
    expires: number;
  } | null> {
    // First check memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) || null;
    }
    
    // Then check IndexedDB for large collections
    try {
      const db = await this.initDB();
      if (!db) return null;
      
      return new Promise((resolve) => {
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && Date.now() - result.timestamp < result.expires) {
            // Cache hit - move to memory for faster access next time
            this.memoryCache.set(key, result);
            this.pruneMemoryCache();
            resolve(result);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn('Error accessing IndexedDB:', error);
      return null;
    }
  }
  
  async set(key: string, value: {
    data: any[];
    totalCount: number;
    timestamp: number;
    expires: number;
  }, isLargeCollection: boolean = false): Promise<void> {
    // Always store in memory cache for fast access
    this.memoryCache.set(key, value);
    this.pruneMemoryCache();
    
    // For large collections, also persist to IndexedDB
    if (isLargeCollection) {
      try {
        const db = await this.initDB();
        if (!db) return;
        
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        store.put({ ...value, cacheKey: key });
      } catch (error) {
        console.warn('Error storing in IndexedDB:', error);
      }
    }
  }
  
  async clearForCollection(collectionId: string, chainId: string): Promise<void> {
    const keyPrefix = `${collectionId}-${chainId}`;
    
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear from IndexedDB
    try {
      const db = await this.initDB();
      if (!db) return;
      
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const range = IDBKeyRange.bound(
        keyPrefix, 
        keyPrefix + '\uffff', // This ensures we get all keys starting with keyPrefix
        false, 
        false
      );
      
      store.delete(range);
    } catch (error) {
      console.warn('Error clearing IndexedDB:', error);
    }
  }
  
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear IndexedDB
    try {
      const db = await this.initDB();
      if (!db) return;
      
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();
    } catch (error) {
      console.warn('Error clearing IndexedDB:', error);
    }
  }
  
  private pruneMemoryCache(): void {
    // Keep memory cache size under control
    if (this.memoryCache.size > this.MEMORY_CACHE_LIMIT) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.MEMORY_CACHE_LIMIT);
      for (const [key] of toDelete) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Create a singleton instance of our advanced cache
const advancedNFTCache = new AdvancedNFTCache();

// Track loading state for collections to avoid duplicate requests
const loadingCollections = new Map<string, Promise<any>>();

/**
 * Enhanced NFT fetching with progressive loading for very large collections
 */
export async function fetchNFTsWithProgressiveLoading(
  contractAddress: string,
  chainId: string,
  options: {
    batchSize?: number;
    maxBatches?: number; // Limit number of batches to avoid excessive loading
    initialPage?: number;
    initialPageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    searchQuery?: string;
    attributes?: Record<string, string[]>;
    onProgress?: (progress: number, total: number) => void;
  } = {}
): Promise<{
  nfts: any[];
  totalCount: number;
  hasMoreBatches: boolean;
  progress: number; // 0-100
}> {
  const {
    batchSize = 100,
    maxBatches = 100, // Limit to 10,000 NFTs by default
    initialPage = 1,
    initialPageSize = 32,
    sortBy = 'tokenId',
    sortDirection = 'asc',
    searchQuery = '',
    attributes = {},
    onProgress
  } = options;
  
  // Determine if this is a large collection (>500 items)
  const isLargeCollection = true; // Assume large until we know otherwise
  
  // Create a cache key for this specific request
  const cacheKeyBase = `${contractAddress}-${chainId}-progressive`;
  const filterKey = `-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  const cacheKey = cacheKeyBase + filterKey;
  
  // Check if we already have cached data
  const cachedData = await advancedNFTCache.get(cacheKey);
  if (cachedData) {
    // Check if cache is fresh enough
    const now = Date.now();
    if (now - cachedData.timestamp < cachedData.expires) {
      return {
        nfts: cachedData.data,
        totalCount: cachedData.totalCount,
        hasMoreBatches: cachedData.data.length < cachedData.totalCount,
        progress: (cachedData.data.length / cachedData.totalCount) * 100
      };
    }
  }
  
  // Check if this collection is already being loaded
  const loadingKey = `${contractAddress}-${chainId}-loading`;
  if (loadingCollections.has(loadingKey)) {
    try {
      await loadingCollections.get(loadingKey);
    } catch (error) {
      console.warn('Previous loading failed:', error);
    }
  }
  
  // Set up loading promise
  const loadingPromise = (async () => {
    try {
      // Start with a small initial batch for fast first render
      const initialBatch = await fetchCollectionNFTs(
        contractAddress,
        chainId,
        {
          page: initialPage,
          pageSize: initialPageSize,
          sortBy,
          sortDirection,
          searchQuery,
          attributes
        }
      );
      
      // Store the initial NFTs
      let allNfts = initialBatch.nfts;
      const totalCount = initialBatch.totalCount;
      
      if (onProgress) {
        onProgress(allNfts.length, totalCount);
      }
      
      // Store in cache even with partial data
      await advancedNFTCache.set(cacheKey, {
        data: allNfts.map(nft => ({ ...nft, chain: chainId })),
        totalCount: totalCount,
        timestamp: Date.now(),
        expires: 10 * 60 * 1000 // 10 minute cache
      }, isLargeCollection);
      
      // Stop if we already have all NFTs or reached the limit
      if (allNfts.length >= totalCount || allNfts.length >= batchSize * maxBatches) {
        return {
          nfts: allNfts,
          totalCount
        };
      }
      
      // Load remaining batches in the background
      const loadRemainingBatches = async () => {
        try {
          let currentPage = 2; // Start from page 2 since we already have page 1
          let continueFetching = true;
          
          while (
            continueFetching && 
            allNfts.length < totalCount && 
            allNfts.length < batchSize * maxBatches
          ) {
            const nextBatch = await fetchCollectionNFTs(
              contractAddress,
              chainId,
              {
                page: currentPage,
                pageSize: batchSize,
                sortBy,
                sortDirection,
                searchQuery,
                attributes
              }
            );
            
            if (nextBatch.nfts.length === 0) {
              continueFetching = false;
            } else {
              // Add new NFTs to our collection
              allNfts = [...allNfts, ...nextBatch.nfts];
              currentPage++;
              
              if (onProgress) {
                onProgress(allNfts.length, totalCount);
              }
              
              // Update cache with each batch
              await advancedNFTCache.set(cacheKey, {
                data: allNfts.map(nft => ({ ...nft, chain: chainId })),
                totalCount: totalCount,
                timestamp: Date.now(),
                expires: 10 * 60 * 1000 // 10 minute cache
              }, isLargeCollection);
            }
          }
        } catch (error) {
          console.error('Error loading remaining batches:', error);
        }
      };
      
      // Start the background loading process without awaiting it
      loadRemainingBatches();
      
      return {
        nfts: allNfts,
        totalCount
      };
    } catch (error) {
      console.error('Error in progressive loading:', error);
      throw error;
    }
  })();
  
  // Store the promise to track loading state
  loadingCollections.set(loadingKey, loadingPromise);
  
  try {
    const result = await loadingPromise;
    
    // Convert NFTs to the expected format with chain ID
    const nftsWithChain = result.nfts.map(nft => ({
      ...nft,
      chain: chainId
    }));
    
    return {
      nfts: nftsWithChain,
      totalCount: result.totalCount,
      hasMoreBatches: nftsWithChain.length < result.totalCount,
      progress: (nftsWithChain.length / result.totalCount) * 100
    };
  } finally {
    // Clean up loading state
    loadingCollections.delete(loadingKey);
  }
}

/**
 * Get cursor-based paginated NFTs with optimized memory handling for large collections
 */
export async function fetchNFTsWithOptimizedCursor(
  contractAddress: string,
  chainId: string,
  cursor?: string,
  limit: number = DEFAULT_PAGE_SIZE,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<{
  nfts: any[],
  totalCount: number,
  nextCursor?: string,
  loadedCount: number,
  progress: number
}> {
  // Create cursor info from the cursor string
  const page = cursor ? parseInt(cursor, 10) : 1;
  const pageOffset = (page - 1) * limit;
  
  // Create a cache key that includes all filter params
  const cacheKey = `${contractAddress}-${chainId}-cursor-${pageOffset}-${limit}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  
  // Check global cache first for this specific page
  const cachedPageData = await advancedNFTCache.get(cacheKey);
  if (cachedPageData && Date.now() - cachedPageData.timestamp < cachedPageData.expires) {
    const nextCursor = pageOffset + limit < cachedPageData.totalCount 
      ? (page + 1).toString() 
      : undefined;
    
    return {
      nfts: cachedPageData.data,
      totalCount: cachedPageData.totalCount,
      nextCursor,
      loadedCount: pageOffset + cachedPageData.data.length,
      progress: Math.min(100, ((pageOffset + cachedPageData.data.length) / cachedPageData.totalCount) * 100)
    };
  }
  
  // Also check if we have a progressive loading cache that contains this page
  const progressiveCacheKey = `${contractAddress}-${chainId}-progressive-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  const progressiveCache = await advancedNFTCache.get(progressiveCacheKey);
  
  if (progressiveCache && Date.now() - progressiveCache.timestamp < progressiveCache.expires) {
    const totalCount = progressiveCache.totalCount;
    
    // Check if the progressive cache contains the data for this page
    if (pageOffset < progressiveCache.data.length) {
      const pageData = progressiveCache.data.slice(pageOffset, pageOffset + limit);
      const nextCursor = pageOffset + limit < totalCount 
        ? (page + 1).toString() 
        : undefined;
      
      // Cache this specific page result too
      await advancedNFTCache.set(cacheKey, {
        data: pageData,
        totalCount,
        timestamp: Date.now(),
        expires: 5 * 60 * 1000 // 5 minute cache for page results
      });
      
      return {
        nfts: pageData,
        totalCount,
        nextCursor,
        loadedCount: Math.min(progressiveCache.data.length, pageOffset + limit),
        progress: Math.min(100, (progressiveCache.data.length / totalCount) * 100)
      };
    }
  }
  
  // If not in cache, fetch from API
  try {
    const response = await fetchCollectionNFTs(
      contractAddress,
      chainId,
      {
        page,
        pageSize: limit,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      }
    );
    
    // Add chain info to each NFT
    const nftsWithChain = response.nfts.map(nft => ({
      ...nft,
      chain: chainId
    }));
    
    // Create the next cursor if there are more items
    const nextCursor = response.nfts.length === limit && pageOffset + limit < response.totalCount
      ? (page + 1).toString()
      : undefined;
    
    // Cache this page result
    await advancedNFTCache.set(cacheKey, {
      data: nftsWithChain,
      totalCount: response.totalCount,
      timestamp: Date.now(),
      expires: 5 * 60 * 1000 // 5 minute cache
    });
    
    return {
      nfts: nftsWithChain,
      totalCount: response.totalCount,
      nextCursor,
      loadedCount: pageOffset + nftsWithChain.length,
      progress: Math.min(100, ((pageOffset + nftsWithChain.length) / response.totalCount) * 100)
    };
  } catch (error) {
    console.error('Error fetching NFTs with optimized cursor:', error);
    toast.error('Failed to load NFTs. Please try again.');
    return { 
      nfts: [], 
      totalCount: 0, 
      loadedCount: 0, 
      progress: 0 
    };
  }
}

/**
 * Clear all NFT cache data
 */
export function clearAllNFTCaches() {
  advancedNFTCache.clearAll();
}

/**
 * Clear cache for a specific collection
 */
export function clearSpecificCollectionCache(contractAddress: string, chainId: string) {
  advancedNFTCache.clearForCollection(contractAddress, chainId);
// No need to redefine clearNFTCache, it's already defined above and will
// call the clearAllNFTCaches function
  clearAllNFTCaches();
}

/**
 * Calculate estimated memory usage for an NFT collection
 */
export function estimateCollectionMemoryUsage(totalNFTs: number): string {
  // Rough estimate: average NFT object is about 2KB
  const estimatedBytes = totalNFTs * 2 * 1024;
  
  if (estimatedBytes < 1024 * 1024) {
    return `${(estimatedBytes / 1024).toFixed(2)} KB`;
  } else if (estimatedBytes < 1024 * 1024 * 1024) {
    return `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(estimatedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Preload critical NFT data
 */
export async function preloadCollectionData(contractAddress: string, chainId: string): Promise<boolean> {
  try {
    // Preload collection metadata
    const metadata = await fetchCollectionInfo(contractAddress, chainId);
    
    // Preload first batch of NFTs
    await fetchNFTsWithOptimizedCursor(
      contractAddress,
      chainId,
      '1', // First page
      32, // Small batch to load quickly
      'tokenId',
      'asc'
    );
    
    return true;
  } catch (error) {
    console.error('Error preloading collection data:', error);
    return false;
  }
}

// Add these enhanced caching functions for optimized pagination

/**
 * Optimized cache for pagination to minimize Alchemy API calls
 */
class PagedNFTCache {
  private static instance: PagedNFTCache;
  private cache: Map<string, {
    data: any[];
    totalCount: number;
    timestamp: number;
    expires: number;
  }> = new Map();
  
  // Longer cache time for pagination to reduce API calls further
  private CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  
  private constructor() {}
  
  public static getInstance(): PagedNFTCache {
    if (!PagedNFTCache.instance) {
      PagedNFTCache.instance = new PagedNFTCache();
    }
    return PagedNFTCache.instance;
  }
  
  public get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.expires) {
      return cached;
    }
    return null;
  }
  
  public set(
    key: string, 
    data: any[], 
    totalCount: number, 
    expires: number = this.CACHE_TTL
  ) {
    this.cache.set(key, {
      data,
      totalCount,
      timestamp: Date.now(),
      expires
    });
  }
  
  public clear(prefix?: string) {
    if (prefix) {
      // Clear only cache entries that start with prefix
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
  
  // Prefetch adjacent pages to improve UX
  public async prefetchAdjacentPages(
    contractAddress: string,
    chainId: string,
    currentPage: number,
    pageSize: number,
    sortBy: string,
    sortDirection: 'asc' | 'desc',
    searchQuery: string = '',
    attributes: Record<string, string[]> = {}
  ) {
    // Only prefetch if we're not already loading/caching that page
    const pagesToPrefetch = [currentPage + 1];
    
    for (const page of pagesToPrefetch) {
      const cacheKey = this.generateCacheKey(
        contractAddress, 
        chainId, 
        page, 
        pageSize, 
        sortBy, 
        sortDirection, 
        searchQuery, 
        attributes
      );
      
      // Only prefetch if not already in cache and page is > 0
      if (!this.get(cacheKey) && page > 0) {
        // Use a low priority flag and setTimeout to not block the main thread
        setTimeout(() => {
          fetchCollectionNFTs(contractAddress, chainId, {
            page,
            pageSize,
            sortBy,
            sortDirection,
            searchQuery,
            attributes
          }).then(result => {
            if (result.nfts.length > 0) {
              this.set(cacheKey, result.nfts, result.totalCount);
            }
          }).catch(err => {
            console.log('Prefetch error (non-critical):', err);
          });
        }, 1000); // Delay prefetch to prioritize current page
      }
    }
  }
  
  public generateCacheKey(
    contractAddress: string,
    chainId: string,
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: 'asc' | 'desc',
    searchQuery: string = '',
    attributes: Record<string, string[]> = {}
  ): string {
    return `${contractAddress.toLowerCase()}-${chainId}-p${page}-s${pageSize}-${sortBy}-${sortDirection}-${searchQuery}-${JSON.stringify(attributes)}`;
  }
}

// Singleton instance
const pagedCache = PagedNFTCache.getInstance();

/**
 * Fetch collection NFTs with optimized pagination to reduce Alchemy API calls
 */
export async function fetchPaginatedNFTs(
  contractAddress: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 20, // Default to 20 for optimal API usage
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<{
  nfts: any[];
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}> {
  // Generate cache key
  const cacheKey = pagedCache.generateCacheKey(
    contractAddress, 
    chainId, 
    page, 
    pageSize, 
    sortBy, 
    sortDirection, 
    searchQuery, 
    attributes
  );
  
  // Check cache first - log cache hits for monitoring
  const cached = pagedCache.get(cacheKey);
  if (cached) {
    console.log(`[API Optimization] Cache hit for ${contractAddress} page ${page}`);
    
    // Only prefetch next page if we're in a stable view (not actively changing pages)
    setTimeout(() => {
      // Start prefetching next page in background
      pagedCache.prefetchAdjacentPages(
        contractAddress, 
        chainId, 
        page, 
        pageSize, 
        sortBy, 
        sortDirection, 
        searchQuery, 
        attributes
      );
    }, 500);
    
    // Ensure totalCount is at least 1 more than current items if we need pagination
    const calculatedTotalCount = Math.max(
      cached.totalCount,
      page * pageSize + (cached.data.length === pageSize ? 1 : 0)
    );
    
    console.log(`[Pagination] Using cached data: Page ${page}, Items: ${cached.data.length}, Total: ${calculatedTotalCount}`);
    
    return {
      nfts: cached.data,
      totalCount: calculatedTotalCount,
      hasNextPage: page * pageSize < calculatedTotalCount,
      hasPrevPage: page > 1
    };
  }
  
  // If not in cache, fetch from API with a small cooldown to prevent rate limiting
  try {
    console.log(`[API Call] Fetching ${contractAddress} page ${page} - reducing API usage`);
    
    // Add a small random delay to prevent rate limiting (50-150ms)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    const result = await fetchCollectionNFTs(
      contractAddress,
      chainId,
      {
        page,
        pageSize,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      }
    );
    
    // Enhance with chain info
    const nftsWithChain = result.nfts.map(nft => ({
      ...nft,
      chain: chainId
    }));
    
    // If this collection is one of the large ones with known pagination issues,
    // ensure we have a reasonable totalCount for pagination
    let calculatedTotalCount = result.totalCount;
    
    // For some collections, ensure we have at least the minimum page count
    const isSpecialCollection = [
      '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
      '0x60e4d786628fea6478f785a6d7e704777c86a7c6', // MAYC
      // Add other collections with pagination issues here
    ].includes(contractAddress.toLowerCase());
    
    if (isSpecialCollection) {
      // Ensure we have at least 100 items for these collections to show pagination
      calculatedTotalCount = Math.max(calculatedTotalCount, 100);
    }
    
    // If we got a full page of results, assume there's at least one more page
    if (nftsWithChain.length === pageSize && calculatedTotalCount <= page * pageSize) {
      calculatedTotalCount = page * pageSize + 1;
    }
    
    console.log(`[Pagination] API data: Page ${page}, Items: ${nftsWithChain.length}, Adjusted Total: ${calculatedTotalCount}`);
    
    // Save to cache with longer TTL for popular collections
    const cacheTTL = isSpecialCollection ? 60 * 60 * 1000 : 30 * 60 * 1000; // 1 hour for popular vs 30 min
    pagedCache.set(cacheKey, nftsWithChain, calculatedTotalCount, cacheTTL);
    
    // Prefetch adjacent pages in background with delay to ensure current page loads first
    setTimeout(() => {
      pagedCache.prefetchAdjacentPages(
        contractAddress, 
        chainId, 
        page, 
        pageSize, 
        sortBy, 
        sortDirection, 
        searchQuery, 
        attributes
      );
    }, 1000);
    
    return {
      nfts: nftsWithChain,
      totalCount: calculatedTotalCount,
      hasNextPage: page * pageSize < calculatedTotalCount,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Error fetching paginated NFTs:', error);
    toast.error('Failed to load NFTs. Please try again.');
    
    return {
      nfts: [],
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: page > 1
    };
  }
}

/**
 * Clear pagination cache for a specific collection or all collections
 */
export function clearPaginationCache(contractAddress?: string, chainId?: string) {
  if (contractAddress && chainId) {
    pagedCache.clear(`${contractAddress.toLowerCase()}-${chainId}`);
  } else {
    pagedCache.clear();
  }
}

/**
 * Throttled API call for collections to avoid rate limiting
 */
const pendingApiCalls = new Map<string, Promise<any>>();

export async function throttledApiCall<T>(
  key: string, 
  apiFunction: () => Promise<T>,
  expiryMs: number = 10000 // Default 10s
): Promise<T> {
  // Check if there's already a pending call for this key
  if (pendingApiCalls.has(key)) {
    return pendingApiCalls.get(key)!;
  }
  
  // Create a new promise for this call
  const promise = new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await apiFunction();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        // Auto-clean the pendingApiCalls map after expiry
        setTimeout(() => {
          pendingApiCalls.delete(key);
        }, expiryMs);
      }
    }, Math.random() * 100); // Small random delay to prevent concurrent calls
  });
  
  // Store the promise in the map
  pendingApiCalls.set(key, promise);
  
  return promise;
}
