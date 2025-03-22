import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, Flame, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Image from "next/legacy/image";
import Link from 'next/link';

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  price_btc: number;
  market_cap_rank: number;
  score: number;
}

interface TrendingData {
  coins: TrendingCoin[];
  timestamp: number;
  simulated?: boolean;
}

export default function TrendingCoinsCard() {
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const response = await axios.get<TrendingData>('/api/analytics/trending-coins');
        setTrendingData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch trending coins:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrendingData();
    
    // Refresh every hour
    const interval = setInterval(fetchTrendingData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatBtcPrice = (price: number): string => {
    if (price < 0.00001) return price.toExponential(2);
    return price.toFixed(8);
  };
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            <Flame className="h-5 w-5 mr-2 text-orange-500" />
            Trending Coins
            <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
          </span>
          {isSimulated && (
            <span className="text-xs text-amber-500 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" /> 
              Estimated
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : trendingData && trendingData.coins.length > 0 ? (
          <div className="space-y-3">
            {trendingData.coins.map((coin, index) => (
              <div key={coin.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2 font-medium">{index + 1}.</span>
                  <div className="h-6 w-6 mr-2 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    <Image 
                      src={coin.thumb} 
                      alt={coin.name} 
                      width={24} 
                      height={24}
                      onError={(e) => {
                        // If image fails, show first letter of coin name
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = coin.symbol.charAt(0).toUpperCase();
                        target.parentElement!.style.display = 'flex';
                        target.parentElement!.style.justifyContent = 'center';
                        target.parentElement!.style.alignItems = 'center';
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{coin.name}</div>
                    <div className="text-xs text-gray-400">{coin.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Price in BTC</div>
                  <div className="font-medium">₿ {formatBtcPrice(coin.price_btc)}</div>
                </div>
              </div>
            ))}
            
            <div className="pt-2 text-center">
              <Link 
                href="https://www.coingecko.com/en/discover" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center"
              >
                View More on CoinGecko
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            No trending coins data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
