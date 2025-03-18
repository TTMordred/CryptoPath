'use client';
import React, { useRef, useEffect, useState } from 'react';
import { usePathname } from "next/navigation";
import { Search, X, Wallet, Network, ArrowRight } from 'lucide-react';
import { LoadingScreen } from "@/components/loading-screen";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearch, SearchType } from '@/hooks/use-search';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";

const SearchOnTop = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType: setGlobalSearchType,
    isLoading,
    handleSearch
  } = useSearch();
  const [cryptoPrices, setCryptoPrices] = useState({
    eth: { price: '0.00', change: '0.00%' },
    bnb: { price: '0.00', change: '0.00%' }
  });
  const [gasPrice, setGasPrice] = useState({ price: '0', speed: 'Standard' });
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Map search types for the selector
  const mapSearchTypeToSelector = (type: SearchType) => {
    return type === "Off-Chain" ? "offchain" : "onchain";
  };

  const mapSelectorToSearchType = (type: "onchain" | "offchain"): SearchType => {
    return type === "offchain" ? "Off-Chain" : "On-Chain";
  };
  
  // Fetch real-time prices and gas data
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Format price data helper function
        const formatPriceData = (price: string, priceChange: string) => {
          const formattedPrice = parseFloat(price).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
          
          const changeValue = parseFloat(priceChange);
          const formattedChange = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
          
          return {
            price: formattedPrice,
            change: formattedChange
          };
        };

        // Fetch crypto prices from Binance API
        const [ethResponse, bnbResponse] = await Promise.allSettled([
          fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
          fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BNBUSDT')
        ]);

        const ethData = ethResponse.status === 'fulfilled' && await ethResponse.value.json();
        const bnbData = bnbResponse.status === 'fulfilled' && await bnbResponse.value.json();

        // Calculate prices and percentage changes
        const newPrices = {
          eth: ethData ? formatPriceData(
            ethData.lastPrice, 
            (parseFloat(ethData.priceChangePercent)).toString()
          ) : { price: '0.00', change: '0.00%' },
          
          bnb: bnbData ? formatPriceData(
            bnbData.lastPrice, 
            (parseFloat(bnbData.priceChangePercent)).toString()
          ) : { price: '0.00', change: '0.00%' }
        };
        
        setCryptoPrices(newPrices);

        // Fetch gas prices from Etherscan API
        try {
          const gasResponse = await fetch('/api/etherscan?module=gastracker&action=gasoracle');
          const gasData = await gasResponse.json();
          
          if (gasData.status === "1") {
            setGasPrice({ 
              price: gasData.result.ProposeGasPrice, 
              speed: 'Standard'
            });
          }
        } catch (gasError) {
          console.error("Error fetching gas price data:", gasError);
          // Keep the previous gas price value
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
        // If the API request fails, we'll keep the previous values
      }
    };

    fetchPrices();
    // Refresh data every 30 seconds (Binance API has higher rate limits than CoinGecko)
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to collapse expanded search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Skip rendering on homepage
  if (pathname === "/") {
    return null;
  }

  const onSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await handleSearch(event);
    setExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = () => {
    setExpanded(true);
  };

  return (
    <>
      <div className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-amber-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            {/* Market Data */}
            <div className="hidden lg:flex items-center space-x-6">
            {/* ETH Price */}
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-[#627EEA] flex items-center justify-center mr-2 shadow-[0_0_10px_rgba(98,126,234,0.5)]">
              <svg width="12" height="12" viewBox="0 0 256 417" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <g>
                <polygon fill="#FFFFFF" points="127.9611 0 125.1661 9.5 125.1661 285.168 127.9611 287.958 255.9231 212.32"/>
                <polygon fill="#FFFFFF" points="127.962 0 0 212.32 127.962 287.959 127.962 154.158"/>
                <polygon fill="#FFFFFF" points="127.9609 312.1866 126.3859 314.1066 126.3859 412.3056 127.9609 416.9066 255.9999 236.5866"/>
                <polygon fill="#FFFFFF" points="127.962 416.9052 127.962 312.1852 0 236.5852"/>
                </g>
              </svg>
              </div>
              <div>
              <span className="text-white font-medium text-sm">${cryptoPrices.eth.price}</span>
              <span className={`ml-1 text-xs ${cryptoPrices.eth.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {cryptoPrices.eth.change}
              </span>
              </div>
            </div>
            
            {/* BNB Price */}
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-[#F3BA2F] flex items-center justify-center mr-2 shadow-[0_0_10px_rgba(243,186,47,0.5)]">
              <svg width="12" height="12" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M512 64L512 64L512 64L512 64L512 64L512 64L512 64L512 64L512 64L512 64L512 64L512 64L512 64L311.7 264.3L367.8 320.4L512 176.1L656.2 320.4L712.3 264.3L512 64ZM176.1 512L120 567.9L64 512L120 456.1L176.1 512ZM512 847.9L367.8 703.6L311.7 759.7L512 960L512 960L512 960L512 960L512 960L512 960L512 960L512 960L712.3 759.7L656.2 703.6L512 847.9ZM904 456.1L960 512L904 567.9L847.9 512L904 456.1ZM512 623.9L400.1 512L512 400.1L623.9 512L512 623.9ZM512 400.1Z" fill="white"/>
              </svg>
              </div>
              <div>
              <span className="text-white font-medium text-sm">${cryptoPrices.bnb.price}</span>
              <span className={`ml-1 text-xs ${cryptoPrices.bnb.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {cryptoPrices.bnb.change}
              </span>
              </div>
            </div>

            {/* Gas Price */}
            <div className="flex items-center text-xs">
              <div className="px-3 py-1 bg-amber-500/20 rounded-full text-amber-400 border border-amber-500/30 flex items-center">
              <svg className="w-3 h-3 mr-1.5 text-amber-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5 7.27295L12 12L3.5 7.27295L12 2.54591L20.5 7.27295Z" fill="currentColor"/>
                <path d="M3.5 16.7271L12 21.4541L20.5 16.7271" stroke="currentColor" strokeWidth="2"/>
                <path d="M3.5 12L12 16.7271L20.5 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Gas: {Number(gasPrice.price).toFixed(2)} Gwei</span>
              </div>
            </div>
            </div>

          {/* Search Component */}
          <div 
            ref={searchBarRef}
            className={`relative transition-all duration-300 ease-in-out ${
              expanded 
                ? "w-full lg:w-3/5 scale-105" 
                : "w-full md:w-1/2 lg:w-2/5"
            }`}
          >
            <form 
              onSubmit={handleSearch} 
              className="relative"
            >
              <div className={`flex items-center transition-all duration-300 ${
                expanded
                  ? "bg-gray-900/90 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,176,86,0.3)]" 
                  : "bg-gray-900/70 border border-amber-500/30 hover:border-amber-500/60"
                } rounded-xl overflow-hidden`}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full aspect-square p-2 text-amber-400"
                  onClick={() => expanded && handleSearch}
                >
                  <Search size={18} className="transition-transform duration-300 ease-bounce hover:scale-110" />
                </Button>

                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={expanded ? "Search by Address / Txn Hash / Token / Domain..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleFocus}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-gray-400 h-10"
                />

                {searchQuery.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full aspect-square p-2 text-gray-400 hover:text-red-400"
                    onClick={clearSearch}
                  >
                    <X size={18} className="transition-transform duration-300 ease-bounce hover:scale-110" />
                  </Button>
                )}

                <div className="h-full px-2 flex items-center border-l border-amber-500/20">
                  <Select
                    value={mapSearchTypeToSelector(searchType)}
                    onValueChange={(value) => setGlobalSearchType(mapSelectorToSearchType(value as "onchain" | "offchain"))}
                  >
                    <SelectTrigger className="w-[110px] border-0 bg-transparent focus:ring-0 text-white h-8">
                      <SelectValue placeholder="Search Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 border border-amber-500/30 text-white">
                      <SelectItem value="onchain" className="hover:bg-amber-500/20">On-Chain</SelectItem>
                      <SelectItem value="offchain" className="hover:bg-amber-500/20">Off-Chain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="h-full aspect-square rounded-none bg-amber-500 hover:bg-amber-600 text-black hover:text-white transition-all duration-300"
                >
                  <ArrowRight size={18} />
                </Button>
              </div>
            </form>

            {/* Expanded search features */}
            {expanded && (
              <div className="absolute w-full mt-2 bg-gray-900/90 border border-amber-500/30 rounded-xl p-3 shadow-lg animate-fade-in">
                <div className="text-xs text-amber-400 mb-2">Quick Search</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Popular Tokens", route: "/" },
                    { name: "Recent Transactions", route: "/transactions" },
                    { name: "My Wallets", route: "/" },
                    { name: "Verified Contracts", route: "/" }
                  ].map(item => (
                    <TooltipProvider key={item.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline" 
                            size="sm"
                            className="border-amber-500/20 bg-gray-800/50 text-gray-300 hover:bg-amber-500/10 hover:border-amber-500/40"
                            onClick={() => router.push(item.route)}
                          >
                            {item.name}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Search {item.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right side buttons - only visible on larger screens */}
          <div className="hidden md:flex items-center space-x-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-amber-500/30 bg-transparent hover:bg-amber-500/10 text-amber-400 rounded-full w-8 h-8"
                  >
                    <Wallet size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>My Wallets</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-amber-500/30 bg-transparent hover:bg-amber-500/10 text-amber-400 rounded-full w-8 h-8"
                  >
                    <Network size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Network Status</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <LoadingScreen isLoading={isLoading} />
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default SearchOnTop;