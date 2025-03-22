import { ethers } from 'ethers';
import { getChainProvider } from './chainProviders';
import { toast } from "sonner";

// Standard ABI for ERC-721 tokens
const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

// Standard ABI for ERC-1155 tokens
const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function uri(uint256 id) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

// Simplified interface for NFTs
export interface NFTMetadata {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  imageUrl: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  chain: string;
}

/**
 * Get an ethers contract instance for an NFT contract
 */
export function getNFTContract(
  contractAddress: string, 
  provider: ethers.providers.Provider,
  isERC1155: boolean = false
) {
  try {
    return new ethers.Contract(
      contractAddress,
      isERC1155 ? ERC1155_ABI : ERC721_ABI,
      provider
    );
  } catch (error) {
    console.error("Error creating NFT contract instance:", error);
    throw new Error("Failed to initialize NFT contract");
  }
}

/**
 * Check if a contract implements ERC-721 or ERC-1155
 */
export async function detectNFTStandard(contractAddress: string, chainId: string): Promise<'ERC721' | 'ERC1155' | 'UNKNOWN'> {
  try {
    const provider = getChainProvider(chainId);
    
    // Create an interface to test for ERC-165 supportsInterface function
    const erc165Interface = new ethers.utils.Interface([
      "function supportsInterface(bytes4 interfaceId) view returns (bool)"
    ]);
    
    const contract = new ethers.Contract(contractAddress, erc165Interface, provider);
    
    // Interface IDs
    const ERC721_INTERFACE_ID = '0x80ac58cd';
    const ERC1155_INTERFACE_ID = '0xd9b67a26';
    
    try {
      const isERC721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
      if (isERC721) return 'ERC721';
      
      const isERC1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
      if (isERC1155) return 'ERC1155';
      
      return 'UNKNOWN';
    } catch (err) {
      // Many older NFTs don't implement supportsInterface
      // Try to call an ERC721 function to see if it works
      try {
        const erc721Contract = new ethers.Contract(contractAddress, ['function name() view returns (string)'], provider);
        await erc721Contract.name();
        return 'ERC721';
      } catch {
        return 'UNKNOWN';
      }
    }
  } catch (error) {
    console.error("Error detecting NFT standard:", error);
    return 'UNKNOWN';
  }
}

/**
 * Get the collection info for an NFT contract
 */
export async function fetchContractCollectionInfo(contractAddress: string, chainId: string) {
  try {
    const provider = getChainProvider(chainId);
    const nftStandard = await detectNFTStandard(contractAddress, chainId);
    
    if (nftStandard === 'UNKNOWN') {
      throw new Error('Contract does not appear to be an NFT collection');
    }
    
    const contract = getNFTContract(contractAddress, provider, nftStandard === 'ERC1155');
    
    // Basic collection info
    let name, symbol, totalSupply;
    
    try {
      name = await contract.name();
    } catch (err) {
      name = 'Unknown Collection';
    }
    
    try {
      symbol = await contract.symbol();
    } catch (err) {
      symbol = '';
    }
    
    try {
      if (nftStandard === 'ERC721') {
        totalSupply = await contract.totalSupply();
        totalSupply = totalSupply.toString();
      } else {
        totalSupply = 'N/A'; // ERC1155 doesn't have a standard totalSupply
      }
    } catch (err) {
      totalSupply = 'Unknown';
    }
    
    return {
      name,
      symbol,
      totalSupply,
      contractAddress,
      chain: chainId,
      standard: nftStandard
    };
  } catch (error) {
    console.error("Error fetching collection info:", error);
    toast.error("Failed to fetch collection information");
    return {
      name: 'Unknown Collection',
      symbol: '',
      totalSupply: 'Unknown',
      contractAddress,
      chain: chainId
    };
  }
}

/**
 * Fetch a single NFT from a contract
 */
export async function fetchNFTData(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata | null> {
  try {
    const provider = getChainProvider(chainId);
    const nftStandard = await detectNFTStandard(contractAddress, chainId);
    
    if (nftStandard === 'UNKNOWN') {
      throw new Error('Contract does not appear to be an NFT collection');
    }
    
    const contract = getNFTContract(contractAddress, provider, nftStandard === 'ERC1155');
    
    // Get token metadata URI
    let tokenURI;
    try {
      tokenURI = nftStandard === 'ERC721' 
        ? await contract.tokenURI(tokenId)
        : await contract.uri(tokenId);
      
      // Some contracts return the base URI and require appending the token ID
      if (tokenURI.includes('{id}')) {
        const hexTokenId = ethers.utils.hexZeroPad(ethers.utils.hexlify(tokenId), 32).slice(2);
        tokenURI = tokenURI.replace('{id}', hexTokenId);
      }
    } catch (err) {
      console.error("Error fetching token URI:", err);
      return null;
    }
    
    // Resolve IPFS or HTTP URLs
    const metadata = await fetchMetadata(tokenURI);
    
    if (!metadata) {
      return null;
    }
    
    // Format the NFT data
    return {
      id: `${contractAddress.toLowerCase()}-${tokenId}`,
      tokenId,
      name: metadata.name || `Token #${tokenId}`,
      description: metadata.description || '',
      imageUrl: resolveContentUrl(metadata.image || metadata.image_url || ''),
      attributes: metadata.attributes || [],
      chain: chainId
    };
  } catch (error) {
    console.error("Error fetching NFT data:", error);
    toast.error("Failed to fetch NFT data");
    return null;
  }
}

/**
 * Fetch the metadata from a token URI
 */
export async function fetchMetadata(tokenURI: string): Promise<any> {
  try {
    // Handle IPFS URIs
    const resolvedUrl = resolveContentUrl(tokenURI);
    
    const response = await fetch(resolvedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

/**
 * Resolve content URIs (IPFS, etc.) to HTTP URLs
 */
export function resolveContentUrl(uri: string): string {
  if (!uri) return '';
  
  // Handle IPFS URIs
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  
  // Handle Arweave URIs
  if (uri.startsWith('ar://')) {
    return `https://arweave.net/${uri.slice(5)}`;
  }
  
  // Handle relative URLs
  if (uri.startsWith('/')) {
    // Need the base URI to resolve relative URLs properly
    return uri;
  }
  
  return uri;
}

/**
 * Fetch a batch of NFTs for a collection
 */
export async function fetchContractNFTs(
  contractAddress: string, 
  chainId: string, 
  startIndex: number = 0, 
  count: number = 20
): Promise<NFTMetadata[]> {
  try {
    const provider = getChainProvider(chainId);
    const nftStandard = await detectNFTStandard(contractAddress, chainId);
    
    if (nftStandard === 'UNKNOWN') {
      throw new Error('Contract does not appear to be an NFT collection');
    }
    
    if (nftStandard === 'ERC1155') {
      // For ERC1155, we need a different approach since there's no simple enumeration
      // We'd need to rely on events, external APIs, or known token IDs
      throw new Error('Batch fetching for ERC1155 not implemented');
    }
    
    const contract = getNFTContract(contractAddress, provider);
    
    // For ERC721
    try {
      // Check if the contract supports enumeration
      const supportsEnumeration = await contract.supportsInterface('0x780e9d63');
      
      if (!supportsEnumeration) {
        throw new Error('Contract does not support enumeration');
      }
      
      const totalSupply = await contract.totalSupply();
      
      // Make sure we don't try to fetch beyond the total supply
      const endIndex = Math.min(startIndex + count, totalSupply.toNumber());
      
      // Fetch token IDs
      const fetchPromises = [];
      for (let i = startIndex; i < endIndex; i++) {
        fetchPromises.push(contract.tokenByIndex(i));
      }
      
      const tokenIds = await Promise.all(fetchPromises);
      
      // Fetch metadata for each token
      const nftPromises = tokenIds.map(tokenId => 
        fetchNFTData(contractAddress, tokenId.toString(), chainId)
      );
      
      const nfts = await Promise.all(nftPromises);
      
      // Filter out null results
      return nfts.filter(nft => nft !== null) as NFTMetadata[];
    } catch (err) {
      console.error("Error enumerating NFTs:", err);
      throw new Error('Failed to enumerate NFTs');
    }
  } catch (error) {
    console.error("Error batch fetching NFTs:", error);
    toast.error("Failed to fetch NFTs from contract");
    return [];
  }
}

/**
 * Check if an address owns a specific NFT
 */
export async function checkNFTOwnership(
  contractAddress: string,
  tokenId: string,
  ownerAddress: string,
  chainId: string
): Promise<boolean> {
  try {
    const provider = getChainProvider(chainId);
    const nftStandard = await detectNFTStandard(contractAddress, chainId);
    
    if (nftStandard === 'UNKNOWN') {
      return false;
    }
    
    const contract = getNFTContract(contractAddress, provider, nftStandard === 'ERC1155');
    
    if (nftStandard === 'ERC721') {
      try {
        const currentOwner = await contract.ownerOf(tokenId);
        return currentOwner.toLowerCase() === ownerAddress.toLowerCase();
      } catch {
        return false;
      }
    } else if (nftStandard === 'ERC1155') {
      try {
        const balance = await contract.balanceOf(ownerAddress, tokenId);
        return balance.gt(0);
      } catch {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return false;
  }
}

/**
 * Fetch all NFTs owned by an address for a specific contract
 */
export async function fetchOwnedNFTs(
  contractAddress: string,
  ownerAddress: string,
  chainId: string
): Promise<NFTMetadata[]> {
  try {
    const provider = getChainProvider(chainId);
    const nftStandard = await detectNFTStandard(contractAddress, chainId);
    
    if (nftStandard === 'UNKNOWN') {
      throw new Error('Contract does not appear to be an NFT collection');
    }
    
    const contract = getNFTContract(contractAddress, provider, nftStandard === 'ERC1155');
    
    if (nftStandard === 'ERC721') {
      try {
        // Check if contract supports enumeration
        const supportsEnumeration = await contract.supportsInterface('0x780e9d63');
        
        if (!supportsEnumeration) {
          throw new Error('Contract does not support enumeration');
        }
        
        const balance = await contract.balanceOf(ownerAddress);
        
        if (balance.eq(0)) {
          return [];
        }
        
        // Fetch token IDs owned by the address
        const fetchPromises = [];
        for (let i = 0; i < balance.toNumber(); i++) {
          fetchPromises.push(contract.tokenOfOwnerByIndex(ownerAddress, i));
        }
        
        const tokenIds = await Promise.all(fetchPromises);
        
        // Fetch metadata for each token
        const nftPromises = tokenIds.map(tokenId => 
          fetchNFTData(contractAddress, tokenId.toString(), chainId)
        );
        
        const nfts = await Promise.all(nftPromises);
        
        // Filter out null results
        return nfts.filter(nft => nft !== null) as NFTMetadata[];
      } catch (err) {
        console.error("Error enumerating owned NFTs:", err);
        throw new Error('Failed to enumerate owned NFTs');
      }
    } else if (nftStandard === 'ERC1155') {
      // For ERC1155, we need a different approach
      // We'd need to rely on events, external APIs, or known token IDs
      throw new Error('Owned NFT fetching for ERC1155 not implemented directly');
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching owned NFTs:", error);
    toast.error("Failed to fetch owned NFTs");
    return [];
  }
}

/**
 * Get popular NFT collections for a specific chain
 */
export const POPULAR_NFT_COLLECTIONS = {
  // Ethereum collections
  '0x1': [
    {
      address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      name: 'Bored Ape Yacht Club',
      description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs.',
      standard: 'ERC721'
    },
    {
      address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
      name: 'Azuki',
      description: 'Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden.',
      standard: 'ERC721'
    },
    {
      address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      description: 'The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes.',
      standard: 'ERC721'
    },
    {
      address: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
      name: 'Doodles',
      description: 'A community-driven collectibles project featuring art by Burnt Toast.',
      standard: 'ERC721'
    },
    {
      address: '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258',
      name: 'Otherdeed for Otherside',
      description: 'Otherdeeds are the key to claiming land in Otherside.',
      standard: 'ERC721'
    }
  ],
  
  // BNB Chain collections
  '0x38': [
    {
      address: '0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07',
      name: 'Pancake Bunnies',
      description: 'Pancake Bunnies are NFTs created by PancakeSwap.',
      standard: 'ERC721'
    },
    {
      address: '0x0a8901b0E25DEb55A87524f0cC164E9644020EBA',
      name: 'Pancake Squad',
      description: 'PancakeSwap\'s NFT collection of 10,000 unique bunnies.',
      standard: 'ERC721'
    },
    {
      address: '0x85F0e02cb992aa1F9F47112F815F519EF1A59E2D',
      name: 'BNB Bulls Club',
      description: 'The BNB Bulls Club is a collection of 10,000 unique NFTs on the BNB Chain.',
      standard: 'ERC721'
    }
  ],
  
  // Sepolia testnet (demo collections)
  '0xaa36a7': [
    {
      address: '0x7C09282C24C363073E0f30D74C301C312E5533AC',
      name: 'Sepolia TestNFT',
      description: 'A test NFT collection on Sepolia for development purposes.',
      standard: 'ERC721'
    }
  ],
  
  // BNB Testnet - including our mock CryptoPath collection
  '0x61': [
    {
      address: '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551',
      name: 'CryptoPath Genesis',
      description: 'The official NFT collection of the CryptoPath ecosystem with exclusive benefits.',
      standard: 'ERC721'
    }
  ]
};

/**
 * Helper function to get contract examples for educational purposes
 */
export function getExampleNFTContract(chainId: string): string {
  switch (chainId) {
    case '0x1':
      return '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'; // BAYC on Ethereum
    case '0xaa36a7':
      return '0x7C09282C24C363073E0f30D74C301C312E5533AC'; // Test NFT on Sepolia
    case '0x38':
      return '0x0a8901b0E25DEb55A87524f0cC164E9644020EBA'; // PancakeSquad on BNB Chain
    case '0x61':
      return '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551'; // CryptoPath Genesis on BNB Testnet
    default:
      return '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'; // Default to BAYC
  }
}

/**
 * Generate a mock NFT with realistic but synthetic data
 */
export function generateMockNFT(contractAddress: string, index: number, chainId: string): NFTMetadata {
  const tokenId = index.toString();
  
  // Define some themes based on contract
  const themes = ['Space', 'Ocean', 'Forest', 'Desert', 'City', 'Mountain'];
  const colors = ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Orange', 'Black', 'White'];
  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  
  // Use contract address to seed randomness for consistent results
  const seedValue = parseInt(contractAddress.slice(-6), 16) + index;
  const pseudoRandom = (max: number) => (seedValue * (index + 1) * 13) % max;
  
  // Generate attributes based on address seed
  const theme = themes[pseudoRandom(themes.length)];
  const color = colors[pseudoRandom(colors.length)];
  const rarity = rarities[pseudoRandom(rarities.length)];
  
  return {
    id: `${contractAddress.toLowerCase()}-${tokenId}`,
    tokenId,
    name: `NFT #${tokenId}`,
    description: `A ${color} ${theme}-themed NFT with ${rarity} rarity.`,
    imageUrl: `https://picsum.photos/seed/${seedValue}/400/400`,
    attributes: [
      { trait_type: 'Theme', value: theme },
      { trait_type: 'Color', value: color },
      { trait_type: 'Rarity', value: rarity },
      { trait_type: 'Network', value: chainId === '0x1' ? 'Ethereum' : 
                                     chainId === '0xaa36a7' ? 'Sepolia' :
                                     chainId === '0x38' ? 'BNB Chain' : 'BNB Testnet' }
    ],
    chain: chainId
  };
}

/**
 * Get estimated gas fees for minting an NFT on the current chain
 */
export async function estimateNFTMintingGas(
  contractAddress: string, 
  chainId: string
): Promise<{ gasLimit: string, estimatedCost: string }> {
  try {
    const provider = getChainProvider(chainId);
    const gasPrice = await provider.getGasPrice();
    
    // Typical gas limit for NFT minting
    const gasLimit = ethers.BigNumber.from(200000);
    const estimatedCost = gasPrice.mul(gasLimit);
    
    return {
      gasLimit: gasLimit.toString(),
      estimatedCost: ethers.utils.formatEther(estimatedCost)
    };
  } catch (error) {
    console.error("Error estimating gas:", error);
    return {
      gasLimit: "200000",
      estimatedCost: "0.01"
    };
  }
}

/**
 * Utility to create NFT metadata in standard format
 */
export function createNFTMetadata(
  name: string,
  description: string,
  image: string,
  attributes: Array<{ trait_type: string, value: string }> = []
): string {
  const metadata = {
    name,
    description,
    image,
    attributes
  };
  
  return JSON.stringify(metadata, null, 2);
}

/**
 * Get NFT contract events (transfers, mints, etc.)
 */
export async function getNFTContractEvents(
  contractAddress: string,
  chainId: string,
  eventName: 'Transfer' | 'Approval' | 'ApprovalForAll' = 'Transfer',
  fromBlock: number = 0,
  toBlock: number | 'latest' = 'latest'
): Promise<any[]> {
  try {
    const provider = getChainProvider(chainId);
    const contract = getNFTContract(contractAddress, provider);
    
    // Get events
    const filter = contract.filters[eventName]();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => ({
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      args: event.args
    }));
  } catch (error) {
    console.error("Error fetching contract events:", error);
    return [];
  }
}

/**
 * Check if a contract is verified on Etherscan/BscScan
 */
export async function isContractVerified(contractAddress: string, chainId: string): Promise<boolean> {
  try {
    // In a real implementation, this would query etherscan/bscscan API
    // For now, return true for known collections
    const popularCollections = POPULAR_NFT_COLLECTIONS[chainId as keyof typeof POPULAR_NFT_COLLECTIONS] || [];
    return popularCollections.some(collection => 
      collection.address.toLowerCase() === contractAddress.toLowerCase()
    );
  } catch (error) {
    console.error("Error checking contract verification:", error);
    return false;
  }
}
