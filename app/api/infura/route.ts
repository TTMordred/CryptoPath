
import { NextResponse } from "next/server";

const INFURA_API_KEY = "7a23b99fe6a24d838217039bb067305e"; // Will be moved to env process later

const networkUrls: { mainnet: string; optimism: string; arbitrum: string; } = {
  mainnet: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  optimism: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  arbitrum: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`
};

// Define the network type first
type Network = 'mainnet' | 'optimism' | 'arbitrum';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache
let lastCallTimestamp = 0;
const RATE_LIMIT_WINDOW = 200; // 200ms between calls (5 calls per second)

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
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW));
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

    // Call Infura API
    const response = await fetch(networkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rpcRequest),
    });

    if (!response.ok) {
      throw new Error(`Infura API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the successful response
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Infura API error:', error);
    return NextResponse.json(
      { 
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Failed to fetch from Infura"
        }
      }, 
      { status: 500 }
    );
  }
}
