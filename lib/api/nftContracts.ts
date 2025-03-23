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
  "function symbol() view returns (string)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)"
];

// Extended Event ABI for BSC
const BSC_EVENT_ABI = [
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)"
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
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '1QGN2GHNEPT6CQP854TVBH24C85714ETC5';

export async function detectNFTStandard(contractAddress: string, chainId: string): Promise<'ERC721' | 'BNB721' | 'ERC1155' | 'UNKNOWN'> {
  try {
    const provider = getChainProvider(chainId);
    
    // For BNB Chain, try BscScan API first
    if (chainId === '0x38' || chainId === '0x61') {
      try {
        const baseUrl = chainId === '0x38' ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api';
        const response = await fetch(`${baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${BSCSCAN_API_KEY}`);
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          const abi = JSON.parse(data.result);
          const hasNFTMethods = abi.some((item: any) =>
            (item.name === 'tokenURI' || item.name === 'balanceOf') &&
            item.type === 'function'
          );
          
          if (hasNFTMethods) {
            return 'BNB721'; // BNB Chain's NFT standard
          }
        }
      } catch (err) {
        console.warn("BSCScan API error:", err);
      }
    }
    
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
      if (isERC721) return chainId === '0x38' || chainId === '0x61' ? 'BNB721' : 'ERC721';
      
      const isERC1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
      if (isERC1155) return 'ERC1155';
      
      return 'UNKNOWN';
    } catch (err) {
      // Many older NFTs don't implement supportsInterface
      // Try to call an ERC721 function to see if it works
      try {
        const erc721Contract = new ethers.Contract(contractAddress, ['function name() view returns (string)'], provider);
        await erc721Contract.name();
        return chainId === '0x38' || chainId === '0x61' ? 'BNB721' : 'ERC721';
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
    
    // For BNB Chain, try BSCScan API first
    if ((nftStandard === 'BNB721' || chainId === '0x38' || chainId === '0x61')) {
      try {
        const baseUrl = chainId === '0x38' ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api';
        const response = await fetch(
          `${baseUrl}?module=token&action=tokenuri&contractaddress=${contractAddress}&tokenid=${tokenId}&apikey=${BSCSCAN_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          const tokenURI = data.result;
          const metadata = await fetchMetadata(tokenURI);
          
          if (metadata) {
            return {
              id: `${contractAddress.toLowerCase()}-${tokenId}`,
              tokenId,
              name: metadata.name || `Token #${tokenId}`,
              description: metadata.description || '',
              imageUrl: resolveContentUrl(metadata.image || metadata.image_url || ''),
              attributes: metadata.attributes || [],
              chain: chainId
            };
          }
        }
      } catch (err) {
        console.warn("BSCScan API error:", err);
        // Fall back to direct contract call
      }
    }
    
    // If BSCScan API fails or for other chains, try direct contract call
    const contract = getNFTContract(contractAddress, provider, nftStandard === 'ERC1155');
    
    // Get token metadata URI
    let tokenURI;
    try {
      tokenURI = nftStandard === 'ERC1155'
        ? await contract.uri(tokenId)
        : await contract.tokenURI(tokenId);
      
      // Some contracts return the base URI and require appending the token ID
      if (tokenURI.includes('{id}')) {
        const hexTokenId = ethers.utils.hexZeroPad(ethers.utils.hexlify(tokenId), 32).slice(2);
        tokenURI = tokenURI.replace('{id}', hexTokenId);
      }
    } catch (err) {
      console.error("Error fetching token URI:", err);
      
      // For BNB Chain, provide more specific error message
      if (nftStandard === 'BNB721') {
        toast.error("Failed to fetch BNB NFT data. Please check if the token exists.");
      }
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
    
    // Provide more specific error messages for BNB Chain
    if (chainId === '0x38' || chainId === '0x61') {
      toast.error("Failed to fetch BNB NFT. Please check the contract address and token ID.");
    } else {
      toast.error("Failed to fetch NFT data");
    }
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
      throw new Error('Batch fetching for ERC1155 not implemented');
    }

    // For BNB Chain, try BSCScan API first
    if ((nftStandard === 'BNB721' || chainId === '0x38' || chainId === '0x61')) {
      try {
        const baseUrl = chainId === '0x38' ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api';
        const response = await fetch(
          `${baseUrl}?module=token&action=tokennfttx&contractaddress=${contractAddress}&page=1&offset=${count}&startblock=0&sort=asc&apikey=${BSCSCAN_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          interface BSCNFTTransaction {
            tokenID: string;
            tokenName: string;
            tokenSymbol: string;
          }

          // Get unique token IDs from transactions with type checking
          const transactions = data.result as BSCNFTTransaction[];
          const uniqueTokenIds = [...new Set(transactions
            .map(tx => tx.tokenID)
            .filter((id: string) => id && id.length > 0)
          )];
          
          // Fetch metadata for each token
          const nftPromises = uniqueTokenIds.map(tokenId =>
            fetchNFTData(contractAddress, tokenId, chainId)
          );
          
          const nfts = await Promise.all(nftPromises);
          return nfts.filter(nft => nft !== null) as NFTMetadata[];
        }
      } catch (err) {
        console.warn("BSCScan API error:", err);
        // Fall back to direct contract call
      }
    }
    
    // If BSCScan API fails or for other chains, try direct contract call
    const contract = getNFTContract(contractAddress, provider);
    
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
      if (nftStandard === 'BNB721') {
        toast.error("Failed to fetch BNB NFTs. The contract may not support enumeration.");
      } else {
        toast.error("Failed to enumerate NFTs");
      }
      return [];
    }
  } catch (error) {
    console.error("Error batch fetching NFTs:", error);
    
    // Provide more specific error messages for BNB Chain
    if (chainId === '0x38' || chainId === '0x61') {
      toast.error("Failed to fetch BNB NFTs. Please check the contract address.");
    } else {
      toast.error("Failed to fetch NFTs from contract");
    }
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

    // For BNB Chain, try BSCScan API first
    if (nftStandard === 'BNB721' || chainId === '0x38' || chainId === '0x61') {
      try {
        const baseUrl = chainId === '0x38' ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api';
        const response = await fetch(
          `${baseUrl}?module=token&action=tokennfttx&address=${ownerAddress}&contractaddress=${contractAddress}&apikey=${BSCSCAN_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          interface BSCNFTTransaction {
            tokenID: string;
            to: string;
            from: string;
          }

          const transactions = data.result as BSCNFTTransaction[];
          const ownedTokenIds = transactions
            .filter(tx => tx.to.toLowerCase() === ownerAddress.toLowerCase())
            .filter(tx => !transactions.some(
              outTx => outTx.tokenID === tx.tokenID &&
                      outTx.from.toLowerCase() === ownerAddress.toLowerCase()
            ))
            .map(tx => tx.tokenID);

          const uniqueTokenIds = [...new Set(ownedTokenIds)];
          const nftPromises = uniqueTokenIds.map(tokenId =>
            fetchNFTData(contractAddress, tokenId, chainId)
          );
          
          const nfts = await Promise.all(nftPromises);
          return nfts.filter(nft => nft !== null) as NFTMetadata[];
        }
      } catch (err) {
        console.warn("BSCScan API error:", err);
        // Fall back to direct contract calls
      }
    }

    // If BSCScan API fails or for other chains, try direct contract calls
    const contract = getNFTContract(contractAddress, provider, nftStandard === 'ERC1155');
    
    if (nftStandard === 'ERC721' || nftStandard === 'BNB721') {
      try {
        const balance = await contract.balanceOf(ownerAddress);
        
        if (balance.eq(0)) {
          return [];
        }
        
        try {
          const supportsEnumeration = await contract.supportsInterface('0x780e9d63');
          
          if (supportsEnumeration) {
            const fetchPromises = [];
            for (let i = 0; i < balance.toNumber(); i++) {
              fetchPromises.push(contract.tokenOfOwnerByIndex(ownerAddress, i));
            }
            
            const tokenIds = await Promise.all(fetchPromises);
            const nftPromises = tokenIds.map(tokenId =>
              fetchNFTData(contractAddress, tokenId.toString(), chainId)
            );
            
            const nfts = await Promise.all(nftPromises);
            return nfts.filter(nft => nft !== null) as NFTMetadata[];
          }
        } catch (enumError) {
          console.warn("Enumeration not supported, scanning all tokens");
        }

        // Fallback: Scan all tokens
        try {
          const totalSupply = await contract.totalSupply();
          const nftsFound: NFTMetadata[] = [];
          
          // Scan in batches to avoid timeout
          const batchSize = 20;
          for (let i = 0; i < totalSupply.toNumber(); i += batchSize) {
            const end = Math.min(i + batchSize, totalSupply.toNumber());
            const checkPromises = [];
            
            for (let tokenId = i; tokenId < end; tokenId++) {
              checkPromises.push(
                contract.ownerOf(tokenId)
                  .then((owner: string) => owner.toLowerCase() === ownerAddress.toLowerCase() ? tokenId : null)
                  .catch(() => null)
              );
            }
            
            const results = await Promise.all(checkPromises);
            const validTokenIds = results.filter((id): id is number => id !== null);
            
            if (validTokenIds.length > 0) {
              const nftDataPromises = validTokenIds.map(tokenId =>
                fetchNFTData(contractAddress, tokenId.toString(), chainId)
              );
              const batchNFTs = await Promise.all(nftDataPromises);
              nftsFound.push(...batchNFTs.filter(nft => nft !== null) as NFTMetadata[]);
            }
          }
          
          return nftsFound;
        } catch (scanError) {
          console.error("Error scanning for owned NFTs:", scanError);
          throw new Error(nftStandard === 'BNB721'
            ? 'Failed to fetch owned BNB NFTs'
            : 'Failed to enumerate owned NFTs'
          );
        }
      } catch (err) {
        console.error("Error enumerating owned NFTs:", err);
        throw new Error('Failed to enumerate owned NFTs');
      }
    } else if (nftStandard === 'ERC1155') {
      // Special handling for ERC1155 tokens
      try {
        // For BSC chain, try BSCScan API first
        if (chainId === '0x38' || chainId === '0x61') {
          try {
            const baseUrl = chainId === '0x38' ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api';
            const response = await fetch(
              `${baseUrl}?module=account&action=token1155tx&address=${ownerAddress}&contractaddress=${contractAddress}&apikey=${BSCSCAN_API_KEY}`
            );
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
              // Process BSCScan ERC1155 transactions
              const tokenIds = new Set<string>();
              for (const tx of data.result) {
                if (tx.to.toLowerCase() === ownerAddress.toLowerCase()) {
                  tokenIds.add(tx.tokenID);
                }
              }

              // Check current balance for each token ID
              const activeTokens = await Promise.all(
                Array.from(tokenIds).map(async tokenId => {
                  const balance = await contract.balanceOf(ownerAddress, tokenId);
                  return balance.gt(0) ? tokenId : null;
                })
              );

              const nftPromises = activeTokens
                .filter((id): id is string => id !== null)
                .map(tokenId => fetchNFTData(contractAddress, tokenId, chainId));

              const nfts = await Promise.all(nftPromises);
              return nfts.filter(nft => nft !== null) as NFTMetadata[];
            }
          } catch (bscError) {
            console.warn("BSCScan ERC1155 error:", bscError);
            // Fall back to events
          }
        }

        // Using an extended contract instance for events
        const eventContract = new ethers.Contract(
          contractAddress,
          [...ERC1155_ABI, ...BSC_EVENT_ABI],
          getChainProvider(chainId)
        );

        // Get both single and batch transfer events
        const [singleTransfers, batchTransfers] = await Promise.all([
          eventContract.queryFilter(eventContract.filters.TransferSingle(null, null, ownerAddress)),
          eventContract.queryFilter(eventContract.filters.TransferBatch(null, null, ownerAddress))
        ]);

        // Process both types of transfers
        const tokenIds = new Set<string>();
        
        singleTransfers.forEach(event => {
          if (event.args?.id) {
            tokenIds.add(event.args.id.toString());
          }
        });

        batchTransfers.forEach(event => {
          if (event.args?.ids) {
            event.args.ids.forEach((id: ethers.BigNumber) => {
              tokenIds.add(id.toString());
            });
          }
        });

        // Check current balance for each token ID
        const activeTokens = await Promise.all(
          Array.from(tokenIds).map(async tokenId => {
            const balance = await contract.balanceOf(ownerAddress, tokenId);
            return balance.gt(0) ? tokenId : null;
          })
        );

        // Fetch metadata for tokens with non-zero balance
        const nftPromises = activeTokens
          .filter((id): id is string => id !== null)
          .map(tokenId => fetchNFTData(contractAddress, tokenId, chainId));

        const nfts = await Promise.all(nftPromises);
        return nfts.filter(nft => nft !== null) as NFTMetadata[];
      } catch (error) {
        console.error("Error fetching ERC1155 tokens:", error);
        toast.error("Failed to fetch ERC1155 tokens. Please try again.");
        return [];
      }
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
    }
  ],
  '0x38': [
    {
      address: '0x85F0e02cb992aa1F9F47112F815F519EF1A59E2D',
      name: 'Pancake Squad',
      description: 'PancakeSwap\'s NFT collection for the BSC community.',
      standard: 'BNB721'
    },
    {
      address: '0x0a8901b0E25DEb55A87524f0cC164E9644020EBA',
      name: 'BSC Punks',
      description: 'The first NFT collection on Binance Smart Chain.',
      standard: 'BNB721'
    },
    {
      address: '0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07',
      name: 'BSC Multi-Token',
      description: 'Example ERC1155 collection on BSC for testing.',
      standard: 'ERC1155'
    }
  ],
  '0xaa36a7': [
    {
      address: '0x7C09282C24C363073E0f30D74C301C312E5533AC',
      name: 'Sepolia TestNFT',
      description: 'A test NFT collection on Sepolia for development purposes.',
      standard: 'ERC721'
    }
  ],
  '0x61': [
    {
      address: '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551',
      name: 'CryptoPath Genesis',
      description: 'The official NFT collection of the CryptoPath ecosystem with exclusive benefits.',
      standard: 'BNB721'
    },
    {
      address: '0x60935F36e4631F73f0f407e68642144e07aC7f5E',
      name: 'BSC Test Collection',
      description: 'Test NFT collection with both BNB721 and ERC1155 tokens.',
      standard: 'ERC1155'
    }
  ]
} as const;

/**
 * Helper function to get contract examples for educational purposes
 */
export function getExampleNFTContract(chainId: string, standard: 'ERC721' | 'BNB721' | 'ERC1155' = 'ERC721'): string {
  switch (chainId) {
    case '0x1':
      return '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'; // BAYC on Ethereum
    case '0xaa36a7':
      return '0x7C09282C24C363073E0f30D74C301C312E5533AC'; // Test NFT on Sepolia
    case '0x38':
      return standard === 'ERC1155'
        ? '0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07' // BSC Multi-Token
        : '0x85F0e02cb992aa1F9F47112F815F519EF1A59E2D'; // Pancake Squad
    case '0x61':
      return standard === 'ERC1155'
        ? '0x60935F36e4631F73f0f407e68642144e07aC7f5E' // BSC Test Collection
        : '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551'; // CryptoPath Genesis
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
