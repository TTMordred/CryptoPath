import { useQuery } from "@tanstack/react-query";
import { getCoinDetail } from "@/lib/api/coinApi";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  // CSS Styles với hiệu ứng và màu sắc mới
  const styles = {
    modalContent: `sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] max-h-[90vh] overflow-y-auto p-0 bg-transparent border-none shadow-none`,
    
    closeButton: `absolute top-4 right-4 z-50 rounded-full bg-secondary/80 p-2 text-foreground hover:bg-[#F6b355] hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg`,
    
    glassContainer: `backdrop-blur-md bg-black/40 border border-[#F6b355]/10 shadow-lg rounded-xl p-8 border-border/50 animate-fadeIn transition-all duration-500 hover:border-[#F6b355]/30 hover:shadow-[#F6b355]/10 hover:shadow-xl`,
    
    errorContainer: `backdrop-blur-md bg-black/40 border border-[#F6b355]/10 shadow-md rounded-xl p-8 flex flex-col justify-center items-center min-h-[300px] text-center transition-all duration-300`,
    
    headerContainer: `flex flex-col md:flex-row justify-between items-start gap-6 mb-8`,
    
    coinImage: `w-16 h-16 rounded-full shadow-lg border border-[#F6b355]/20 transition-transform duration-300 hover:scale-110`,
    
    coinTitle: `text-3xl font-bold bg-gradient-to-r from-[#F6b355] to-amber-400 bg-clip-text text-transparent`,
    
    coinSymbol: `text-lg text-muted-foreground font-medium`,
    
    rankBadge: `text-sm px-2 py-0.5 bg-[#F6b355]/20 text-[#F6b355] rounded-full font-medium`,
    
    explorerLink: `text-sm text-[#F6b355] flex items-center gap-1 hover:underline transition-all duration-300 hover:text-amber-400`,
    
    actionButton: `gap-1 hover:shadow-md transition-all duration-300 hover:border-[#F6b355] hover:text-[#F6b355] focus:ring-2 focus:ring-[#F6b355]/50`,
    
    activeButton: `bg-[#F6b355] text-white gap-1 hover:shadow-md transition-all duration-300 hover:bg-amber-500`,
    
    priceContainer: `flex items-center justify-between`,
    
    priceText: `text-3xl font-bold bg-gradient-to-r from-[#F6b355] to-amber-400 bg-clip-text text-transparent`,
    
    gridContainer: `grid grid-cols-1 lg:grid-cols-3 gap-8`,
    
    statContainer: `bg-secondary/40 rounded-xl p-6 border border-border/30 hover:border-[#F6b355]/40 transition-all duration-300 transform hover:translate-y-[-5px] hover:shadow-lg`,
    
    statHeading: `text-lg font-semibold mb-4 text-[#F6b355]`,
    
    statItemContainer: `flex justify-between items-center py-2 group`,
    
    statLabel: `flex items-center gap-2 text-sm text-muted-foreground group-hover:text-[#F6b355] transition-colors duration-300`,
    
    statValue: `font-medium group-hover:text-[#F6b355] transition-colors duration-300`,
    
    progressContainer: `pt-2`,
    
    progressBar: `h-2 bg-muted rounded-full overflow-hidden transition-all duration-300`,
    
    progressFill: `h-full bg-[#F6b355] transition-all duration-1000 ease-in-out`,
    
    retryButton: `mt-4 flex items-center gap-2 hover:bg-[#F6b355] hover:text-white transition-all duration-300`,
    
    separator: `my-6 opacity-30 bg-[#F6b355]/20`,
    
    aboutText: `text-sm text-muted-foreground leading-relaxed hover:text-white transition-colors duration-300`,
    
    percentChangePositive: `text-emerald-400 flex items-center gap-1 transition-all duration-300`,
    
    percentChangeNegative: `text-rose-400 flex items-center gap-1 transition-all duration-300`,
  };

  // Animation keyframes (định nghĩa trong CSS global hoặc thêm vào <style> tag)
  const keyframes = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes scale-up {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out forwards;
    }
    
    .animate-scale-up {
      animation: scale-up 0.4s ease-out forwards;
    }
  `;

  // Color function được cập nhật
  const getColorClass = (percentage: number) => {
    return percentage >= 0 ? styles.percentChangePositive : styles.percentChangeNegative;
  };

  return (
    <>
      <style>{keyframes}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={styles.modalContent}>
          <DialogTitle className="sr-only">
            {coin ? `${coin.name} Details` : "Coin Details"}
          </DialogTitle>
          <div className="relative w-full h-full">
            <button 
              onClick={onClose}
              className={styles.closeButton}
            >
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
                          className={styles.activeButton}
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
                          <div className={`flex items-center gap-1 text-sm font-medium ${getColorClass(coin.market_data.price_change_percentage_24h)}`}>
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
                      
                      <Separator className={styles.separator} />
                      
                      <div className="mb-6">
                        <h3 className={styles.statHeading}>About {coin.name}</h3>
                        <div 
                          className={styles.aboutText}
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
                              <CircleDollarSign className="h-4 w-4 text-[#F6b355]" />
                              Market Cap
                            </div>
                            <div className={styles.statValue}>
                              {formatCurrency(coin.market_data.market_cap.usd)}
                            </div>
                          </div>
                          
                          <div className={styles.statItemContainer}>
                            <div className={styles.statLabel}>
                              <BarChart4 className="h-4 w-4 text-[#F6b355]" />
                              24h Trading Vol
                            </div>
                            <div className={styles.statValue}>
                              {formatCurrency(coin.market_data.total_volume.usd)}
                            </div>
                          </div>
                          
                          <Separator className={styles.separator} />
                          
                          <div className={styles.statItemContainer}>
                            <div className={styles.statLabel}>
                              <Scale className="h-4 w-4 text-[#F6b355]" />
                              Circulating Supply
                            </div>
                            <div className={styles.statValue}>
                              {formatNumber(coin.market_data.circulating_supply)} {coin.symbol.toUpperCase()}
                            </div>
                          </div>
                          
                          <div className={styles.statItemContainer}>
                            <div className={styles.statLabel}>
                              <Scale className="h-4 w-4 text-[#F6b355]" />
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
                              <Scale className="h-4 w-4 text-[#F6b355]" />
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
                              <div className="text-xs text-right mt-1 text-[#F6b355]">
                                {Math.round((coin.market_data.circulating_supply / coin.market_data.max_supply) * 100)}%
                              </div>
                            </div>
                          )}
                          
                          <Separator className={styles.separator} />
                          
                          <div className={styles.statItemContainer}>
                            <div className={styles.statLabel}>
                              <Clock className="h-4 w-4 text-[#F6b355]" />
                              All Time High
                            </div>
                            <div className="text-right">
                              <div className={styles.statValue}>
                                {formatCurrency(coin.market_data.ath.usd)}
                              </div>
                              <div className={`text-xs ${getColorClass(coin.market_data.ath_change_percentage.usd)}`}>
                                {formatPercentage(coin.market_data.ath_change_percentage.usd)}
                              </div>
                            </div>
                          </div>
                          
                          <div className={styles.statItemContainer}>
                            <div className={styles.statLabel}>
                              <Clock className="h-4 w-4 text-[#F6b355]" />
                              All Time Low
                            </div>
                            <div className="text-right">
                              <div className={styles.statValue}>
                                {formatCurrency(coin.market_data.atl.usd)}
                              </div>
                              <div className={`text-xs ${getColorClass(coin.market_data.atl_change_percentage.usd)}`}>
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
    </>
  );
};

export default CoinDetailModal;