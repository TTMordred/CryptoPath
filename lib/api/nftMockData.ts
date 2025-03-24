/**
 * This file contains functions to generate mock NFT data
 * Used as fallbacks when API calls fail or for demo/testing purposes
 */

// Mock collection data - maps contract addresses to collection info
const mockCollectionsMap: Record<string, any> = {
  // BNB Testnet CryptoPath collection
  '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551': {
    name: 'CryptoPath Genesis',
    description: 'The official NFT collection of the CryptoPath ecosystem. These limited edition NFTs grant exclusive access to premium features and rewards within the CryptoPath platform.',
    imageUrl: '/Img/logo/cryptopath.png',
    totalSupply: '1000',
    symbol: 'CPG',
    chain: '0x61',
    verified: true,
    category: 'Utility',
    featured: true
  },
  
  // Ethereum example collections
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': {
    name: 'Bored Ape Yacht Club',
    description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain.',
    imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000',
    totalSupply: '10000',
    symbol: 'BAYC',
    chain: '0x1',
    verified: true,
    category: 'Art'
  },
  
  // BNB Chain example collections
  '0x0a8901b0e25deb55a87524f0cc164e9644020eba': {
    name: 'Pancake Squad',
    description: 'PancakeSwap\'s NFT collection of 10,000 unique bunnies designed to reward loyal community members and bring utility to the CAKE token.',
    imageUrl: 'https://i.seadn.io/s/raw/files/8b1d3939c420d39c8914f68b506c50db.png?auto=format&dpr=1&w=256',
    totalSupply: '10000',
    symbol: 'PS',
    chain: '0x38',
    verified: true,
    category: 'Gaming'
  }
};

/**
 * Generate a mock NFT collection when API calls fail
 */
export function generateMockNFTCollection(contractAddress: string, chainId: string) {
  // Normalize contract address for comparison
  const normalizedAddress = contractAddress.toLowerCase();
  
  // Check if we have specific mock data for this collection
  if (mockCollectionsMap[normalizedAddress]) {
    return mockCollectionsMap[normalizedAddress];
  }
  
  // Generate generic mock data based on chain
  const chainName = chainId === '0x1' ? 'Ethereum' : 
                    chainId === '0xaa36a7' ? 'Sepolia' :
                    chainId === '0x38' ? 'BNB Chain' : 'BNB Testnet';
                    
  return {
    name: `Collection ${contractAddress.slice(0, 6)}`,
    description: `A sample NFT collection on ${chainName}`,
    imageUrl: '/Img/nft/sample-1.jpg',
    totalSupply: '1000',
    symbol: 'NFT',
    chain: chainId,
    verified: false,
    category: 'Collectibles'
  };
}

/**
 * Generate mock NFTs for testing or when API calls fail
 */
export function generateMockNFTs(contractAddress: string, chainId: string, page: number, pageSize: number): any[] {
  const nfts: any[] = [];
  const startIndex = (page - 1) * pageSize + 1;
  
  // Normalized contract address
  const normalizedAddress = contractAddress.toLowerCase();
  
  // Get collection info if available
  const collectionInfo = mockCollectionsMap[normalizedAddress] || {
    name: `Collection ${contractAddress.slice(0, 6)}`,
    chain: chainId
  };
  
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
    
    // For BNB Testnet CryptoPath collection, use special naming
    const name = normalizedAddress === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551' 
      ? `CryptoPath Genesis #${tokenId}`
      : `${collectionInfo.name} #${tokenId}`;
      
    const description = normalizedAddress === '0x2ff12fe4b3c4dea244c4bdf682d572a90df3b551'
      ? `A unique NFT from the CryptoPath Genesis Collection with ${rarities[rarityIndex]} rarity.`
      : `NFT #${tokenId} from ${collectionInfo.name}`;
    
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
