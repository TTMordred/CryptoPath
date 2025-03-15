import { NextResponse } from "next/server"

const ALCHEMY_API_URL = "https://eth-mainnet.g.alchemy.com/nft/v2"
const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

interface NFT {
  tokenID: string
  tokenName: string
  tokenSymbol: string
  contractAddress: string
  imageUrl: string
}

interface NFTResponse {
  nfts: NFT[]
  totalCount: number
  pageKey?: string | null
  error?: string
}

const convertIpfsToGatewayUrl = (url: string): string => {
  if (!url) return "/images/nft-placeholder.png"
  
  // Handle ipfs:// protocol
  if (url.startsWith("ipfs://")) {
    const cidAndPath = url.replace("ipfs://", "")
    return `${DEFAULT_IPFS_GATEWAY}${cidAndPath}`
  }
  
  // Already using a gateway, return as is
  if (url.includes("ipfs") && 
      (url.startsWith("http://") || url.startsWith("https://"))) {
    return url
  }
  
  return url
}

// Enhanced address validation
const isValidAddress = (address: string): boolean => {
  // Basic Ethereum address format check
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export async function GET(request: Request) {
  try {
    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const limit = Number(searchParams.get("limit") || "15")
    const pageKey = searchParams.get("pageKey") // Extract pageKey from the request
    
    // Validate address
    if (!address) {
      return NextResponse.json({ 
        error: "Address parameter is required", 
      }, { status: 400 });
    }
    
    // Validate address format
    if (!isValidAddress(address)) {
      return NextResponse.json({ 
        error: `"${address}" is not a valid Ethereum address`,
        details: "Address must start with 0x followed by 40 hexadecimal characters.",
        invalidAddress: address
      }, { status: 400 });
    }
    
    // Fetch NFTs from API with pagination
    const apiKey = process.env.ALCHEMY_API_KEY
    const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs`
    
    // Build URL with pagination parameters
    let url = `${baseURL}?owner=${address}&withMetadata=true&pageSize=${limit}`
    
    // Add pageKey if provided for pagination
    if (pageKey) {
      url += `&pageKey=${pageKey}`
    }
    
    console.log(`Fetching NFTs with URL: ${url.replace(apiKey || "", "[REDACTED]")}`)
    
    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.ownedNfts || data.ownedNfts.length === 0) {
      return NextResponse.json({
        nfts: [],
        totalCount: 0,
        pageKey: null
      }, { status: 200 })
    }

    const nfts = data.ownedNfts.map((nft: any) => ({
      tokenID: nft.id.tokenId,
      tokenName: nft.metadata?.name || "Unnamed NFT",
      tokenSymbol: nft.contract?.symbol || "",
      contractAddress: nft.contract?.address,
      imageUrl: convertIpfsToGatewayUrl(nft.metadata?.image || nft.metadata?.image_url || "/images/nft-placeholder.png")
    }))

    return NextResponse.json<NFTResponse>({
      nfts,
      totalCount: data.totalCount || nfts.length,
      pageKey: data.pageKey || null // Ensure we're passing the next pageKey back
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching NFTs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch NFTs" },
      { status: 500 }
    )
  }
}