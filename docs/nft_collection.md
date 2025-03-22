# NFT Integration Guide

This document provides a comprehensive guide for integrating NFTs into the CryptoPath application.

## Table of Contents

- [Overview](#overview)
- [Supported Networks](#supported-networks)
- [API Structure](#api-structure)
- [Fetching NFT Collections](#fetching-nft-collections)
- [Fetching NFT Items](#fetching-nft-items)
- [Working with Metadata](#working-with-metadata)
- [Best Practices](#best-practices)

## Overview

CryptoPath's NFT module allows users to:

- Browse NFT collections on Ethereum and BNB Chain
- View owned NFTs across various collections
- See detailed NFT metadata and attributes
- Track real-time floor prices and volume

The integration uses a combination of direct blockchain queries and indexer APIs to provide a comprehensive NFT experience.

## Supported Networks

| Network | Chain ID | Support Level |
|---------|----------|--------------|
| Ethereum Mainnet | 0x1 | Full |
| Sepolia Testnet | 0xaa36a7 | Full |
| BNB Chain | 0x38 | Full |
| BNB Testnet | 0x61 | Full |

## API Structure

The NFT API consists of several modules:

- `chainProviders.ts`: Network-specific configurations and utilities
- `nftService.ts`: Core NFT fetching and processing functionality
- `nftContracts.ts`: Contract interaction for ERC-721 and ERC-1155 tokens
- `marketplaceService.ts`: Integration with NFT marketplaces

## Fetching NFT Collections

To fetch popular or trending NFT collections:

```typescript
import { fetchPopularCollections } from '@/lib/api/nftService';

// Get collections for a specific chain
const collections = await fetchPopularCollections('0x1'); // Ethereum
```

For user-owned collections:

```ts
import { fetchUserCollections } from '@/lib/api/nftService';

// Get user's collections
const userCollections = await fetchUserCollections(userAddress, chainId);
```

## Fetching NFT Items

```ts
To fetch NFT items from a collection:

import { fetchCollectionNFTs } from '@/lib/api/nftService';

// Basic usage
const nfts = await fetchCollectionNFTs(collectionAddress, chainId);

// With pagination and filters
const nfts = await fetchCollectionNFTs(
  collectionAddress,
  chainId,
  {
    page: 1,
    pageSize: 20,
    sortBy: 'tokenId',
    sortDirection: 'asc',
    attributes: { 'Background': ['Blue', 'Red'] }
  }
);
```

## Working with Metadata

NFT metadata follows the standard format:
```ts
interface NFTMetadata {
  id: string;          // Unique identifier
  tokenId: string;     // Token ID from contract
  name: string;        // NFT name
  description: string; // NFT description
  imageUrl: string;    // URL to the image
  attributes: Array<{  // Collection traits
    trait_type: string;
    value: string;
  }>;
}
```

For IPFS images, use our utility to resolve them:

```ts
import { resolveIPFSUrl } from '@/lib/api/nftService';

const resolvedUrl = resolveIPFSUrl('ipfs://QmXyz...');
```

## Best Practices

1. **Caching**: Cache NFT metadata when possible to reduce API calls
2. **Error Handling**: Always handle API failures gracefully with fallbacks
3. **Rate Limiting**: Respect rate limits for blockchain RPC providers
4. **Lazy Loading**: Implement lazy loading for NFT images
5. **Progressive Loading**: Show placeholders while NFT data loads

## Real Contract Examples

### Fetching an NFT from BAYC (Ethereum)

```ts
const baycContractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const tokenId = '1234';
const nft = await fetchNFTData(baycContractAddress, tokenId, '0x1');
```

### Fetching an NFT from Pancake Squad (BNB Chain)
```ts
const pancakeSquadAddress = '0x0a8901b0E25DEb55A87524f0cC164E9644020EBA';
const tokenId = '5678';
const nft = await fetchNFTData(pancakeSquadAddress, tokenId, '0x38');
```



# NFT Contract Integration

This guide explains how to interact with real NFT contracts on Ethereum and BNB Chain.

## Table of Contents

- [Understanding NFT Standards](#understanding-nft-standards)
- [Contract ABIs](#contract-abis)
- [Reading Contract Data](#reading-contract-data)
- [Handling Metadata](#handling-metadata)
- [Real-World Contract Examples](#real-world-contract-examples)

## Understanding NFT Standards

NFTs typically follow one of two standards:

- **ERC-721**: For non-fungible tokens where each token is unique
- **ERC-1155**: For semi-fungible tokens that can have multiple copies

CryptoPath supports both standards with automatic detection.

## Contract ABIs

The Application Binary Interface (ABI) defines how to interact with a smart contract. We've included standard ABIs for ERC-721 and ERC-1155 contracts:

```json
// ERC-721 Minimal ABI
[
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
]

// ERC-1155 Minimal ABI
[
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function uri(uint256 id) view returns (string)"
]
```

## Reading Contract Data

To read data from an NFT contract:

```ts
import { getChainProvider, getNFTContract } from '@/lib/api/nftContracts';

// Get a provider for the chain
const provider = getChainProvider('0x1'); // Ethereum

// Get contract instance
const contract = getNFTContract(contractAddress, provider);

// Read contract data
const tokenURI = await contract.tokenURI(tokenId);
const ownerAddress = await contract.ownerOf(tokenId);
```

## Handling Metadata

NFT metadata is typically stored as JSON in one of three locations:

1. **On-chain**: Directly in the contract
2. **IPFS**: Decentralized storage (ipfs://...)
3. **HTTP**: Regular web server (https://...)

Our utilities handle all these cases:
```ts
import { fetchMetadata, resolveIPFSUrl } from '@/lib/api/nftService';

// Get metadata from any source
const metadata = await fetchMetadata(tokenURI);

// For IPFS URLs
if (tokenURI.startsWith('ipfs://')) {
  const resolvedUrl = resolveIPFSUrl(tokenURI);
  // Fetch from resolved URL
}
```

## Real-World Contract Examples

### Bored Ape Yacht Club (Ethereum)

```ts
const baycAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

const provider = getChainProvider('0x1');

const baycContract = getNFTContract(baycAddress, provider);

// Get total supply

const totalSupply = await baycContract.totalSupply();

// Get token URI for BAYC #1234

const tokenURI = await baycContract.tokenURI(1234);

// Resolve and fetch metadata

const metadata = await fetchMetadata(tokenURI);
```

### Pancake Squad (BNB Chain)

```ts
const pancakeSquadAddress = '0x0a8901b0E25DEb55A87524f0cC164E9644020EBA';
const provider = getChainProvider('0x38');
const pancakeContract = getNFTContract(pancakeSquadAddress, provider);

// Get token URI for Pancake Squad #5678
const tokenURI = await pancakeContract.tokenURI(5678);

// Resolve and fetch metadata
const metadata = await fetchMetadata(tokenURI);
```

### Azuki (Ethereum)

```ts
const azukiAddress = '0xED5AF388653567Af2F388E6224dC7C4b3241C544';
const provider = getChainProvider('0x1');
const azukiContract = getNFTContract(azukiAddress, provider);

// Get token URI for Azuki #9999
const tokenURI = await azukiContract.tokenURI(9999);

// Resolve and fetch metadata
const metadata = await fetchMetadata(tokenURI);
```

