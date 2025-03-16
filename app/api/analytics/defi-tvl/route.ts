import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const protocol = url.searchParams.get('protocol') || 'all';
    
    // Choose endpoint based on whether we're getting global data or protocol-specific
    const endpoint = protocol === 'all' 
      ? 'https://api.llama.fi/charts' 
      : `https://api.llama.fi/protocol/${protocol}`;
    
    const response = await axios.get(endpoint);
    
    if (!response.data) {
      throw new Error("Invalid response from DefiLlama API");
    }
    
    // For global data, we get the TVL history directly
    if (protocol === 'all') {
      // Get the last 30 days of data
      const data = response.data.slice(-30).map((item: any) => ({
        date: new Date(item.date * 1000).toLocaleDateString(),
        tvl: item.totalLiquidityUSD
      }));
      
      return NextResponse.json({
        data,
        totalTvl: data[data.length - 1]?.tvl || 0,
        timestamp: Date.now()
      });
    } 
    // For protocol data, we need to extract the TVL from the protocol object
    else {
      const tvlData = response.data.tvl.slice(-30).map((item: any) => ({
        date: new Date(item.date * 1000).toLocaleDateString(),
        tvl: item.totalLiquidityUSD
      }));
      
      return NextResponse.json({
        name: response.data.name,
        symbol: response.data.symbol,
        data: tvlData,
        totalTvl: tvlData[tvlData.length - 1]?.tvl || 0,
        chains: response.data.chains,
        timestamp: Date.now()
      });
    }
  } catch (error: any) {
    console.error("Error fetching DeFi TVL data:", error.message);
    
    // Return simulated data if the API call fails
    const dates = [];
    const now = new Date();
    let simulatedTvl = 150000000000; // $150B starting point
    
    for (let i = 30; i > 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Random daily change between -3% and +3%
      const dailyChange = simulatedTvl * (Math.random() * 0.06 - 0.03);
      simulatedTvl += dailyChange;
      
      dates.push({
        date: date.toLocaleDateString(),
        tvl: simulatedTvl
      });
    }
    
    return NextResponse.json({
      data: dates,
      totalTvl: simulatedTvl,
      timestamp: Date.now(),
      simulated: true
    });
  }
}
