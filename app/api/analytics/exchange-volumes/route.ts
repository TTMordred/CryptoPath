import { NextResponse } from 'next/server';
import axios from "axios";

export async function GET() {
  try {
    // Fetch real exchange data from CoinGecko's free API
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/exchanges?per_page=5&page=1"
    );
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response from CoinGecko API");
    }
    
    // Map to the format our frontend expects
    // Assign colors to make visualization consistent
    const colors = ['#F0B90B', '#1652F0', '#1A1B1F', '#1F94E0', '#26A17B'];
    
    const exchangeData = {
      data: response.data.map((exchange, index) => ({
        name: exchange.name,
        volume: exchange.trade_volume_24h_btc * 
          (response.data[0].trade_volume_24h_btc > 10000 ? 1 : 60000), // Convert to USD if needed
        color: colors[index % colors.length]
      })),
      timestamp: Date.now()
    };
    
    // Calculate total volume
    exchangeData.data.sort((a, b) => b.volume - a.volume);
    const totalVolume = exchangeData.data.reduce((sum, ex) => sum + ex.volume, 0);
    
    return NextResponse.json({
      ...exchangeData,
      totalVolume
    }, { status: 200 });
  } catch (error) {
    console.error('Error in exchange volumes API:', error);
    
    // Fallback to simulated data if the API call fails
    const exchangeData = {
      data: [
        { name: 'Binance', volume: 25000000000 + (Math.random() * 5000000000), color: '#F0B90B' },
        { name: 'Coinbase', volume: 12000000000 + (Math.random() * 2000000000), color: '#1652F0' },
        { name: 'OKX', volume: 8000000000 + (Math.random() * 1000000000), color: '#1A1B1F' },
        { name: 'Huobi', volume: 5000000000 + (Math.random() * 1000000000), color: '#1F94E0' },
        { name: 'KuCoin', volume: 3000000000 + (Math.random() * 800000000), color: '#26A17B' },
      ],
      timestamp: Date.now(),
      simulated: true
    };
    
    const totalVolume = exchangeData.data.reduce((sum, ex) => sum + ex.volume, 0);
    
    return NextResponse.json({
      ...exchangeData,
      totalVolume
    }, { status: 200 });
  }
}
