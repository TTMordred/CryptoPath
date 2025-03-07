import { useQuery } from "@tanstack/react-query";
import { getCoinDetail } from "@/lib/api/coinApi";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Loader from "@/components/Loader";
import { 
    ArrowUpRight, 
    Bookmark, 
    Share2, 
    CircleDollarSign, 
    BarChart4, 
    Scale, 
    Clock,
    GlobeLock,
    RefreshCcw 
  } from "lucide-react";
  import { toast } from "sonner";
  import { formatCurrency } from "@/lib/format";
  import { formatNumber } from "@/lib/format";
  import { formatPercentage } from "@/lib/format";
  import { getColorForPercentChange } from "@/lib/format";
  import { useState } from "react";
  import { Button } from "./ui/button";
  import { Separator } from "./ui/separator";
  interface CoinDetailModalProps {
    coinId: string | null;
    isOpen: boolean;
    onClose: () => void;
  }
 

interface CoinDetailModalProps {
  coinId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CoinDetailModal = ({ coinId, isOpen, onClose }: CoinDetailModalProps) => {
  const [retryCount, setRetryCount] = useState(0);

  const { data: coin, isLoading, error, refetch } = useQuery({
    queryKey: ["coinDetail", coinId, retryCount],
    queryFn: () => getCoinDetail(coinId || ""),
    enabled: !!coinId && isOpen,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator?.share({
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

  // CSS Styles defined directly inside the component
  const styles = {
    modalContent: `sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] max-h-[90vh] overflow-y-auto p-0 bg-transparent border-none shadow-none`,
    closeButton: `absolute top-4 right-4 z-50 rounded-full bg-secondary/80 p-2 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors`,
    glassContainer: `backdrop-blur-md bg-black/40 border border-white/5 shadow-md rounded-xl p-8 border border-border/50 animate-scale-up`,
    errorContainer: `backdrop-blur-md bg-black/40 border border-white/5 shadow-md rounded-xl p-8 flex flex-col justify-center items-center min-h-[300px] text-center`,
    headerContainer: `flex flex-col md:flex-row justify-between items-start gap-6 mb-8`,
    coinImage: `w-16 h-16 rounded-full shadow-lg`,
    coinTitle: `text-3xl font-bold gradient-text`,
    coinSymbol: `text-lg text-muted-foreground font-medium`,
    rankBadge: `text-sm px-2 py-0.5 bg-secondary rounded-full`,
    explorerLink: `text-sm text-primary flex items-center gap-1 hover:underline`,
    actionButton: `gap-1 hover:shadow-md transition-all`,
    priceContainer: `flex items-center justify-between`,
    priceText: `text-3xl font-bold`,
    gridContainer: `grid grid-cols-1 lg:grid-cols-3 gap-8`,
    statContainer: `bg-secondary/40 rounded-xl p-6 border border-border/30 hover:border-orange-500/20 transition-all`,
    statHeading: `text-lg font-semibold mb-4`,
    statItemContainer: `flex justify-between items-center`,
    statLabel: `flex items-center gap-2 text-sm text-muted-foreground`,
    statValue: `font-medium`,
    progressContainer: `pt-2`,
    progressBar: `h-2 bg-muted rounded-full overflow-hidden`,
    progressFill: `h-full bg-primary`,
    retryButton: `mt-4 flex items-center gap-2`
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={styles.modalContent}>
        <div className="relative w-full h-full">
          <button 
            onClick={onClose}
            className={styles.closeButton}
          >
            <X className="h-5 w-5" />
          </button>
          
          {isLoading ? (
            <div className={styles.glassContainer}>
              <Loader />
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <h2 className="text-xl font-semibold mb-3">Error loading coin data</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't find information for this cryptocurrency.
              </p>
              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
                <Button onClick={handleRetry} className={styles.retryButton}>
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          ) : coin ? (
            <div className="min-h-fit pb-8 px-4 py-4">
              <div className={styles.glassContainer}>
                <div className={styles.headerContainer}>
                  <div className="flex items-center gap-4">
                    <img 
                      src={coin.image.large} 
                      alt={coin.name} 
                      className={styles.coinImage}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className={styles.coinTitle}>{coin.name}</h1>
                        <span className={styles.coinSymbol}>
                          {coin.symbol.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={styles.rankBadge}>
                          Rank #{coin.market_cap_rank}
                        </div>
                        {coin.links?.blockchain_site[0] && (
                          <a 
                            href={coin.links.blockchain_site[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.explorerLink}
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
                      className={styles.actionButton}
                    >
                      <Bookmark className="h-4 w-4" />
                      Watchlist
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={styles.actionButton}
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    {coin.links?.homepage[0] && (
                      <Button
                        variant="default"
                        size="sm"
                        className={styles.actionButton}
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
                
                <div className={styles.gridContainer}>
                  <div className="lg:col-span-2">
                    <div className="flex flex-col gap-2 mb-6">
                      <div className={styles.priceContainer}>
                        <h2 className={styles.priceText}>
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
                    
                    <Separator className="my-6 opacity-30" />
                    
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
                    <div className={styles.statContainer}>
                      <h3 className={styles.statHeading}>Market Stats</h3>
                      
                      <div className="space-y-4">
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <CircleDollarSign className="h-4 w-4" />
                            Market Cap
                          </div>
                          <div className={styles.statValue}>
                            {formatCurrency(coin.market_data.market_cap.usd)}
                          </div>
                        </div>
                        
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <BarChart4 className="h-4 w-4" />
                            24h Trading Vol
                          </div>
                          <div className={styles.statValue}>
                            {formatCurrency(coin.market_data.total_volume.usd)}
                          </div>
                        </div>
                        
                        <Separator className="opacity-30" />
                        
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <Scale className="h-4 w-4" />
                            Circulating Supply
                          </div>
                          <div className={styles.statValue}>
                            {formatNumber(coin.market_data.circulating_supply)} {coin.symbol.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <Scale className="h-4 w-4" />
                            Total Supply
                          </div>
                          <div className={styles.statValue}>
                            {coin.market_data.total_supply 
                              ? formatNumber(coin.market_data.total_supply) 
                              : "∞"} {coin.symbol.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <Scale className="h-4 w-4" />
                            Max Supply
                          </div>
                          <div className={styles.statValue}>
                            {coin.market_data.max_supply 
                              ? formatNumber(coin.market_data.max_supply) 
                              : "∞"} {coin.symbol.toUpperCase()}
                          </div>
                        </div>
                        
                        {coin.market_data.max_supply && (
                          <div className={styles.progressContainer}>
                            <div className="text-xs text-muted-foreground mb-1">
                              Circulating Supply / Max Supply
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill}
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
                        
                        <Separator className="opacity-30" />
                        
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <Clock className="h-4 w-4" />
                            All Time High
                          </div>
                          <div className="text-right">
                            <div className={styles.statValue}>
                              {formatCurrency(coin.market_data.ath.usd)}
                            </div>
                            <div className={`text-xs ${getColorForPercentChange(coin.market_data.ath_change_percentage.usd)}`}>
                              {formatPercentage(coin.market_data.ath_change_percentage.usd)}
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.statItemContainer}>
                          <div className={styles.statLabel}>
                            <Clock className="h-4 w-4" />
                            All Time Low
                          </div>
                          <div className="text-right">
                            <div className={styles.statValue}>
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
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoinDetailModal;