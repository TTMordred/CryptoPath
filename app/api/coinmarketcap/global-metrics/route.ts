import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Using CoinGecko's free global data endpoint instead of CoinMarketCap
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/global"
    );
    
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response from CoinGecko API");
    }
    
    // Transform CoinGecko response to match the expected format
    const data = {
      status: {
        timestamp: new Date().toISOString(),
        error_code: 0,
        error_message: null,
      },
      data: {
        active_cryptocurrencies: response.data.data.active_cryptocurrencies,
        total_cryptocurrencies: response.data.data.active_cryptocurrencies, // CoinGecko doesn't provide total count
        total_market_cap: response.data.data.total_market_cap,
        total_volume_24h: response.data.data.total_volume,
        btc_dominance: response.data.data.market_cap_percentage.btc,
        eth_dominance: response.data.data.market_cap_percentage.eth,
        market_cap_change_24h: response.data.data.market_cap_change_percentage_24h_usd,
      }
    };
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("CoinGecko API Error:", error.message);
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to fetch data from CoinGecko",
        details: error.response?.data?.error || error.message
      }),
      { status: error.response?.status || 500 }
    );
  }
}
