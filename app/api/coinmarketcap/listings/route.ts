import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "10";
    const sort = url.searchParams.get("sort") || "market_cap";
    const sort_dir = url.searchParams.get("sort_dir") || "desc";
    
    if (!apiKey) {
      console.warn("CoinMarketCap API key is not configured");
      return new NextResponse(
        JSON.stringify({ error: "API key is not configured" }),
        { status: 500 }
      );
    }
    
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
        },
        params: {
          limit,
          sort,
          sort_dir,
          convert: "USD"
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Log detailed error for debugging
    if (error.response?.data) {
      const errorData = error.response.data;
      console.error(`CoinMarketCap API Error (${error.response.status}):`, errorData);
      
      // Check for specific error codes from CoinMarketCap
      if (errorData.status?.error_code === 1002) {
        console.warn("CoinMarketCap API Key is invalid or authorization failed");
      } else if (errorData.status?.error_code === 1006) {
        console.warn("CoinMarketCap API request exceeds available plan limit");
      }
    } else {
      console.error("CoinMarketCap API Error:", error.message);
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to fetch data from CoinMarketCap",
        details: error.response?.data?.status?.error_message || error.message,
        code: error.response?.data?.status?.error_code
      }),
      { status: error.response?.status || 500 }
    );
  }
}
