import { NextResponse } from "next/server";

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_KEY; // Will be moved to env process later

const networkUrls: { mainnet: string; optimism: string; arbitrum: string; } = {
  mainnet: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  optimism: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  arbitrum: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`
};

// Define the network type first
type Network = 'mainnet' | 'optimism' | 'arbitrum';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds cache (increased from 5s)
let lastCallTimestamp = 0;
const RATE_LIMIT_WINDOW = 300; // 300ms between calls (reduced from 5 calls to 3-4 calls per second)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params, network = "mainnet" } = body;

    // Create cache key from the method and params
    const cacheKey = `${network}-${method}-${JSON.stringify(params)}`;
    
    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastCallTimestamp < RATE_LIMIT_WINDOW) {
      const waitTime = RATE_LIMIT_WINDOW - (now - lastCallTimestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastCallTimestamp = Date.now();

    // Select network URL
    const networkUrl = networkUrls[network as Network] || networkUrls.mainnet;

    // Prepare JSON-RPC request
    const rpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    };

    // Call Infura API with NO timeout - let the browser or network naturally timeout
    console.log(`Making Infura request: ${method} to ${network}`);
    
    try {
      const response = await fetch(networkUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rpcRequest)
      });
  
      if (!response.ok) {
        throw new Error(`Infura API responded with status: ${response.status}`);
      }
  
      // First check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Infura API returned a non-JSON response");
      }
  
      const data = await response.json();
      
      // Verify that the data is valid JSON-RPC
      if (!data || typeof data !== 'object' || (!data.result && !data.error)) {
        throw new Error("Invalid JSON-RPC response from Infura");
      }
      
      // Cache the successful response
      cache.set(cacheKey, { data, timestamp: Date.now() });
      
      console.log(`Infura request successful: ${method}`);
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Infura request error for ${method}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Infura API error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to fetch from Infura";
    
    return NextResponse.json(
      { 
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: -32603,
          message: errorMessage
        }
      }, 
      { status: 500 }
    );
  }
}
