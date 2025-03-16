import { toast } from "sonner";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

const CHAIN_ID_TO_NETWORK: Record<string, string> = {
  '0x1': 'eth-mainnet',
  '0x5': 'eth-goerli',
  '0xaa36a7': 'eth-sepolia',
  '0x89': 'polygon-mainnet',
  '0x13881': 'polygon-mumbai',
  '0xa': 'optimism-mainnet',
  '0xa4b1': 'arbitrum-mainnet',
  '0x38': 'bsc-mainnet',
};

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

export async function fetchUserNFTs(address: string, chainId: string, pageKey?: string): Promise<AlchemyNFTResponse> {
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

export async function fetchCollectionInfo(contractAddress: string, chainId: string): Promise<CollectionMetadata> {
  if (!contractAddress) {
    throw new Error("Contract address is required");
  }

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

// Mocked API service for NFT data
// In a real application, this would connect to Alchemy or another provider
export async function fetchPopularCollections(chainId: string): Promise<any[]> {
  // In a production app, this would fetch from Alchemy API
  // For this demo, we'll return mock data
  return [
    {
      id: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
      name: "Bored Ape Yacht Club",
      totalSupply: 10000,
      floorPrice: "30.5",
      imageUrl: "https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000"
    },
    {
      id: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
      name: "Mutant Ape Yacht Club",
      totalSupply: 19423,
      floorPrice: "10.2",
      imageUrl: "https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPF6rLh2D4Xw?auto=format&dpr=1&w=1000"
    },
    {
      id: "0xed5af388653567af2f388e6224dc7c4b3241c544",
      name: "Azuki",
      totalSupply: 10000,
      floorPrice: "8.75",
      imageUrl: "https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&dpr=1&w=1000"
    },
    {
      id: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
      name: "CryptoPunks",
      totalSupply: 10000,
      floorPrice: "54.95",
      imageUrl: "https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?auto=format&dpr=1&w=1000"
    },
    {
      id: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
      name: "Doodles",
      totalSupply: 10000,
      floorPrice: "5.25",
      imageUrl: "https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?auto=format&dpr=1&w=1000"
    },
    {
      id: "0xdf5d4038723f6605a3ecd7776ffe25f3b1be39a0",
      name: "PATH NFT Collection",
      totalSupply: 1000,
      floorPrice: "0.5",
      imageUrl: "/images/path-token.png"
    }
  ];
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
