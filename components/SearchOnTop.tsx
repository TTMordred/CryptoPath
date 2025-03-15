'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { Search, X, Wallet, Network, ArrowRight } from 'lucide-react';
import { LoadingScreen } from "@/components/loading-screen";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SearchOnTop = () => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<"onchain" | "offchain">("onchain");
  const [ethPrice, setEthPrice] = useState({ price: '1,931.60', change: '+1.41%' });
  const [gasPrice, setGasPrice] = useState('0.462');
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  
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

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced delay for better UX
      if (searchType === "onchain") {
        router.push(`/search/?address=${encodeURIComponent(searchQuery)}&network=mainnet`);
      } else {
        router.push(`/search-offchain/?address=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
      setExpanded(false);
    }
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
            <div className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-2 shadow-[0_0_10px_rgba(245,176,86,0.5)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="white"/>
                  <path d="M4 12L12 16L20 12" fill="white"/>
                  <path d="M4 16L12 20L20 16" fill="white"/>
                </svg>
              </div>
              <div>
                <span className="text-white font-medium">${ethPrice.price}</span>
                <span className={`ml-1 text-xs ${ethPrice.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {ethPrice.change}
                </span>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <div className="px-3 py-1 bg-amber-500/20 rounded-full text-amber-400 border border-amber-500/30">
                <span>Gas: {gasPrice} Gwei</span>
              </div>
            </div>
          </div>

          {/* Search Component */}
            <div 
              ref={searchBarRef}
              className={`relative transition-all duration-300 ease-in-out ml-8 md:ml-6 lg:ml-12 ${
                expanded 
                ? "w-full lg:w-3/5 scale-105" 
                : "w-full md:w-2/5 lg:w-2/5"
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
                  value={searchType}
                  onValueChange={(value) => setSearchType(value as "onchain" | "offchain")}
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