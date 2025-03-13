import { NextResponse } from "next/server"

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache
let lastCallTimestamp = 0;
const RATE_LIMIT_WINDOW = 200; // 200ms between calls (5 calls per second)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const moduleParam = searchParams.get("module") 
  const action = searchParams.get("action")
  
  const url = `https://api.etherscan.io/api?module=${moduleParam}&action=${action}&apikey=${process.env.ETHERSCAN_API_KEY}`
  try {
    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from Etherscan" }, { status: 500 })
  }
}
