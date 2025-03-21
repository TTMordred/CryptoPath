import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, TrendingUp, ArrowUpRight, ShoppingCart, AlertTriangle } from 'lucide-react';

type EventType = 'Sale' | 'Transfer' | 'Mint' | 'List';

interface Trade {
  id: string;
  event: EventType;
  tokenId: string;
  from: string;
  to: string;
  price?: string;
  timestamp: string;
  txHash: string;
}

interface TradingHistoryProps {
  trades: Trade[];
  tokenId?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

type TabType = 'all' | 'sales' | 'transfers' | 'mints' | 'lists';

export default function TradingHistory({ 
  trades = [], 
  tokenId, 
  loadMore,
  hasMore = false,
  loading = false
}: TradingHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [error, setError] = useState<string | null>(null);

  // Filter trades based on active tab
  const filteredTrades = trades.filter(trade => {
    if (activeTab === 'all') return true;
    return trade.event.toLowerCase() === activeTab.slice(0, -1);
  });

  // Format addresses to be more readable
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format dates to be more readable
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Invalid date format:', error);
      return 'Invalid date';
    }
  };

  // Format price with proper decimal places
  const formatPrice = (price?: string) => {
    if (!price) return null;
    try {
      const numPrice = parseFloat(price);
      return numPrice.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      });
    } catch (error) {
      console.error('Invalid price format:', error);
      return price;
    }
  };

  // Event badge styling with hover effects
  const getEventBadge = (event: EventType) => {
    const styles = {
      Sale: 'bg-green-600 hover:bg-green-700',
      Transfer: 'bg-blue-600 hover:bg-blue-700',
      Mint: 'bg-purple-600 hover:bg-purple-700',
      List: 'bg-orange-600 hover:bg-orange-700'
    };

    return (
      <Badge className={styles[event]}>
        {event}
      </Badge>
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };

  return (
    <Card className="border border-gray-800 bg-black/40 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-400" />
          {tokenId ? `NFT #${tokenId} Trading History` : 'Recent Transactions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="mints">Mints</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <div className="text-center py-8 text-red-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="w-[120px]">Event</TableHead>
                {!tokenId && <TableHead>Token ID</TableHead>}
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">From</TableHead>
                <TableHead className="hidden sm:table-cell">To</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow 
                  key={trade.id} 
                  className="border-gray-800 transition-colors hover:bg-gray-900/50"
                >
                  <TableCell className="font-medium">
                    {getEventBadge(trade.event)}
                  </TableCell>
                  {!tokenId && (
                    <TableCell>
                      <a 
                        href={`/NFT?tokenId=${trade.tokenId}`} 
                        className="text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
                      >
                        #{trade.tokenId}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </TableCell>
                  )}
                  <TableCell>
                    {trade.price ? (
                      <div className="flex items-center">
                        <span className="text-white font-medium">{formatPrice(trade.price)}</span>
                        <span className="text-gray-400 ml-1">PATH</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${trade.from}`} alt="Avatar" />
                        <AvatarFallback className="bg-gray-800 text-xs">{trade.from.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-400 hover:text-gray-300 transition-colors">
                        {formatAddress(trade.from)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${trade.to}`} alt="Avatar" />
                        <AvatarFallback className="bg-gray-800 text-xs">{trade.to.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-400 hover:text-gray-300 transition-colors">
                        {formatAddress(trade.to)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-400">
                    {formatDate(trade.timestamp)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://etherscan.io/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex p-1 hover:bg-blue-400/10 rounded-full"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}

              {loading && (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400">Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {filteredTrades.length === 0 && !loading && (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ShoppingCart className="h-12 w-12 text-gray-500" />
                      <div className="space-y-1 text-center">
                        <p className="text-gray-400">No trading history available</p>
                        <p className="text-gray-500 text-sm">
                          {activeTab === 'all' 
                            ? 'Be the first to make a transaction!'
                            : `No ${activeTab.slice(0, -1)} events found`
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {hasMore && filteredTrades.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
