import { NextResponse } from "next/server";

// Implement caching to reduce API calls
let cachedPrice: { usd: number } | null = null;
let lastFetchTime = 0;
const CACHE_TIME = 300000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    
    // Use cached price if available and still fresh
    if (cachedPrice && now - lastFetchTime < CACHE_TIME) {
      return NextResponse.json(cachedPrice);
    }
    
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    if (!response.ok) {
      throw new Error(`Coingecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.ethereum || !data.ethereum.usd) {
      throw new Error("Invalid response from Coingecko API");
    }
    
    // Update cache
    cachedPrice = { usd: data.ethereum.usd };
    lastFetchTime = now;
    
    return NextResponse.json(cachedPrice);
  } catch (error) {
    console.error("ETH price API error:", error);
    
    // Return last cached price if available, otherwise return an error
    if (cachedPrice) {
      return NextResponse.json(cachedPrice);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch ETH price" },
      { status: 500 }
    );
  }
}
