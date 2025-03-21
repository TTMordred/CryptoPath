import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get("symbol");
    const interval = url.searchParams.get("interval") || "1d";
    const limit = url.searchParams.get("limit") || "30";
    
    if (!symbol) {
      return new NextResponse(
        JSON.stringify({ error: "Symbol parameter is required" }),
        { status: 400 }
      );
    }
    
    // Binance API doesn't require auth for basic endpoints
    const response = await axios.get(
      "https://api.binance.com/api/v3/klines",
      {
        params: {
          symbol: `${symbol.toUpperCase()}USDT`,
          interval,
          limit
        }
      }
    );
    
    // Transform to the format our charts expect
    const prices = response.data.map((kline: any) => [kline[0], parseFloat(kline[4])]);
    
    // Estimate market cap and volume
    const market_cap_multiplier = getMarketCapMultiplier(symbol);
    const market_caps = prices.map(([time, price]: [number, number]) => 
      [time, price * market_cap_multiplier]
    );
    
    const volumes = response.data.map((kline: any) => 
      [kline[0], parseFloat(kline[5]) * parseFloat(kline[4])]
    );
    
    return NextResponse.json({
      prices,
      market_caps,
      total_volumes: volumes
    });
  } catch (error: any) {
    console.error("Binance API Error:", error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.msg?.includes('Invalid symbol')) {
      const url = new URL(request.url);
      console.warn(`Symbol ${url.searchParams.get("symbol")}USDT not found on Binance`);
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid symbol", 
          details: "The requested trading pair does not exist on Binance"
        }),
        { status: 400 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to fetch data from Binance",
        details: error.response?.data?.msg || error.message
      }),
      { status: error.response?.status || 500 }
    );
  }
}

function getMarketCapMultiplier(symbol: string): number {
  // Rough estimates of circulating supply for major coins
  switch (symbol.toLowerCase()) {
    case 'btc': return 19500000; // ~19.5M BTC in circulation
    case 'eth': return 120000000; // ~120M ETH in circulation
    case 'bnb': return 153000000; // ~153M BNB in circulation
    case 'sol': return 430000000; // ~430M SOL in circulation
    default: return 100000000; // Default fallback
  }
}
