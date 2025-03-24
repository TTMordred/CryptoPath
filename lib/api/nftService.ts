import { fetchCollectionNFTs, CollectionNFT, CollectionNFTsResponse } from './alchemyNFTApi';
import { getNFTsByContract, transformMoralisNFT } from './moralisApi';
import { toast } from 'sonner';

// Cache response data to avoid excess API calls
type NFTCacheKey = string;
type NFTCacheValue = {
  data: CollectionNFTsResponse;
  timestamp: number;
};

// Cache duration is 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
const nftCache = new Map<NFTCacheKey, NFTCacheValue>();

// API Status tracking to implement circuit breaker pattern
type ApiStatus = {
  name: string;
  available: boolean;
  failureCount: number;
  lastFailure: number;
  cooldownUntil: number;
};

// Circuit breaker configuration
const FAILURE_THRESHOLD = 3;
const COOLDOWN_PERIOD = 60 * 1000; // 1 minute

// Track status of each API
const apiStatus = {
  alchemy: { name: 'Alchemy', available: true, failureCount: 0, lastFailure: 0, cooldownUntil: 0 },
  moralis: { name: 'Moralis', available: true, failureCount: 0, lastFailure: 0, cooldownUntil: 0 }, 
  etherscan: { name: 'Etherscan', available: true, failureCount: 0, lastFailure: 0, cooldownUntil: 0 },
  bscscan: { name: 'BSCScan', available: true, failureCount: 0, lastFailure: 0, cooldownUntil: 0 }
};

/**
 * Register an API failure and potentially trigger circuit breaker
 */
function registerApiFailure(api: keyof typeof apiStatus): void {
  const now = Date.now();
  const status = apiStatus[api];
  
  status.failureCount++;
  status.lastFailure = now;
  
  // Implement circuit breaker pattern
  if (status.failureCount >= FAILURE_THRESHOLD) {
    status.available = false;
    status.cooldownUntil = now + COOLDOWN_PERIOD;
    console.warn(`Circuit breaker triggered for ${api} API. Cooling down until ${new Date(status.cooldownUntil).toLocaleTimeString()}`);
    
    // Schedule auto-recovery
    setTimeout(() => {
      status.available = true;
      status.failureCount = 0;
      console.info(`${api} API circuit breaker reset, service available again`);
    }, COOLDOWN_PERIOD);
  }
}

/**
 * Reset API status after a successful call
 */
function registerApiSuccess(api: keyof typeof apiStatus): void {
  const status = apiStatus[api];
  if (status.failureCount > 0) {
    status.failureCount = 0;
    status.available = true;
  }
}

/**
 * Generate a cache key for a specific NFT collection query
 */
function generateCacheKey(
  contractAddress: string,
  chainId: string,
  page: number,
  pageSize: number,
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  searchQuery: string,
  attributes: Record<string, string[]>
): NFTCacheKey {
  return JSON.stringify({
    contract: contractAddress.toLowerCase(),
    chain: chainId,
    page,
    pageSize,
    sortBy,
    sortDirection,
    searchQuery,
    attributes,
  });
}

/**
 * Multi-API approach to fetch NFTs with fallback mechanisms
 */
async function fetchWithFallbacks(
  contractAddress: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<CollectionNFTsResponse> {
  // BNB Chain specific approach - already using multiple sources
  if (chainId === '0x38' || chainId === '0x61') {
    try {
      // Try Moralis first for BNB Chain
      if (apiStatus.moralis.available) {
        try {
          console.log('Fetching BNB Chain NFTs from Moralis');
          
          // Calculate cursor based on page
          const cursor = undefined;
          if (page > 1) {
            // In a real app, you'd store and pass actual cursors
            // This is a simplified approach
          }
          
          const response = await getNFTsByContract(contractAddress, chainId, cursor, pageSize);
          
          if (response.result && response.result.length > 0) {
            // Transform to our format
            const nfts = response.result.map((nft: any) => transformMoralisNFT(nft, chainId));
            
            // Apply filters
            let filteredNfts = nfts;
            
            // Apply search filter if needed
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              filteredNfts = filteredNfts.filter((nft: CollectionNFT) => 
                nft.name.toLowerCase().includes(query) || 
                nft.tokenId.toLowerCase().includes(query)
              );
            }
            
            // Apply attribute filters if needed
            if (Object.keys(attributes).length > 0) {
              filteredNfts = filteredNfts.filter((nft: CollectionNFT) => {
                for (const [traitType, values] of Object.entries(attributes)) {
                  if (traitType === 'Network') continue; // Skip Network filter
                  
                  const nftAttribute = nft.attributes?.find(attr => attr.trait_type === traitType);
                  if (!nftAttribute || !values.includes(nftAttribute.value)) {
                    return false;
                  }
                }
                return true;
              });
            }
            
            // Apply sorting
            filteredNfts.sort((a: CollectionNFT, b: CollectionNFT) => {
              if (sortBy === 'tokenId') {
                const numA = parseInt(a.tokenId, 10);
                const numB = parseInt(b.tokenId, 10);
                
                if (!isNaN(numA) && !isNaN(numB)) {
                  return sortDirection === 'asc' ? numA - numB : numB - numA;
                }
                
                return sortDirection === 'asc' 
                  ? a.tokenId.localeCompare(b.tokenId)
                  : b.tokenId.localeCompare(a.tokenId);
              } else if (sortBy === 'name') {
                return sortDirection === 'asc' 
                  ? a.name.localeCompare(b.name)
                  : b.name.localeCompare(a.name);
              }
              return 0;
            });
            
            registerApiSuccess('moralis');
            return {
              nfts: filteredNfts,
              totalCount: response.total || filteredNfts.length
            };
          }
        } catch (error) {
          console.warn('Moralis API failed for BNB Chain, falling back to BSCScan:', error);
          registerApiFailure('moralis');
        }
      }
      
      // Fallback to BSCScan
      if (apiStatus.bscscan.available) {
        console.log('Fetching BNB Chain NFTs from BSCScan');
        const result = await fetchCollectionNFTs(
          contractAddress,
          chainId,
          page,
          pageSize,
          sortBy,
          sortDirection,
          searchQuery,
          attributes
        );
        
        registerApiSuccess('bscscan');
        return result;
      }
    } catch (error) {
      console.error('All BNB Chain NFT APIs failed:', error);
      toast.error('Failed to load NFTs. Please try again later.');
      return { nfts: [], totalCount: 0 };
    }
  } 
  // Ethereum networks - try multiple sources
  else if (chainId === '0x1' || chainId === '0xaa36a7') {
    // Try Alchemy first
    if (apiStatus.alchemy.available) {
      try {
        console.log('Fetching Ethereum NFTs from Alchemy');
        const result = await fetchCollectionNFTs(
          contractAddress,
          chainId,
          page,
          pageSize,
          sortBy,
          sortDirection,
          searchQuery,
          attributes
        );
        
        registerApiSuccess('alchemy');
        return result;
      } catch (error) {
        console.warn('Alchemy API failed, trying Moralis next:', error);
        registerApiFailure('alchemy');
      }
    }
    
    // Try Moralis second
    if (apiStatus.moralis.available) {
      try {
        console.log('Fetching Ethereum NFTs from Moralis');
        
        const moralisChainId = chainId === '0x1' ? '0x1' : '0xaa36a7';
        const cursor = undefined;
        
        const response = await getNFTsByContract(contractAddress, moralisChainId, cursor, pageSize);
        
        if (response.result && response.result.length > 0) {
          // Transform to our format
          const nfts = response.result.map((nft: any) => transformMoralisNFT(nft, chainId));
          
          // Apply filters (same as above)
          let filteredNfts = nfts;
          
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredNfts = filteredNfts.filter((nft: CollectionNFT) => 
              nft.name.toLowerCase().includes(query) || 
              nft.tokenId.toLowerCase().includes(query)
            );
          }
          
          if (Object.keys(attributes).length > 0) {
            filteredNfts = filteredNfts.filter((nft: CollectionNFT) => {
              for (const [traitType, values] of Object.entries(attributes)) {
                if (traitType === 'Network') continue;
                
                const nftAttribute = nft.attributes?.find(attr => attr.trait_type === traitType);
                if (!nftAttribute || !values.includes(nftAttribute.value)) {
                  return false;
                }
              }
              return true;
            });
          }
          
          // Apply sorting
          filteredNfts.sort((a: CollectionNFT, b: CollectionNFT) => {
            if (sortBy === 'tokenId') {
              const numA = parseInt(a.tokenId, 10);
              const numB = parseInt(b.tokenId, 10);
              
              if (!isNaN(numA) && !isNaN(numB)) {
                return sortDirection === 'asc' ? numA - numB : numB - numA;
              }
              
              return sortDirection === 'asc' 
                ? a.tokenId.localeCompare(b.tokenId)
                : b.tokenId.localeCompare(a.tokenId);
            } else if (sortBy === 'name') {
              return sortDirection === 'asc' 
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
            }
            return 0;
          });
          
          registerApiSuccess('moralis');
          return {
            nfts: filteredNfts,
            totalCount: response.total || filteredNfts.length
          };
        }
      } catch (error) {
        console.warn('Moralis API failed for Ethereum, trying Etherscan next:', error);
        registerApiFailure('moralis');
      }
    }
    
    // Try Etherscan as last resort
    if (apiStatus.etherscan.available) {
      try {
        console.log('Fetching Ethereum NFTs from Etherscan');
        // Note: Etherscan doesn't have a direct NFT API like Alchemy
        // We would need to implement additional logic here to get NFTs from Etherscan
        // This would likely involve getting token transfer events and reconstructing NFT ownership
        
        // For now, we'll just return a mock response with a notice about API limitations
        registerApiSuccess('etherscan');
        return {
          nfts: [{
            id: `${contractAddress.toLowerCase()}-1`,
            tokenId: '1',
            name: 'API Limit Reached',
            description: 'We\'re experiencing high demand. Please try again later.',
            imageUrl: '/Img/logo/cryptopath.png',
            chain: chainId,
            attributes: []
          }],
          totalCount: 1
        };
      } catch (error) {
        console.error('Etherscan API failed:', error);
        registerApiFailure('etherscan');
      }
    }
  }
  
  // All APIs failed or unsupported chain
  console.error('All NFT APIs failed or unsupported chain');
  return { nfts: [], totalCount: 0 };
}

/**
 * Fetch NFTs with caching to reduce API usage
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
): Promise<CollectionNFTsResponse> {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(
      contractAddress,
      chainId,
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      attributes
    );

    // Check cache first
    const cachedData = nftCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log('Using cached NFT data for', contractAddress);
      return cachedData.data;
    }

    // Implement multi-API approach with fallbacks
    const data = await fetchWithFallbacks(
      contractAddress,
      chainId,
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      attributes
    );

    // Store in cache
    nftCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    console.error('Error fetching paginated NFTs:', error);
    
    // Show user-friendly error
    toast.error('Failed to load NFTs. Please try again later.');
    
    // Return empty data to avoid breaking the UI
    return { nfts: [], totalCount: 0 };
  }
}

/**
 * Clear cache for a specific collection
 */
export function clearCollectionCache(contractAddress: string): void {
  // Delete all entries for this contract address
  for (const key of nftCache.keys()) {
    if (key.includes(contractAddress.toLowerCase())) {
      nftCache.delete(key);
    }
  }
}

/**
 * Clear cache for a specific collection and chain
 */
export function clearPaginationCache(contractAddress: string, chainId: string): void {
  // Create partial key that we can use to match
  const partialKey = JSON.stringify({
    contract: contractAddress.toLowerCase(),
    chain: chainId,
  }).slice(0, -1); // Remove the trailing '}'
  
  // Delete all entries that match the partial key
  for (const key of nftCache.keys()) {
    if (key.includes(partialKey)) {
      nftCache.delete(key);
    }
  }
}
