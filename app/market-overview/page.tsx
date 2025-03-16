'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ParticlesBackground from '@/components/ParticlesBackground';
import {
  ArrowUpRight, Clock, Info, ChevronDown
} from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  fetchGlobalMarketData,
  fetchTopCryptocurrencies,
  fetchHistoricalData
} from '@/services/coinMarketCapService';
import CryptoCard from '@/components/market-overview/CryptoCard';
import MarketCapChart from '@/components/market-overview/MarketCapChart';
import DominanceCard from '@/components/market-overview/DominanceCard';
import FearGreedIndex from '@/components/market-overview/FearGreedIndex';
import AltcoinIndex from '@/components/market-overview/AltcoinIndex';
import MarketIndexCard from '@/components/market-overview/MarketIndexCard';
import WhaleAlertsCard from '@/components/market-overview/WhaleAlertsCard';
import TrendingCoinsCard from '@/components/market-overview/TrendingCoinsCard';
import BlockchainStatsCard from '@/components/market-overview/BlockchainStatsCard';
import GasPriceCard from '@/components/market-overview/GasPriceCard';
import ExchangeVolumeCard from '@/components/market-overview/ExchangeVolumeCard';
import DefiTvlCard from '@/components/market-overview/DefiTvlCard';
import NftStatsCard from '@/components/market-overview/NftStatsCard';
import MarketSentimentCard from '@/components/market-overview/MarketSentimentCard';

export default function MarketOverview() {
  const [marketData, setMarketData] = useState<any | null>(null);
  const [topTokens, setTopTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('30d');
  const [btcHistoricalData, setBtcHistoricalData] = useState<any>(null);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>('live');

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // Fetch global market data from CoinMarketCap
        const data = await fetchGlobalMarketData();
        setMarketData(data);
        
        // Fetch top tokens from CoinMarketCap
        const tokens = await fetchTopCryptocurrencies(5);
        setTopTokens(tokens);
        
        // Try Binance API first for BTC historical data
        try {
          const btcData = await fetch(`/api/binance/klines?symbol=BTC&interval=1d&limit=30`)
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch from Binance');
              return res.json();
            });
          
          setBtcHistoricalData(btcData);
          setDataSource('binance');
        } catch (binanceError) {
          console.warn('Failed to fetch from Binance, using simulated data:', binanceError);
          
          // Fallback to simulated data
          const btcData = await fetchHistoricalData('BTC', 30);
          setBtcHistoricalData(btcData);
          setDataSource('simulated');
        }
        
        setDataLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching market data:', error);
        toast.error('Failed to load market data. Using backup data.');
        
        // Set simulated data as fallback
        const data = {
          total_market_cap: { usd: 1000000000000 },
          total_volume: { usd: 50000000000 },
          market_cap_percentage: { btc: 60, eth: 20 },
          active_cryptocurrencies: 5000,
          markets: 10000
        };
        setMarketData(data);
        
        const tokens = [
          { id: 1, name: 'Bitcoin', symbol: 'BTC', current_price: 50000, price_change_percentage_24h: 2 },
          { id: 2, name: 'Ethereum', symbol: 'ETH', current_price: 4000, price_change_percentage_24h: 3 },
          { id: 3, name: 'Binance Coin', symbol: 'BNB', current_price: 600, price_change_percentage_24h: 1 },
          { id: 4, name: 'Cardano', symbol: 'ADA', current_price: 2, price_change_percentage_24h: -1 },
          { id: 5, name: 'Solana', symbol: 'SOL', current_price: 150, price_change_percentage_24h: 4 }
        ];
        setTopTokens(tokens);
        
        const btcData = await fetchHistoricalData('BTC', 30);
        setBtcHistoricalData(btcData);
        
        setDataLastUpdated(new Date());
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Refresh data every 5 minutes instead of 2 to avoid API rate limits
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format large numbers
  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1000000000000) {
      return `$${(num / 1000000000000).toFixed(decimals)}T`;
    } else if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(decimals)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(decimals)}K`;
    } else {
      return `$${num.toFixed(decimals)}`;
    }
  };

  const renderSkeleton = () => (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 col-span-2" />
        <Skeleton className="h-64" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-transparent text-white">
      <ParticlesBackground />
      
      <div className="container mx-auto p-4 py-8 relative z-10">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl md:text-4xl font-bold">Crypto Market Overview</h1>
            <div className="mt-2 md:mt-0 flex items-center gap-4">
              <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-sm inline-flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {dataLastUpdated ? 
                  `Updated ${dataLastUpdated.toLocaleTimeString()}` : 
                  'Fetching data...'}
              </div>
              
              
              {dataSource === 'simulated' && (
                <Badge variant="outline" className="bg-amber-900/30">
                  Simulated Data
                </Badge>
              )}
            </div>
          </div>
          <p className="text-gray-400 mt-2">
            Live cryptocurrency market data powered by Binance and CoinMarketCap APIs, including Bitcoin price, market dominance, and sentiment indicators.
          </p>
        </header>

        {loading ? (
          renderSkeleton()
        ) : marketData && topTokens.length > 0 ? (
          <>
            {/* Top Cryptocurrencies Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {topTokens.map((token, index) => (
                <CryptoCard
                  key={token.id}
                  name={token.name}
                  symbol={token.symbol.toUpperCase()}
                  price={token.current_price}
                  change24h={token.price_change_percentage_24h}
                  icon={`/icons/${token.symbol.toLowerCase()}.svg`}
                  fallbackIcon={index < 2 ? `/icons/${token.symbol.toLowerCase()}.svg` : null}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Bitcoin Price Chart (2/3 width) */}
              <div className="md:col-span-2">
                <Card className="border border-gray-800 bg-black/40 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-medium">Bitcoin Price</CardTitle>
                    <div className="flex gap-1">
                      <Tabs defaultValue={chartTimeframe} value={chartTimeframe} onValueChange={setChartTimeframe} className="h-8">
                        <TabsList className="grid grid-cols-4 h-8 bg-gray-800/50 p-1">
                          <TabsTrigger value="24h" className="text-xs h-6">24h</TabsTrigger>
                          <TabsTrigger value="7d" className="text-xs h-6">7d</TabsTrigger>
                          <TabsTrigger value="30d" className="text-xs h-6">30d</TabsTrigger>
                          <TabsTrigger value="1y" className="text-xs h-6">1y</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-0 pr-0">
                    <div className="flex items-center justify-between px-6 mb-2">
                      <div>
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="text-2xl font-bold">
                          {btcHistoricalData && btcHistoricalData.prices && btcHistoricalData.prices.length > 0 
                            ? `$${Number(btcHistoricalData.prices[btcHistoricalData.prices.length-1][1]).toLocaleString()}` 
                            : `$${formatNumber(60000)}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">24h Volume</div>
                        <div className="text-2xl font-bold">
                          {btcHistoricalData && btcHistoricalData.total_volumes && btcHistoricalData.total_volumes.length > 0
                            ? formatNumber(btcHistoricalData.total_volumes[btcHistoricalData.total_volumes.length-1][1])
                            : formatNumber(30000000000)}
                        </div>
                      </div>
                    </div>
                    
                    <MarketCapChart 
                      data={btcHistoricalData} 
                      timeframe={chartTimeframe} 
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Bitcoin Dominance (1/3 width) */}
              <div>
                <DominanceCard
                  btcDominance={marketData?.market_cap_percentage?.btc || 0}
                  ethDominance={marketData?.market_cap_percentage?.eth || 0}
                  othersDominance={100 - (marketData?.market_cap_percentage?.btc || 0) - (marketData?.market_cap_percentage?.eth || 0)}
                />
              </div>
            </div>

            {/* Analytics Section 1: Market Sentiment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Fear & Greed Index */}
              <div className="md:col-span-1">
                <FearGreedIndex />
              </div>
              
              {/* Altcoin Season Index */}
              <div className="md:col-span-1">
                <AltcoinIndex />
              </div>
              
              {/* Market Index */}
              <div className="md:col-span-1">
                <MarketIndexCard />
              </div>
            </div>

            {/* Analytics Section 2: Market Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Whale Alerts */}
              <div className="lg:col-span-2">
                <WhaleAlertsCard />
              </div>
              
              {/* Trending Coins */}
              <div className="lg:col-span-1">
                <TrendingCoinsCard />
              </div>
            </div>

            {/* Analytics Section 3: Market Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <BlockchainStatsCard />
              <GasPriceCard />
              <ExchangeVolumeCard />
            </div>

            {/* Analytics Section 4: DeFi & NFT Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <DefiTvlCard />
              <NftStatsCard />
            </div>

            {/* Analytics Section 5: Additional Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MarketSentimentCard />
              <Card className="border border-gray-800 bg-black/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-medium flex items-center">
                    Market Statistics
                    <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Active Cryptocurrencies</div>
                    <div className="text-2xl font-bold mt-1">
                      {marketData?.active_cryptocurrencies?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Active Markets</div>
                    <div className="text-2xl font-bold mt-1">
                      {marketData?.markets?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">BTC Market Cap</div>
                    <div className="text-2xl font-bold mt-1">
                      {formatNumber((marketData?.total_market_cap?.usd || 0) * ((marketData?.market_cap_percentage?.btc || 0) / 100))}
                    </div>
                  </div>
                  <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">ETH Market Cap</div>
                    <div className="text-2xl font-bold mt-1">
                      {formatNumber((marketData?.total_market_cap?.usd || 0) * ((marketData?.market_cap_percentage?.eth || 0) / 100))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mb-8">
              <Link href="/pricetable">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-lg text-white font-semibold flex items-center hover:opacity-90 transition-opacity">
                  View Detailed Price Table
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">
              Unable to load market data. Please try again later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
