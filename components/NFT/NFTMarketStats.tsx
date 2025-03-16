import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Clock,
  Tag
} from 'lucide-react';

interface NFTMarketStatsProps {
  totalVolume: string;
  dailyVolume: string;
  avgPrice: string;
  listedCount: number;
  soldCount: number;
  priceChange: number; // percentage
}

export default function NFTMarketStats({
  totalVolume,
  dailyVolume,
  avgPrice,
  listedCount,
  soldCount,
  priceChange
}: NFTMarketStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="border border-gray-800 bg-black/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <BarChart2 className="mr-2 h-4 w-4 text-orange-500" />
            Trading Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-2xl font-bold text-white">{totalVolume} PATH</p>
              <p className="text-sm text-gray-400">24h: {dailyVolume} PATH</p>
            </div>
            <div className={`flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-1" />
              )}
              <span className="font-medium">{Math.abs(priceChange)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-gray-800 bg-black/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Tag className="mr-2 h-4 w-4 text-orange-500" />
            Marketplace Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <p className="text-2xl font-bold text-white">{listedCount} NFTs</p>
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">Listed</p>
              <p className="text-sm text-gray-400">Sold: {soldCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-gray-800 bg-black/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Clock className="mr-2 h-4 w-4 text-orange-500" />
            Average Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-baseline">
            <p className="text-2xl font-bold text-white">{avgPrice} PATH</p>
            <div className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
              PATH ecosystem
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
