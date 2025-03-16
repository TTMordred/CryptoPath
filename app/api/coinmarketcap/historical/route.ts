import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get("symbol") || "BTC";
    const time_period = url.searchParams.get("time_period") || "30d";
    const days = parseInt(time_period.replace('d', '')) || 30;
    
    console.log(`Historical data requested for ${symbol} over ${days} days`);
    console.warn("CoinMarketCap free API does not support historical data, returning simulated data");
    
    // Generate simulated data
    const data = generateMockHistoricalData(symbol, days);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in historical data endpoint:", error.message);
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to generate historical data",
        details: error.message
      }),
      { status: 500 }
    );
  }
}

function generateMockHistoricalData(symbol: string, days: number) {
  // Start with a base price depending on the symbol
  let basePrice = 0;
  switch (symbol.toLowerCase()) {
    case 'btc': basePrice = 60000; break;
    case 'eth': basePrice = 3000; break;
    case 'sol': basePrice = 130; break;
    case 'bnb': basePrice = 550; break;
    default: basePrice = 100;
  }
  
  const prices = [];
  const market_caps = [];
  const total_volumes = [];
  
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // Create a consistently upward or downward trend for the overall chart
  const trendDirection = Math.random() > 0.5 ? 1 : -1;
  const trendStrength = Math.random() * 0.01 + 0.005; // Between 0.5% and 1.5% daily trend
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * oneDayMs);
    
    // Add some random fluctuation plus the overall trend
    const dailyTrend = trendDirection * trendStrength * basePrice * (days - i) / days;
    const randomChange = basePrice * (Math.random() * 0.06 - 0.03); // Random -3% to +3%
    basePrice += randomChange + dailyTrend;
    
    if (basePrice < 0) basePrice = Math.abs(randomChange); // Prevent negative prices
    
    prices.push([timestamp, basePrice]);
    market_caps.push([timestamp, basePrice * getMarketCapMultiplier(symbol)]); 
    total_volumes.push([timestamp, basePrice * getVolumeMultiplier(symbol) * (0.7 + Math.random() * 0.6)]);
  }
  
  return {
    prices,
    market_caps,
    total_volumes
  };
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

function getVolumeMultiplier(symbol: string): number {
  // Volume multipliers based on typical daily trading volume as % of market cap
  switch (symbol.toLowerCase()) {
    case 'btc': return 500000; // Higher volume for BTC
    case 'eth': return 300000;
    default: return 200000;
  }
}
