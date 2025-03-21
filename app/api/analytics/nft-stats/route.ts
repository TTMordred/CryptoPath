import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const apiKey = process.env.MORALIS_API_KEY;
    
    if (!apiKey) {
      throw new Error("Moralis API key is not configured");
    }
    
    // Get NFT collections stats using Moralis API
    const response = await axios.get(
      "https://deep-index.moralis.io/api/v2/nft/collections/stats",
      {
        headers: {
          "X-API-Key": apiKey,
        },
        params: {
          limit: 5,
          chain: "eth"
        }
      }
    );
    
    if (response.data && response.data.result) {
      return NextResponse.json({
        collections: response.data.result,
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from Moralis API");
    }
  } catch (error: any) {
    console.error("Error fetching NFT stats:", error.message);
    
    // Return simulated data if API call fails
    return NextResponse.json({
      collections: [
        { 
          name: "Bored Ape Yacht Club", 
          symbol: "BAYC",
          floorPrice: 72.45,
          volume24h: 456.32,
          totalVolume: 890745.23,
          owners: 6213
        },
        { 
          name: "CryptoPunks", 
          symbol: "PUNK",
          floorPrice: 64.21,
          volume24h: 387.16,
          totalVolume: 754221.54,
          owners: 3311
        },
        { 
          name: "Azuki", 
          symbol: "AZUKI",
          floorPrice: 14.62,
          volume24h: 165.84,
          totalVolume: 246731.12,
          owners: 5120
        },
        { 
          name: "Doodles", 
          symbol: "DOODLE",
          floorPrice: 8.75,
          volume24h: 94.36,
          totalVolume: 124563.74,
          owners: 4892
        },
        { 
          name: "Moonbirds", 
          symbol: "MOONBIRD",
          floorPrice: 6.32,
          volume24h: 57.91,
          totalVolume: 89471.65,
          owners: 7854
        }
      ],
      timestamp: Date.now(),
      simulated: true
    });
  }
}
