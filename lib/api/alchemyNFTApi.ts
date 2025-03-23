import { toast } from "sonner";
import axios from 'axios';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '1QGN2GHNEPT6CQP854TVBH24C85714ETC5';

// Simple in-memory cache for BSCScan responses to avoid hitting rate limits
const responseCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 60000; // 1 minute cache TTL

// Queue system for BSCScan API calls to avoid rate limiting
const bscRequestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const REQUEST_DELAY = 250; // ms between requests (4 per second to stay under the 5/sec limit)

// Process the BSCScan request queue
async function processBscRequestQueue() {
  if (isProcessingQueue || bscRequestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    while (bscRequestQueue.length > 0) {
      const request = bscRequestQueue.shift();
      if (request) {
        // Ensure minimum delay between requests
        const now = Date.now();
        const elapsed = now - lastRequestTime;
        if (elapsed < REQUEST_DELAY) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - elapsed));
        }
        
        await request();
        lastRequestTime = Date.now();
      }
    }
  } finally {
    isProcessingQueue = false;
    
    // If new requests were added while processing, start again
    if (bscRequestQueue.length > 0) {
      processBscRequestQueue();
    }
  }
}

// Ensure each BSCScan API call has valid parameters and improve error handling
async function cachedBscScanRequest(params: Record<string, string>, chainId: string, retries = 2): Promise<any> {
  // Validate required parameters
  if (!params.module || !params.action) {
    console.error("Missing required BSCScan API parameters", params);
    throw new Error("BSCScan API request missing required parameters: module and action must be specified");
  }

  const cacheKey = JSON.stringify(params) + chainId;
  const cachedResponse = responseCache.get(cacheKey);
  
  // Return cached response if valid
  if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_TTL) {
    return cachedResponse.data;
  }
  
  // Add request to queue and return a promise
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      const baseUrl = chainId === '0x38' ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api';
      
      try {
        // Add API key to params
        const requestParams = {
          ...params,
          apikey: BSCSCAN_API_KEY
        };
        
        // Debug log the request (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`BSCScan API request: ${baseUrl}`, requestParams);
        }
        
        const response = await axios.get(baseUrl, { params: requestParams });
        const data = response.data;
        
        // Check for rate limit errors
        if (data.status === '0' && data.message === 'NOTOK') {
          console.warn("BSCScan API error:", data.result);
          
          if (data.result.includes('rate limit') && retries > 0) {
            console.warn("BSCScan rate limit hit, retrying after delay...");
            // Wait a bit longer before retrying
            await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay
            
            // Retry with one fewer retry attempt
            const retryResult = await cachedBscScanRequest(params, chainId, retries - 1);
            resolve(retryResult);
            return;
          } else if (data.result.includes('Missing Or invalid')) {
            // Log detailed information about the invalid request
            console.error("Invalid BSCScan API request:", {
              url: baseUrl,
              params: requestParams,
              error: data.result
            });
            reject(new Error(`BSCScan API error: ${data.result}`));
            return;
          }
        }
        
        // Cache the successful response
        responseCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        resolve(data);
      } catch (error) {
        console.error("BSCScan API request failed:", error);
        reject(error);
      }
    };
    
    // Add to queue and start processing
    bscRequestQueue.push(executeRequest);
    processBscRequestQueue();
  });
}

const CHAIN_ID_TO_NETWORK: Record<string, string> = {
  '0x1': 'eth-mainnet',
  '0x5': 'eth-goerli',
  '0xaa36a7': 'eth-sepolia',
  '0x89': 'polygon-mainnet',
  '0x13881': 'polygon-mumbai',
  '0xa': 'optimism-mainnet',
  '0xa4b1': 'arbitrum-mainnet',
  // BNB Chain networks are handled separately with BSCScan
};

// Check if a chain is BNB-based
function isBNBChain(chainId: string): boolean {
  return chainId === '0x38' || chainId === '0x61';
}

interface AlchemyNFTResponse {
  ownedNfts: any[];
  totalCount: number;
  pageKey?: string;
}

interface CollectionMetadata {
  name: string;
  symbol: string;
  totalSupply: string;
  description: string;
  imageUrl: string;
}

// Real Ethereum collections
const mockCollections = [
  {
    id: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    name: 'Bored Ape Yacht Club',
    description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain.',
    imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000',
    bannerImageUrl: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8mhs?auto=format&dpr=1&w=3840',
    floorPrice: '30.5',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Art & Collectibles'
  },
  {
    id: '0x3cd266509d127d0eac42f4474f57d0526804b44e',
    name: 'Buildspace',
    description: 'Buildspace: Build your own DAO with Javascript | Cohort Alkes | #360 - DAOs are taking over. Build one yourself for fun. Maybe it\'s a meme DAO for your friends. Maybe it\'s a DAO that aims to fix climate change. Up to you. We\'ll be going over things like minting a membership NFT, creating/airdropping a token, public treasuries, and governance using a token!',
    imageUrl: 'https://tokens.buildspace.so/assets/CH4f447780-07cf-408a-8f4c-253a8b4e8bae-359/render.mp4',
    bannerImageUrl: 'https://buildspace.so/assets/buildspace-banner.png',
    floorPrice: '0.05',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Education'
  },
  {
    id: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
    name: 'Mutant Ape Yacht Club',
    description: 'The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes that can only be created by exposing an existing Bored Ape to a vial of MUTANT SERUM.',
    imageUrl: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPF6rLh2D4Xw?auto=format&dpr=1&w=1000',
    bannerImageUrl: 'https://i.seadn.io/gae/MPBRMl-Gs1sFZ6Z3uH5IxQKbCXlC2v9VdaI8fzWLOxUV8y-LzWoMzuRkz0HzLSCY0dHEBzplKAAPfMKYr2nanSI6S6yttS4JEU3l?auto=format&dpr=1&w=3840',
    floorPrice: '10.2',
    totalSupply: '19423',
    chain: '0x1',
    verified: true,
    category: 'Art & Collectibles'
  },
  {
    id: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    name: 'Azuki',
    description: 'Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden: a corner of the internet where artists, builders, and web3 enthusiasts meet to create a decentralized future.',
    imageUrl: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&dpr=1&w=1000',
    bannerImageUrl: 'https://i.seadn.io/gae/O0XkiR_Z2--OPa_RA6FhXrR16yBOgIJqSLdHTGA0-LAhyzjSYcb3WEPaCYZHeh19JIUEAUazofVKXcY2qOylWCdoeBN6IfGZLJ3I4A?auto=format&dpr=1&w=3840',
    floorPrice: '8.75',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'PFP'
  },
  {
    id: '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258',
    name: 'Otherdeed for Otherside',
    description: 'Otherdeeds are the key to claiming land in Otherside. Each have a unique blend of environment and sediment – some with resources, some with powerful artifacts.',
    imageUrl: 'https://i.seadn.io/gae/yIm-M5-BpSDdTEIJRt5D6xphizhIdozXjqSITgK4phWq7MmAU3qE7Nw7POGCiPGyhtJ3ZFP8iJ29TFl-RLcGBWX5qI4-ZcnCPcsY4zI?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gae/E_XVuM4_sRYvQpnzGefSfcP3aC5dJeUxNvEDXBT2BiBjOE_MQjmXlUxr8Mt8z9JQjLP8M2sQrC4AXNhUQA18_hOiaejuZI_cM2rARGE?auto=format&dpr=1&w=3840',
    floorPrice: '1.58',
    totalSupply: '100000',
    chain: '0x1',
    verified: true,
    category: 'Virtual Worlds'
  },
  {
    id: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
    name: 'Doodles',
    description: 'A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000.',
    imageUrl: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gae/svc_rQkHVGf3DGmqNBsH6ZKUzNwJqskR5pEh7vGNuBDQiJfb_0r7K5A2JLRRIacHNNsFIR9zX0x67Jw2Jnw4Noag_1pYnkGjOgU?auto=format&dpr=1&w=3840',
    floorPrice: '2.4',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Art & Collectibles'
  }
];

// Real BNB Chain collections
const mockBNBCollections = [
  {
    id: '0x0a8901b0E25DEb55A87524f0cC164E9644020EBA',
    name: 'Pancake Squad',
    description: 'PancakeSwap\'s NFT collection of 10,000 unique bunnies designed to reward loyal community members and bring utility to the CAKE token.',
    imageUrl: 'https://i.seadn.io/s/raw/files/8b1d3939c420d39c8914f68b506c50db.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0xc291cc12018a6fcf423699bce985ded86bac47cb/33406336:about:media:6f541d5a-5309-41ad-8f73-74f092ed1314.png?auto=format&dpr=1&w=1200',
    floorPrice: '2.5',
    totalSupply: '10000',
    chain: '0x38',
    verified: true,
    category: 'Gaming'
  }
];

// CryptoPath ecosystem NFT collection on BNB Testnet
const cryptoPathCollection = {
  id: '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551',
  name: 'CryptoPath Genesis',
  description: 'The official NFT collection of the CryptoPath ecosystem. These limited edition NFTs grant exclusive access to premium features and rewards within the CryptoPath platform.',
  imageUrl: '/Img/logo/cryptopath.png', // Replace with actual image path
  bannerImageUrl: '/Img/logo/logo4.svg', // Replace with actual banner path
  floorPrice: '10.0',
  totalSupply: '1000',
  chain: '0x61', // BNB Testnet
  verified: true,
  category: 'Utility',
  featured: true
};

export async function fetchUserNFTs(address: string, chainId: string, pageKey?: string): Promise<AlchemyNFTResponse> {
  if (!address) {
    throw new Error("Address is required to fetch NFTs");
  }

  // For BNB Chain, use BSCScan API
  if (isBNBChain(chainId)) {
    try {
      const result = await cachedBscScanRequest({
        module: 'account',
        action: 'tokennfttx',
        address: address,
        page: '1',
        offset: '100',
        sort: 'desc'
      }, chainId);
      
      if (result.status === '1' && result.result) {
        // Group transactions by contract address to simulate the Alchemy response format
        const groupedByContract: Record<string, any[]> = {};
        
        for (const tx of result.result) {
          if (!groupedByContract[tx.contractAddress]) {
            groupedByContract[tx.contractAddress] = [];
          }
          groupedByContract[tx.contractAddress].push(tx);
        }
        
        // Convert to Alchemy-like format for compatibility
        const ownedNfts = Object.entries(groupedByContract).map(([contractAddress, transactions]) => {
          // Filter for NFTs the user still owns (received but not sent)
          const ownedTokenIds = new Set<string>();
          
          // Track all token IDs user has received
          transactions.forEach(tx => {
            if (tx.to.toLowerCase() === address.toLowerCase()) {
              ownedTokenIds.add(tx.tokenID);
            }
          });
          
          // Remove tokens that were sent away
          transactions.forEach(tx => {
            if (tx.from.toLowerCase() === address.toLowerCase()) {
              ownedTokenIds.delete(tx.tokenID);
            }
          });
          
          // Take the first transaction to get NFT details
          const firstTx = transactions[0];
          
          return {
            contract: {
              address: contractAddress,
              name: firstTx.tokenName || 'Unknown',
              symbol: firstTx.tokenSymbol || '',
            },
            id: { 
              tokenId: Array.from(ownedTokenIds)[0] || '0',
            },
            balance: ownedTokenIds.size.toString(),
            media: [{ gateway: '' }],
            tokenUri: { gateway: '', raw: '' }
          };
        });
        
        return {
          ownedNfts: ownedNfts.filter(nft => nft.balance !== '0'),
          totalCount: ownedNfts.length
        };
      }
      
      return { ownedNfts: [], totalCount: 0 };
    } catch (error) {
      console.error(`Error fetching NFTs from BSCScan for ${address}:`, error);
      toast.error("Failed to load NFTs from BSCScan");
      return { ownedNfts: [], totalCount: 0 };
    }
  }

  // For non-BNB chains, continue using Alchemy
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

export async function fetchCollectionInfo(contractAddress: string, chainId: string): Promise<CollectionMetadata> {
  if (!contractAddress) {
    throw new Error("Contract address is required");
  }

  // For BNB Chain networks, use BSCScan API
  if (isBNBChain(chainId)) {
    try {
      // First try to get contract ABI to extract more info
      const abiResult = await cachedBscScanRequest({
        module: 'contract',
        action: 'getabi',
        address: contractAddress
      }, chainId);
      
      // Default values
      let name = 'Unknown Collection';
      let symbol = '';
      let totalSupply = '0';
      const description = '';
      const imageUrl = '';
      
      // Try to use the mock data if available for better UX
      if (chainId === '0x38') {
        const mockCollection = mockBNBCollections.find(c => 
          c.id.toLowerCase() === contractAddress.toLowerCase()
        );
        
        if (mockCollection) {
          return {
            name: mockCollection.name,
            symbol: '',
            totalSupply: mockCollection.totalSupply,
            description: mockCollection.description,
            imageUrl: mockCollection.imageUrl
          };
        }
      } else if (chainId === '0x61' && contractAddress.toLowerCase() === '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551'.toLowerCase()) {
        // Use CryptoPath collection info for testnet
        return {
          name: cryptoPathCollection.name,
          symbol: 'CP',
          totalSupply: cryptoPathCollection.totalSupply,
          description: cryptoPathCollection.description,
          imageUrl: cryptoPathCollection.imageUrl
        };
      }
      
      // If we have valid ABI, try to extract info
      if (abiResult.status === '1' && abiResult.result) {
        try {
          // Get token name
          const nameResult = await cachedBscScanRequest({
            module: 'contract',
            action: 'readcontract',
            address: contractAddress,
            contractaddress: contractAddress,
            function: 'name()'
          }, chainId);
          
          if (nameResult.status === '1' && nameResult.result) {
            name = nameResult.result;
          }
          
          // Get token symbol
          const symbolResult = await cachedBscScanRequest({
            module: 'contract',
            action: 'readcontract',
            address: contractAddress,
            contractaddress: contractAddress,
            function: 'symbol()'
          }, chainId);
          
          if (symbolResult.status === '1' && symbolResult.result) {
            symbol = symbolResult.result;
          }
          
          // Get total supply
          const supplyResult = await cachedBscScanRequest({
            module: 'contract',
            action: 'readcontract',
            address: contractAddress,
            contractaddress: contractAddress,
            function: 'totalSupply()'
          }, chainId);
          
          if (supplyResult.status === '1' && supplyResult.result) {
            totalSupply = supplyResult.result;
          }
        } catch (error) {
          console.error("Error reading contract functions:", error);
        }
      }
      
      // If we still don't have a name, try to get token info
      if (name === 'Unknown Collection') {
        try {
          // Get token info
          const tokenInfoResult = await cachedBscScanRequest({
            module: 'token',
            action: 'tokeninfo',
            contractaddress: contractAddress,
          }, chainId);
          
          if (tokenInfoResult.status === '1' && tokenInfoResult.result?.[0]) {
            const info = tokenInfoResult.result[0];
            name = info.name || name;
            symbol = info.symbol || symbol;
            totalSupply = info.totalSupply || totalSupply;
          }
        } catch (error) {
          console.error("Error getting token info:", error);
        }
      }
      
      return {
        name,
        symbol,
        totalSupply,
        description,
        imageUrl
      };
    } catch (error) {
      console.error(`Error fetching collection info for ${contractAddress} from BSCScan:`, error);
      toast.error("Failed to load collection info from BSCScan");
      return {
        name: 'Unknown Collection',
        symbol: '',
        totalSupply: '0',
        description: '',
        imageUrl: '',
      };
    }
  }

  // For non-BNB chains, continue using Alchemy
  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  
  try {
    const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getContractMetadata`;
    const url = new URL(apiUrl);
    url.searchParams.append('contractAddress', contractAddress);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    return {
      name: data.contractMetadata.name || 'Unknown Collection',
      symbol: data.contractMetadata.symbol || '',
      totalSupply: data.contractMetadata.totalSupply || '0',
      description: data.contractMetadata.openSea?.description || '',
      imageUrl: data.contractMetadata.openSea?.imageUrl || '',
    };
  } catch (error) {
    console.error(`Error fetching collection info for ${contractAddress}:`, error);
    toast.error("Failed to load collection info");
    return {
      name: 'Unknown Collection',
      symbol: '',
      totalSupply: '0',
      description: '',
      imageUrl: '',
    };
  }
}

interface NFTItem {
  id: {
    tokenId: string;
  };
  title?: string;
  description?: string;
  media?: Array<{gateway?: string}>;
  metadata?: {
    attributes?: Array<{trait_type: string, value: string}>
  };
}

interface CollectionNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface CollectionNFTsResponse {
  nfts: CollectionNFT[];
  totalCount: number;
  pageKey?: string;
}

export async function fetchCollectionNFTs(
  contractAddress: string, 
  chainId: string,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<CollectionNFTsResponse> {
  if (!contractAddress) {
    throw new Error("Contract address is required");
  }
  
  // For BNB Chain networks, use BSCScan API
  if (isBNBChain(chainId)) {
    try {
      // Get NFT transactions for the contract - this is the most reliable way to get all token IDs
      const result = await cachedBscScanRequest({
        module: 'token',
        action: 'tokennfttx',
        contractaddress: contractAddress,
        page: '1',
        offset: String(pageSize * 2), // Request more to account for transfers
        sort: sortDirection === 'asc' ? 'asc' : 'desc'
      }, chainId);
      
      if (result.status === '1' && result.result) {
        // Extract unique token IDs
        const uniqueTokenIds = [...new Set(result.result
          .map((tx: any) => tx.tokenID)
          .filter((id: string) => id && id.length > 0)
        )];
        
        // Sort token IDs numerically if possible, otherwise as strings
        const sortedTokenIds = uniqueTokenIds.sort((a, b) => {
          const numA = parseInt(a as string, 10);
          const numB = parseInt(b as string, 10);
          
          if (!isNaN(numA) && !isNaN(numB)) {
            return sortDirection === 'asc' ? numA - numB : numB - numA;
          }
          
          return sortDirection === 'asc' 
            ? (a as string).localeCompare(b as string)
            : (b as string).localeCompare(a as string);
        });
        
        // Apply pagination
        const startIdx = (page - 1) * pageSize;
        const paginatedTokenIds = sortedTokenIds.slice(startIdx, startIdx + pageSize);
        
        // Apply search filter if needed
        const filteredTokenIds = searchQuery 
          ? paginatedTokenIds.filter(id => String(id).includes(searchQuery))
          : paginatedTokenIds;
        
        // Fetch metadata for each token with proper rate limiting
        const nfts: CollectionNFT[] = [];
        
        // Try to get the contract's baseURI first to optimize requests
        let baseURI = '';
        try {
          // Use contract's baseURI function if available
          const baseURIResult = await cachedBscScanRequest({
            module: 'contract',
            action: 'readcontract',
            address: contractAddress,
            contractaddress: contractAddress,
            function: 'baseURI()'
          }, chainId);
          
          if (baseURIResult.status === '1' && baseURIResult.result) {
            baseURI = baseURIResult.result;
          }
        } catch (error) {
          console.warn("Could not get baseURI, will try individual tokenURI calls:", error);
        }
        
        // Process tokens one at a time to avoid overloading the API
        for (const tokenId of filteredTokenIds) {
          try {
            // Default fallback NFT in case metadata can't be fetched
            const fallbackNft: CollectionNFT = {
              id: `${contractAddress.toLowerCase()}-${tokenId}`,
              tokenId: String(tokenId),
              name: `NFT #${tokenId}`,
              description: 'Metadata unavailable',
              imageUrl: '',
              attributes: []
            };
            
            // Get token URI - use contract call with the tokenURI function
            let uri = '';
            try {
              // Use contract's tokenURI function directly
              const tokenURIResult = await cachedBscScanRequest({
                module: 'contract',
                action: 'readcontract',
                address: contractAddress,
                contractaddress: contractAddress,
                function: `tokenURI(${tokenId})`
              }, chainId);
              
              if (tokenURIResult.status === '1' && tokenURIResult.result) {
                uri = tokenURIResult.result;
              } else if (baseURI) {
                // If we have baseURI but tokenURI call failed, try to construct the URI
                uri = baseURI.endsWith('/') ? `${baseURI}${tokenId}` : `${baseURI}/${tokenId}`;
              }
              
              if (!uri) {
                // If we still don't have a URI, add the fallback NFT
                nfts.push(fallbackNft);
                continue;
              }
              
              // Process the URI to get metadata
              try {
                // Resolve various URI formats (IPFS, HTTP, etc.)
                let resolvedUri = uri;
                
                if (uri.startsWith('ipfs://')) {
                  resolvedUri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
                } else if (!uri.startsWith('http')) {
                  // Some contracts return baseURI + tokenId
                  if (uri.endsWith('/')) {
                    resolvedUri = `${uri}${tokenId}`;
                  } else {
                    resolvedUri = `${uri}/${tokenId}`;
                  }
                }
                
                // Fetch metadata with timeout to avoid hanging
                const metadataResponse = await axios.get(resolvedUri, { 
                  timeout: 5000,
                  // Some IPFS gateways may return HTML error pages without proper status code
                  validateStatus: (status) => status < 400
                });
                
                if (!metadataResponse.data) {
                  nfts.push(fallbackNft);
                  continue;
                }
                
                const metadata = metadataResponse.data;
                
                // Resolve image URL, handle IPFS and other formats
                let imageUrl = '';
                if (typeof metadata.image === 'string') {
                  imageUrl = metadata.image.startsWith('ipfs://')
                    ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                    : metadata.image;
                }
                
                // Create NFT object from metadata
                const nft: CollectionNFT = {
                  id: `${contractAddress.toLowerCase()}-${tokenId}`,
                  tokenId: String(tokenId),
                  name: metadata.name || `NFT #${tokenId}`,
                  description: metadata.description || '',
                  imageUrl,
                  attributes: Array.isArray(metadata.attributes) ? metadata.attributes : []
                };
                
                // Apply attribute filters if needed
                let includeNft = true;
                
                if (Object.keys(attributes).length > 0) {
                  for (const [traitType, values] of Object.entries(attributes)) {
                    if (traitType === 'Network') continue; // Skip the Network filter we added
                    
                    const nftAttribute = nft.attributes.find(attr => attr.trait_type === traitType);
                    if (!nftAttribute || !values.includes(nftAttribute.value)) {
                      includeNft = false;
                      break;
                    }
                  }
                }
                
                if (includeNft) {
                  nfts.push(nft);
                }
              } catch (metadataError) {
                console.warn(`Error fetching metadata for token ${tokenId}:`, metadataError);
                nfts.push(fallbackNft);
              }
            } catch (uriError) {
              console.warn(`Error fetching token URI for token ${tokenId}:`, uriError);
              
              // If we're on testnet, generate mock data for demo purposes
              if (chainId === '0x61' && contractAddress.toLowerCase() === '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551'.toLowerCase()) {
                // For our demo CryptoPath collection, generate mock data
                const mockNft = generateMockNFT(String(tokenId), contractAddress, chainId);
                nfts.push(mockNft);
              } else {
                nfts.push(fallbackNft);
              }
            }
          } catch (tokenError) {
            console.error(`Error processing token ${tokenId}:`, tokenError);
          }
          
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Apply final sorting to the results based on user's sort preference
        nfts.sort((a, b) => {
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
        
        return {
          nfts,
          totalCount: uniqueTokenIds.length
        };
      }
      
      // If we didn't get valid result from BSCScan
      return { nfts: [], totalCount: 0 };
    } catch (error) {
      console.error(`Error fetching NFTs for collection ${contractAddress} from BSCScan:`, error);
      toast.error("Failed to load collection NFTs from BSCScan");
      return { nfts: [], totalCount: 0 };
    }
  }
  
  // For non-BNB chains, continue using Alchemy
  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  
  try {
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
    
    // Process NFTs
    let nfts = data.nfts.map((nft: NFTItem) => ({
      id: `${contractAddress}-${nft.id.tokenId || ''}`,
      tokenId: nft.id.tokenId || '',
      name: nft.title || `NFT #${parseInt(nft.id.tokenId || '0', 16).toString()}`,
      description: nft.description || '',
      imageUrl: nft.media?.[0]?.gateway || '',
      attributes: nft.metadata?.attributes || [],
    }));
    
    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nfts = nfts.filter((nft: CollectionNFT) => 
        nft.name.toLowerCase().includes(query) || 
        nft.tokenId.toLowerCase().includes(query)
      );
    }
    
    // Apply attribute filters
    if (Object.keys(attributes).length > 0) {
      nfts = nfts.filter((nft: CollectionNFT) => {
        for (const [traitType, values] of Object.entries(attributes)) {
          const nftAttribute = nft.attributes.find((attr: {trait_type: string, value: string}) => attr.trait_type === traitType);
          if (!nftAttribute || !values.includes(nftAttribute.value)) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Apply sorting
    nfts.sort((a: CollectionNFT, b: CollectionNFT) => {
      if (sortBy === 'tokenId') {
        const idA = parseInt(a.tokenId, 16) || 0;
        const idB = parseInt(b.tokenId, 16) || 0;
        return sortDirection === 'asc' ? idA - idB : idB - idA;
      } else if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });

    return {
      nfts: nfts,
      totalCount: data.totalCount || nfts.length,
      pageKey: data.pageKey
    };
  } catch (error) {
    console.error(`Error fetching NFTs for collection ${contractAddress}:`, error);
    toast.error("Failed to load collection NFTs");
    return { nfts: [], totalCount: 0 };
  }
}

// Helper function to generate mock NFT data for testing
function generateMockNFT(tokenId: string, contractAddress: string, chainId: string): CollectionNFT {
  // Generate predictable but random-looking attributes based on tokenId
  const tokenNum = parseInt(tokenId as string, 10);
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
  
  return {
    id: `${contractAddress.toLowerCase()}-${tokenId}`,
    tokenId: String(tokenId),
    name: `CryptoPath #${tokenId}`,
    description: `A unique NFT from the CryptoPath Genesis Collection with ${rarities[rarityIndex]} rarity.`,
    imageUrl: `/Img/nft/sample-${(seed % 5) + 1}.jpg`, // Using sample images 1-5
    attributes: [
      { trait_type: 'Background', value: backgrounds[backgroundIndex] },
      { trait_type: 'Species', value: species[speciesIndex] },
      { trait_type: 'Rarity', value: rarities[rarityIndex] },
      // Network attribute for filtering
      { trait_type: 'Network', value: chainId === '0x1' ? 'Ethereum' : 
                               chainId === '0xaa36a7' ? 'Sepolia' :
                               chainId === '0x38' ? 'BNB Chain' : 'BNB Testnet' }
    ]
  };
}

// Mocked API service for NFT data
// In a real application, this would connect to Alchemy or another provider
export async function fetchPopularCollections(chainId: string): Promise<any[]> {
  try {
    // For BNB Testnet, include our ecosystem collection first
    if (chainId === '0x61') {
      return [cryptoPathCollection, ...mockBNBCollections.map(collection => ({
        ...collection,
        chain: chainId
      }))];
    }
    
    // For BNB Chain mainnet
    if (chainId === '0x38') {
      return mockBNBCollections.map(collection => ({
        ...collection,
        chain: chainId
      }));
    }
    
    // For Ethereum and Sepolia
    return mockCollections.map(collection => ({
      ...collection,
        chain: chainId
    }));
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

// Function to fetch marketplace trading history 
export async function fetchTradeHistory(tokenId?: string): Promise<any[]> {
  // This would normally connect to a blockchain indexer service
  // For now, we'll return mock data
  return [
    {
      id: '1',
      event: 'Sale',
      tokenId: tokenId || '123',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      price: '120.5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      txHash: '0xabc123def456'
    },
    {
      id: '2',
      event: 'Transfer',
      tokenId: tokenId || '123',
      from: '0xabcdef1234567890abcdef1234567890abcdef12',
      to: '0x9876543210abcdef1234567890abcdef12345678',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      txHash: '0xdef456abc789'
    },
    {
      id: '3',
      event: 'Mint',
      tokenId: tokenId || '123',
      from: '0x0000000000000000000000000000000000000000',
      to: '0x1234567890abcdef1234567890abcdef12345678',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      txHash: '0x789abc123def'
    },
    {
      id: '4',
      event: 'List',
      tokenId: tokenId || '123',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0x0000000000000000000000000000000000000000',
      price: '100',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      txHash: '0x456def789abc'
    }
  ];
}

// Function to fetch price history data for charts
export async function fetchPriceHistory(tokenId?: string): Promise<any[]> {
  // This would normally fetch real historical price data
  // For now, generate some mock data
  const now = Date.now();
  const data = [];
  
  // Generate 30 days of price data
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - 1000 * 60 * 60 * 24 * i);
    const basePrice = tokenId ? 100 : 120; // Different base for collection vs single NFT
    const randomFactor = 0.3 * Math.sin(i / 2) + 0.2 * Math.cos(i);
    const volatility = 0.1;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: basePrice * (1 + randomFactor + volatility * (Math.random() - 0.5))
    });
  }
  
  return data;
}
