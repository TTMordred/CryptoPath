import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MarketIndexCard() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchMarketIndices = async () => {
      try {
        // In a real app, this would be an API call
        // Using simulated data for demonstration
        const simulatedIndices: MarketIndex[] = [
          {
            name: 'S&P 500',
            symbol: 'SPX',
            price: 4500 + (Math.random() * 200 - 100),
            change: Math.random() * 40 - 20,
            changePercent: (Math.random() * 2 - 1)
          },
          {
            name: 'Nasdaq',
            symbol: 'NDX',
            price: 15000 + (Math.random() * 500 - 250),
            change: Math.random() * 100 - 50,
            changePercent: (Math.random() * 2 - 1)
          },
          {
            name: 'Dow Jones',
            symbol: 'DJI',
            price: 35000 + (Math.random() * 1000 - 500),
            change: Math.random() * 200 - 100,
            changePercent: (Math.random() * 2 - 1)
          },
          {
            name: 'Gold',
            symbol: 'XAU',
            price: 2000 + (Math.random() * 100 - 50),
            change: Math.random() * 30 - 15,
            changePercent: (Math.random() * 2 - 1)
          }
        ];
        
        setIndices(simulatedIndices);
      } catch (error) {
        console.error("Failed to fetch market indices:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketIndices();
    
    const interval = setInterval(fetchMarketIndices, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center">
          Traditional Markets
          <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {indices.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{index.name}</div>
                  <div className="text-sm text-gray-400">{index.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{index.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  <div className={`text-sm flex items-center ${index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {index.changePercent >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {index.changePercent >= 0 ? '+' : ''}
                    {index.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
