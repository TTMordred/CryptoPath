import { NextResponse } from "next/server"

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache
let lastCallTimestamp = 0;
const RATE_LIMIT_WINDOW = 200; // 200ms between calls (5 calls per second)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Create cache key from the entire URL
  const cacheKey = searchParams.toString();
  
  // Check cache
  const cachedData = cache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json(cachedData.data);
  }

  // Rate limiting
  const now = Date.now();
  if (now - lastCallTimestamp < RATE_LIMIT_WINDOW) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW));
  }
  lastCallTimestamp = Date.now();

  // Build the Etherscan API URL with all parameters
  const urlParams = new URLSearchParams()
  
  // Add all search params to the URL
  searchParams.forEach((value, key) => {
    urlParams.append(key, value)
  })
  
  // Always include the API key
  urlParams.append('apikey', process.env.ETHERSCAN_API_KEY || '')
  
  const url = `https://api.etherscan.io/api?${urlParams.toString()}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Etherscan API responded with status: ${response.status}`)
    }
    const data = await response.json()
    
    // Check for Etherscan API errors
    if (data.status === "0" && data.message === "NOTOK") {
      throw new Error(data.result)
    }
    
    // Cache the successful response
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Etherscan API error:', error)
    return NextResponse.json(
      { 
        status: "0",
        message: "NOTOK",
        result: error instanceof Error ? error.message : "Failed to fetch from Etherscan"
      }, 
      { status: 500 }
    )
  }
}