
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
    getColorForPercentChange,
  } from "@/lib/format";
import { getCoins, getCoinDetail } from "@/lib/api/coinApi"; 
import { 
  ChevronLeft, 
  ArrowUpRight, 
  Bookmark, 
  Share2, 
  CircleDollarSign, 
  BarChart4, 
  Scale, 
  Clock,
  GlobeLock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Loader from "@/components/Loader";
interface CoinDetailProps {
  coinIdProp?: string;
  isModal?: boolean;
}

const CoinDetail = ({ coinIdProp, isModal = false }: CoinDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const coinId = coinIdProp || id;
  
  const { data: coin, isLoading, error } = useQuery({
    queryKey: ["coinDetail", coinId],
    queryFn: () => getCoinDetail(coinId || ""),
    enabled: !!coinId,
    staleTime: 60 * 1000, // 1 minute
  });

  if (error && !isModal) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Error loading coin data</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find information for this cryptocurrency.
        </p>
        <Link to="/">
          <Button>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${coin?.name} (${coin?.symbol.toUpperCase()}) - CoinCirculate`,
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const containerClass = isModal ? "" : "container";

  return (
    <div className={`min-h-screen py-8 ${isModal ? "px-4 py-4" : ""}`}>
      <div className={containerClass}>
        {!isModal && (
          <Link 
            to="/" 
            className="inline-flex items-center text-sm mb-6 hover:text-primary transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Coins
          </Link>
        )}
        
        {isLoading ? (
          <div className="glass rounded-xl p-8 border border-border/50">
            <Loader />
          </div>
        ) : coin ? (
          <>
            <div className="glass rounded-xl p-8 border border-border/50 animate-scale-up">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <img 
                    src={coin.image.large} 
                    alt={coin.name} 
                    className="w-16 h-16"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold">{coin.name}</h1>
                      <span className="text-lg text-muted-foreground font-medium">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-sm px-2 py-0.5 bg-secondary rounded-full">
                        Rank #{coin.market_cap_rank}
                      </div>
                      {coin.links?.blockchain_site[0] && (
                        <a 
                          href={coin.links.blockchain_site[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-1 hover:underline"
                        >
                          <GlobeLock className="h-3 w-3" />
                          Explorer
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                  >
                    <Bookmark className="h-4 w-4" />
                    Watchlist
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  {coin.links?.homepage[0] && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1"
                      asChild
                    >
                      <a 
                        href={coin.links.homepage[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Website
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold">
                        {formatCurrency(coin.market_data.current_price.usd)}
                      </h2>
                      <div className={`flex items-center gap-1 text-sm font-medium ${getColorForPercentChange(coin.market_data.price_change_percentage_24h)}`}>
                        {coin.market_data.price_change_percentage_24h > 0 ? "▲" : "▼"}
                        {formatPercentage(coin.market_data.price_change_percentage_24h)}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div>
                        Low: <span className="font-medium">{formatCurrency(coin.market_data.low_24h.usd)}</span>
                      </div>
                      <div>
                        High: <span className="font-medium">{formatCurrency(coin.market_data.high_24h.usd)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">About {coin.name}</h3>
                    <div 
                      className="text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: coin.description.en.split('. ').slice(0, 4).join('. ') + '...' 
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="bg-secondary/40 rounded-xl p-6 border border-border/30">
                    <h3 className="text-lg font-semibold mb-4">Market Stats</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CircleDollarSign className="h-4 w-4" />
                          Market Cap
                        </div>
                        <div className="font-medium">
                          {formatCurrency(coin.market_data.market_cap.usd)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BarChart4 className="h-4 w-4" />
                          24h Trading Vol
                        </div>
                        <div className="font-medium">
                          {formatCurrency(coin.market_data.total_volume.usd)}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Scale className="h-4 w-4" />
                          Circulating Supply
                        </div>
                        <div className="font-medium">
                          {formatNumber(coin.market_data.circulating_supply)} {coin.symbol.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Scale className="h-4 w-4" />
                          Total Supply
                        </div>
                        <div className="font-medium">
                          {coin.market_data.total_supply 
                            ? formatNumber(coin.market_data.total_supply) 
                            : "∞"} {coin.symbol.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Scale className="h-4 w-4" />
                          Max Supply
                        </div>
                        <div className="font-medium">
                          {coin.market_data.max_supply 
                            ? formatNumber(coin.market_data.max_supply) 
                            : "∞"} {coin.symbol.toUpperCase()}
                        </div>
                      </div>
                      
                      {coin.market_data.max_supply && (
                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            Circulating Supply / Max Supply
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ 
                                width: `${(coin.market_data.circulating_supply / coin.market_data.max_supply) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-right mt-1">
                            {Math.round((coin.market_data.circulating_supply / coin.market_data.max_supply) * 100)}%
                          </div>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          All Time High
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(coin.market_data.ath.usd)}
                          </div>
                          <div className={`text-xs ${getColorForPercentChange(coin.market_data.ath_change_percentage.usd)}`}>
                            {formatPercentage(coin.market_data.ath_change_percentage.usd)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          All Time Low
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(coin.market_data.atl.usd)}
                          </div>
                          <div className={`text-xs ${getColorForPercentChange(coin.market_data.atl_change_percentage.usd)}`}>
                            {formatPercentage(coin.market_data.atl_change_percentage.usd)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 glass rounded-xl p-8 border border-border/50 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <h3 className="text-xl font-semibold mb-4">Supply Information</h3>
              <p className="text-muted-foreground mb-6">
                Understanding the supply metrics of {coin.name} ({coin.symbol.toUpperCase()}) is essential for evaluating its potential market dynamics.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary/30 rounded-lg p-5">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Circulating Supply</h4>
                  <p className="text-lg font-semibold">
                    {formatNumber(coin.market_data.circulating_supply)} {coin.symbol.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The amount currently in circulation in the public market
                  </p>
                </div>
                
                <div className="bg-secondary/30 rounded-lg p-5">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Supply</h4>
                  <p className="text-lg font-semibold">
                    {coin.market_data.total_supply 
                      ? formatNumber(coin.market_data.total_supply) 
                      : "Unlimited"} {coin.symbol.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The total amount of coins created (excluding burned tokens)
                  </p>
                </div>
                
                <div className="bg-secondary/30 rounded-lg p-5">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Max Supply</h4>
                  <p className="text-lg font-semibold">
                    {coin.market_data.max_supply 
                      ? formatNumber(coin.market_data.max_supply) 
                      : "Unlimited"} {coin.symbol.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The maximum amount that will ever exist in the lifetime of the cryptocurrency
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Coin not found</h1>
            <p className="text-muted-foreground mb-8">
              The cryptocurrency you're looking for doesn't exist or has been delisted.
            </p>
            {!isModal && (
              <Link to="/">
                <Button>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinDetail;