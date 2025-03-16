import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // CoinGecko API is free and doesn't require an API key
    const response = await axios.get("https://api.coingecko.com/api/v3/search/trending");
    
    if (response.data && response.data.coins) {
      const trendingCoins = response.data.coins.slice(0, 7).map((item: any) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol,
        thumb: item.item.thumb,
        price_btc: item.item.price_btc,
        market_cap_rank: item.item.market_cap_rank,
        score: item.item.score
      }));
      
      return NextResponse.json({
        coins: trendingCoins,
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from CoinGecko API");
    }
  } catch (error: any) {
    console.error("Error fetching trending coins:", error.message);
    
    // Return simulated data if the API call fails
    return NextResponse.json({
      coins: [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', market_cap_rank: 1, price_btc: 1, thumb: '/icons/btc.svg', score: 0 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', market_cap_rank: 2, price_btc: 0.05, thumb: '/icons/eth.svg', score: 0 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', market_cap_rank: 5, price_btc: 0.0012, thumb: '/icons/sol.svg', score: 0 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', market_cap_rank: 8, price_btc: 0.00002, thumb: '/icons/ada.svg', score: 0 },
        { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', market_cap_rank: 12, price_btc: 0.00018, thumb: '/icons/dot.svg', score: 0 },
      ],
      timestamp: Date.now(),
      simulated: true
    });
  }
}
