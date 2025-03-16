import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, Image as ImageIcon, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

interface NftCollection {
  name: string;
  symbol: string;
  floorPrice: number;
  volume24h: number;
  totalVolume: number;
  owners: number;
}

interface NftStatsData {
  collections: NftCollection[];
  timestamp: number;
  simulated?: boolean;
}

export default function NftStatsCard() {
  const [nftData, setNftData] = useState<NftStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchNftData = async () => {
      try {
        const response = await axios.get<NftStatsData>('/api/analytics/nft-stats');
        setNftData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch NFT stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNftData();
    
    // Refresh every 6 hours
    const interval = setInterval(fetchNftData, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-purple-500" />
            Top NFT Collections
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
        ) : nftData && nftData.collections && nftData.collections.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-xs text-gray-400 text-left">
                    <th className="pb-2">Collection</th>
                    <th className="pb-2 text-right">Floor Price</th>
                    <th className="pb-2 text-right">24h Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {nftData.collections.map((collection, index) => (
                    <tr key={index} className="border-t border-gray-800">
                      <td className="py-2">
                        <div className="font-medium truncate max-w-[120px]">{collection.name}</div>
                        <div className="text-xs text-gray-400">{collection.symbol}</div>
                      </td>
                      <td className="py-2 text-right">
                        <div className="font-medium">{collection.floorPrice.toFixed(2)} ETH</div>
                      </td>
                      <td className="py-2 text-right">
                        <div className="font-medium">{collection.volume24h.toFixed(1)} ETH</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-2 text-center">
              <Link 
                href="/NFT/collection" 
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center"
              >
                View NFT Explorer
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            No NFT stats available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
