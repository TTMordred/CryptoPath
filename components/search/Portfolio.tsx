"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Loader2, Coins, ArrowUpDown, ArrowLeft, ArrowRight, AlertCircle, 
  Search, TrendingUp, TrendingDown, PieChart, Grid3X3, List, 
  RefreshCcw, Filter, ChevronDown, ChevronUp, Info, DollarSign
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import Image from "next/image"
import { handleImageError, getDevImageProps } from "@/utils/imageUtils"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { PieChart as PieChartComponent, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

interface TokenBalance {
  token?: string
  contractAddress?: string
  token_address?: string
  name?: string
  symbol?: string
  balance?: string
  balanceFormatted?: string
  decimals?: number
  usdPrice?: number
  usdValue?: number
  chain?: string
  chainName?: string
  chainIcon?: string
  logo?: string
  thumbnail?: string
  priceChange24h?: number
}

interface ChartData {
  name: string
  symbol: string
  value: number
  color: string
}

export default function Portfolio() {
  const searchParams = useSearchParams()
  const address = searchParams?.get("address") ?? null
  const [portfolio, setPortfolio] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalValue, setTotalValue] = useState(0)
  const [provider, setProvider] = useState<"moralis" | "alchemy" | "combined">("alchemy")
  const [sortField, setSortField] = useState<"value" | "name" | "balance" | "chain">("value")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterChain, setFilterChain] = useState<string | null>(null)
  const [showZeroBalances, setShowZeroBalances] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "cards" | "chart">("table")
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"table" | "cards" | "chart">("table")
  const [hoverData, setHoverData] = useState<ChartData | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const tokensPerPage = viewMode === "table" ? 5 : 8

  // Color palette for charts
  const COLORS = ['#F59E0B', '#F97316', '#D97706', '#B45309', '#92400E', '#78350F', '#A16207', '#854D0E', '#713F12'];
  
  useEffect(() => {
    if (address) {
      fetchPortfolio(address);
    }
  }, [address, provider, showZeroBalances]);

  const fetchPortfolio = async (walletAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolio?address=${walletAddress}&provider=${provider}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch portfolio data");
      }

      const data = await response.json();
      
      // Add mock price change data for demo purposes
      const tokensWithPriceChange = data.tokens.map((token: TokenBalance) => ({
        ...token,
        priceChange24h: Math.random() * 20 - 10 // Random value between -10% and +10%
      }));
      
      // Filter out zero balances if toggle is off
      const filteredTokens = showZeroBalances 
        ? tokensWithPriceChange 
        : tokensWithPriceChange.filter((token: TokenBalance) => 
            parseFloat(token.balance || token.balanceFormatted || '0') > 0
          );
      
      setPortfolio(filteredTokens);
      setTotalValue(data.totalValue);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch portfolio data");
      toast.error("Failed to fetch portfolio data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (address && !isRefreshing) {
      setIsRefreshing(true);
      fetchPortfolio(address);
      toast.success("Refreshing portfolio data...");
    }
  };

  const handleSort = (field: "value" | "name" | "balance" | "chain") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleTokenClick = (token: TokenBalance) => {
    setSelectedToken(token);
  };

  const getSearchResults = (tokens: TokenBalance[]) => {
    if (!searchQuery) return tokens;
    
    const query = searchQuery.toLowerCase();
    return tokens.filter(token => 
      (token.name?.toLowerCase().includes(query) || 
       token.symbol?.toLowerCase().includes(query) ||
       token.chainName?.toLowerCase().includes(query))
    );
  };

  const sortedPortfolio = useMemo(() => {
    return [...portfolio].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "value":
          comparison = (a.usdValue || 0) - (b.usdValue || 0);
          break;
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "balance":
          const aBalance = parseFloat(a.balance || a.balanceFormatted || "0");
          const bBalance = parseFloat(b.balance || b.balanceFormatted || "0");
          comparison = aBalance - bBalance;
          break;
        case "chain":
          comparison = (a.chainName || "").localeCompare(b.chainName || "");
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [portfolio, sortField, sortDirection]);

  const filteredPortfolio = useMemo(() => {
    const chainFiltered = filterChain 
      ? sortedPortfolio.filter(token => token.chain === filterChain) 
      : sortedPortfolio;
    
    return getSearchResults(chainFiltered);
  }, [sortedPortfolio, filterChain, searchQuery]);
    
  // Extract unique chains for the filter dropdown
  const uniqueChains = useMemo(() => {
    return Array.from(new Set(portfolio.map(token => token.chain)))
      .filter(Boolean) as string[];
  }, [portfolio]);
    
  // Calculate pagination
  const totalPages = Math.ceil(filteredPortfolio.length / tokensPerPage);
  const paginatedPortfolio = filteredPortfolio.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  );
  
  // Calculate chart data
  const chartData = useMemo(() => {
    // Take top 5 by value
    const topTokens = [...filteredPortfolio]
      .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0))
      .slice(0, 5);
    
    // Calculate others
    const topTokensValue = topTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    const othersValue = totalValue - topTokensValue;
    
    // Create chart data array
    const data: ChartData[] = topTokens.map((token, index) => ({
      name: token.name || 'Unknown',
      symbol: token.symbol || '?',
      value: token.usdValue || 0,
      color: COLORS[index % COLORS.length]
    }));
    
    // Add others if significant
    if (othersValue > 0) {
      data.push({
        name: 'Others',
        symbol: 'OTHERS',
        value: othersValue,
        color: '#6B7280'
      });
    }
    
    return data;
  }, [filteredPortfolio, totalValue]);
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const clearFilter = () => {
    setFilterChain(null);
  };

  const toggleShowZeroBalances = () => {
    setShowZeroBalances(!showZeroBalances);
  };

  const formatTokenLogo = (token: TokenBalance) => {
    if (token.logo || token.thumbnail) {
      const imageUrl = token.logo || token.thumbnail || "/icons/token-placeholder.png";
      return (
        <div className="relative h-8 w-8 mr-3 flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="overflow-hidden rounded-full border border-amber-500/20 shadow-glow-sm"
          >
            <Image
              src={imageUrl}
              alt={token.symbol || "Token"}
              width={32}
              height={32}
              className="rounded-full object-cover"
              onError={(event) => handleImageError(event, "/icons/token-placeholder.png")}
              {...getDevImageProps()} // Add development mode props
            />
          </motion.div>
        </div>
      );
    }
    return (
      <div className="flex-shrink-0 h-8 w-8 bg-amber-500/20 rounded-full flex items-center justify-center mr-3 border border-amber-500/30 shadow-glow-sm">
        <span className="text-sm font-bold text-amber-400">{token.symbol?.substring(0, 2) || "?"}</span>
      </div>
    );
  };

  const formatChainLogo = (token: TokenBalance) => {
    if (token.chainIcon) {
      return (
        <div className="relative h-5 w-5 flex-shrink-0">
          <Image
            src={token.chainIcon}
            alt={token.chainName || "Chain"}
            width={20}
            height={20}
            className="rounded-full border border-gray-700/50"
            onError={(event) => handleImageError(event, "/icons/chain-placeholder.png")}
            {...getDevImageProps()} // Add development mode props
          />
        </div>
      );
    }
    return (
      <div className="h-5 w-5 bg-gray-700/50 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-gray-300">{token.chainName?.substring(0, 1) || "?"}</span>
      </div>
    );
  };

  // Improved token detail view
  const TokenDetailView = ({ token }: { token: TokenBalance }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800 border border-amber-500/20 rounded-md p-6 mb-4 relative"
    >
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setSelectedToken(null)}
        className="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor"></path>
        </svg>
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex flex-col items-center">
          <div className="h-24 w-24 flex-shrink-0 mb-3">
            {token.logo || token.thumbnail ? (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="h-full w-full rounded-full overflow-hidden border-2 border-amber-500/30 shadow-glow-sm"
              >
                <Image
                  src={token.logo || token.thumbnail || "/icons/token-placeholder.png"}
                  alt={token.symbol || "Token"}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                  onError={(event) => handleImageError(event, "/icons/token-placeholder.png")}
                  {...getDevImageProps()}
                />
              </motion.div>
            ) : (
              <div className="h-24 w-24 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-500/30 shadow-glow-sm">
                <span className="text-3xl font-bold text-amber-500">{token.symbol?.substring(0, 2) || "?"}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-400">Token ID</div>
            <Badge className="bg-amber-500/10 border border-amber-500/30 text-amber-300 mt-1 truncate max-w-[150px]" title={token.token_address || token.contractAddress}>
              {(token.token_address || token.contractAddress || "").substring(0, 6) + "..." + (token.token_address || token.contractAddress || "").slice(-4)}
            </Badge>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1 truncate">{token.name || "Unknown Token"}</h3>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold">
              {token.symbol || "?"}
            </Badge>
            {token.chainName && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {token.chainName}
              </Badge>
            )}
            <Badge className="bg-gray-700/50 text-gray-300 border-gray-600/30">
              Token
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">Balance</div>
              <div className="text-lg font-semibold text-white">
                {parseFloat(token.balance || token.balanceFormatted || '0').toLocaleString(undefined, {
                  maximumFractionDigits: 6
                })} <span className="text-amber-400">{token.symbol}</span>
              </div>
            </div>
            
            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">Value</div>
              <div className="text-lg font-semibold text-white">
                ${parseFloat(String(token.usdValue || 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            
            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">Price</div>
              <div className="text-lg font-semibold text-white flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                {(token.usdPrice || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </div>
            </div>
            
            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700/30">
              <div className="text-sm text-gray-400 mb-1">24h Change</div>
              <div className={`text-lg font-semibold flex items-center ${(token.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(token.priceChange24h || 0) >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {Math.abs(token.priceChange24h || 0).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {token.contractAddress && (
        <div className="mt-5 bg-gray-900/50 p-4 rounded-md border border-gray-700/30">
          <div className="text-sm text-gray-400 mb-1">Contract Address</div>
          <div className="text-sm font-mono text-gray-300 break-all bg-gray-800/70 p-2 rounded border border-gray-700/30">
            {token.contractAddress || token.token_address}
          </div>
        </div>
      )}
      
      <div className="flex justify-center gap-3 mt-6">
        <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
          View on Explorer
        </Button>
        <Button variant="ghost" onClick={() => setSelectedToken(null)} className="text-gray-300 hover:text-white">
          Go Back
        </Button>
      </div>
    </motion.div>
  );

  // Card view component for tokens with improved layout
  const TokenCard = ({ token }: { token: TokenBalance }) => (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 8px 20px -5px rgba(245, 158, 11, 0.25)" }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="bg-gray-800/70 hover:bg-gray-800 border border-amber-500/10 hover:border-amber-500/30 
                rounded-md p-4 cursor-pointer h-full transition-colors duration-200"
      onClick={() => handleTokenClick(token)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center min-w-0">
          {formatTokenLogo(token)}
          <div className="min-w-0">
            <div className="font-semibold text-white text-base truncate">{token.symbol}</div>
            <div className="text-xs text-gray-400 truncate max-w-full">{token.name || 'Unknown Token'}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <div className="text-sm text-gray-300 font-semibold">
            ${parseFloat(String(token.usdValue || 0)).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className={`text-xs flex items-center justify-end ${(token.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(token.priceChange24h || 0) >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {Math.abs(token.priceChange24h || 0).toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t border-amber-500/10 flex justify-between items-center">
        <span className="text-sm text-gray-300 truncate max-w-[150px]" title={token.balanceFormatted}>
          {parseFloat(token.balance || token.balanceFormatted || '0').toLocaleString(undefined, {
            maximumFractionDigits: 4
          })}
        </span>
        <div className="flex items-center bg-gray-900/60 px-2 py-1 rounded-full">
          {formatChainLogo(token)}
          <span className="text-xs text-gray-400 ml-1 truncate max-w-[80px]">{token.chainName}</span>
        </div>
      </div>
    </motion.div>
  );

  // Improved table view with consistent sizing and pagination
  const renderTableView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="border border-amber-500/10 rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-amber-950/30">
            <TableRow className="hover:bg-amber-950/20 border-amber-500/20">
              <TableHead className="w-[280px] text-amber-400">Token</TableHead>
              <TableHead className="text-right cursor-pointer text-amber-400" onClick={() => handleSort("balance")}>
                <div className="flex items-center justify-end">
                  Balance
                  {sortField === "balance" && (
                    sortDirection === "asc" ? 
                      <ChevronUp size={16} className="ml-1" /> : 
                      <ChevronDown size={16} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer text-amber-400" onClick={() => handleSort("value")}>
                <div className="flex items-center justify-end">
                  Value
                  {sortField === "value" && (
                    sortDirection === "asc" ? 
                      <ChevronUp size={16} className="ml-1" /> : 
                      <ChevronDown size={16} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer text-amber-400" onClick={() => handleSort("chain")}>
                <div className="flex items-center justify-end">
                  Chain
                  {sortField === "chain" && (
                    sortDirection === "asc" ? 
                      <ChevronUp size={16} className="ml-1" /> : 
                      <ChevronDown size={16} className="ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-center text-amber-400">24h</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPortfolio.map((token, idx) => (
              <motion.tr 
                key={`${token.contractAddress || token.token_address}-${token.chain}-${idx}`}
                className="hover:bg-amber-500/5 border-amber-500/10 cursor-pointer group"
                onClick={() => handleTokenClick(token)}
                whileHover={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center w-full">
                    {formatTokenLogo(token)}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white truncate">{token.name || 'Unknown Token'}</div>
                      <div className="text-xs text-amber-300/80 truncate">{token.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-gray-300 whitespace-nowrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {parseFloat(token.balance || token.balanceFormatted || '0').toLocaleString(undefined, {
                            maximumFractionDigits: 6
                          })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{parseFloat(token.balance || token.balanceFormatted || '0').toString()} {token.symbol}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right text-gray-300 whitespace-nowrap">
                  <span>
                    ${(parseFloat(String(token.usdValue || 0))).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </TableCell>
                <TableCell className="text-right text-gray-300">
                  <div className="flex items-center justify-end">
                    {formatChainLogo(token)}
                    <span className="ml-1 truncate max-w-[120px]">{token.chainName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center justify-center 
                    ${(token.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(token.priceChange24h || 0) >= 0 ? 
                      <TrendingUp className="mr-1 h-3 w-3" /> : 
                      <TrendingDown className="mr-1 h-3 w-3" />}
                    {Math.abs(token.priceChange24h || 0).toFixed(1)}%
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls for table view */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          
          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            onClick={nextPage} 
            disabled={currentPage === totalPages}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );

  // Improved card grid view with consistent sizing and pagination
  const renderCardView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedPortfolio.map((token, idx) => (
          <motion.div
            key={`card-${token.contractAddress || token.token_address}-${token.chain}-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="h-full"
          >
            <TokenCard token={token} />
          </motion.div>
        ))}
      </div>

      {/* Empty state for card view when filtered results are empty */}
      {paginatedPortfolio.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Search className="w-12 h-12 text-amber-500/30 mb-4" />
          <p className="text-gray-400">No tokens match your search</p>
          {searchQuery && (
            <Button 
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="mt-2 text-amber-400 hover:text-amber-300"
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* Pagination for cards */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          
          <div className="flex items-center">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Logic to show correct page numbers with ellipsis
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i < 4 ? i + 1 : totalPages;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = i < 1 ? 1 : totalPages - 4 + i;
              } else {
                pageNumber = i < 1 ? 1 : (i === 4 ? totalPages : currentPage + i - 2);
              }
              
              // Display ellipsis or page number
              return (
                <Button
                  key={`page-${i}`}
                  variant={currentPage === pageNumber ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`mx-1 w-9 h-9 p-0 ${
                    currentPage === pageNumber 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-gray-400 hover:text-amber-400'
                  } ${(i === 1 && pageNumber > 2 && currentPage > 3) || (i === 3 && pageNumber < totalPages - 1 && currentPage < totalPages - 2) ? 'font-bold' : ''}`}
                >
                  {(i === 1 && pageNumber > 2 && currentPage > 3) || (i === 3 && pageNumber < totalPages - 1 && currentPage < totalPages - 2) 
                    ? '...' 
                    : pageNumber}
                </Button>
              );
            })}
          </div>
          
          <Button 
            onClick={nextPage} 
            disabled={currentPage === totalPages}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );

  // Loading skeletons with animation
  const TableSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-700 rounded-full" />
            <div>
              <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-12 bg-gray-700/60 rounded" />
            </div>
          </div>
          <div className="flex-1" />
          <div className="h-4 w-20 bg-gray-700 rounded" />
          <div className="h-4 w-20 bg-gray-700 rounded" />
          <div className="h-4 w-16 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );

  const CardsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-gray-800/70 border border-gray-700 rounded-md p-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-700 rounded-full" />
              <div>
                <div className="h-4 w-16 bg-gray-700 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-700/60 rounded" />
              </div>
            </div>
            <div className="h-8 w-16 bg-gray-700 rounded" />
          </div>
          <div className="mt-2 flex justify-between">
            <div className="h-3 w-16 bg-gray-700 rounded" />
            <div className="h-3 w-12 bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold text-amber-400">Portfolio</CardTitle>
          <div className="animate-pulse">
            <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-400">
              Loading...
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
          {viewMode === "table" ? <TableSkeleton /> : <CardsSkeleton />}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="mt-4 bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-400">Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-500">Error loading portfolio</p>
            <p className="text-gray-400 max-w-md mt-2">{error}</p>
            <Button 
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" 
              onClick={() => address && fetchPortfolio(address)}
            >
              Retry
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (portfolio.length === 0) {
    return (
      <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-400">Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Coins className="w-16 h-16 text-amber-500/40 mb-4" />
          <p className="text-gray-300 text-lg font-medium">No tokens found for this address</p>
          <p className="text-gray-400 text-sm mt-2">Try switching providers or enabling zero balances</p>
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-amber-400">Provider:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "moralis" | "alchemy" | "combined")}
                className="bg-gray-800 border border-amber-500/30 rounded p-1 text-sm text-white"
              >
                {/* <option value="moralis">Moralis</option> */}
                <option value="alchemy">Alchemy</option>
                {/* <option value="combined">Combined</option> */}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-amber-400">Show Zero Balances:</span>
              <Switch 
                checked={showZeroBalances} 
                onCheckedChange={toggleShowZeroBalances}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal state with data
  return (
    <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold text-amber-400 flex items-center">
          <Coins className="mr-2 h-6 w-6" /> Portfolio
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-semibold">
            Total: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
            {portfolio.length} Tokens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {selectedToken ? (
          <AnimatePresence>
            <TokenDetailView token={selectedToken} />
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-wrap items-center justify-between mb-4 gap-3 bg-gray-800/50 p-3 rounded-md border border-amber-500/10">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-amber-400">Provider:</span>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as "moralis" | "alchemy" | "combined")}
                    className="bg-gray-800 border border-amber-500/30 rounded p-1 text-sm text-gray-200"
                  >
                    <option value="alchemy">Alchemy</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-amber-400">Show Zero Balances:</span>
                  <Switch 
                    checked={showZeroBalances} 
                    onCheckedChange={toggleShowZeroBalances}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-amber-400" />
                  <Input
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-8 border-amber-500/30 bg-gray-800 text-gray-200 placeholder:text-gray-400 focus-visible:ring-amber-500 w-[180px]"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 bg-gray-900/60 p-1 rounded-md">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={viewMode === "table" ? "bg-amber-500/20 text-amber-400" : "text-gray-400"}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className={viewMode === "cards" ? "bg-amber-500/20 text-amber-400" : "text-gray-400"}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "chart" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("chart")}
                    className={viewMode === "chart" ? "bg-amber-500/20 text-amber-400" : "text-gray-400"}
                  >
                    <PieChart className="h-4 w-4" />
                  </Button>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400">
                      <Filter className="h-4 w-4 mr-1" /> Filter
                      {filterChain && <span className="ml-1 text-xs">({filterChain})</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border border-amber-500/20 text-gray-200">
                    <DropdownMenuItem 
                      onClick={() => setFilterChain(null)}
                      className={`${!filterChain ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-gray-700'}`}
                    >
                      All Chains
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-amber-500/10" />
                    {uniqueChains.map((chain) => (
                      <DropdownMenuItem 
                        key={chain}
                        onClick={() => setFilterChain(chain)}
                        className={`${filterChain === chain ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-gray-700'}`}
                      >
                        {chain}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Chart View */}
            {viewMode === "chart" && (
              <motion.div 
                className="border border-amber-500/10 rounded-lg p-4 mb-4 bg-gray-800/40"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs defaultValue="distribution" className="w-full">
                  <TabsList className="mb-4 bg-gray-800/70">
                    <TabsTrigger value="distribution" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      <PieChart className="h-4 w-4 mr-1" /> Distribution
                    </TabsTrigger>
                    <TabsTrigger value="value" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      <DollarSign className="h-4 w-4 mr-1" /> Value
                    </TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="distribution" className="mt-0">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/2 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChartComponent>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={120}
                              innerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              onMouseEnter={(data) => setHoverData(data)}
                              onMouseLeave={() => setHoverData(null)}
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                              labelFormatter={(name) => `${name}`}
                            />
                          </PieChartComponent>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <h3 className="text-lg font-semibold text-amber-400 mb-4">Portfolio Distribution</h3>
                        <div className="space-y-3">
                          {chartData.map((item, index) => (
                            <div 
                              key={index} 
                              className={`flex items-center p-2 rounded-md ${hoverData === item ? 'bg-gray-700' : ''}`}
                            >
                              <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: item.color }} />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div className="font-medium text-white flex items-center gap-1">
                                    {item.name}
                                    <Badge variant="outline" className="text-xs bg-transparent border-amber-500/20 text-amber-300">
                                      {item.symbol}
                                    </Badge>
                                  </div>
                                  <div className="text-gray-300">${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                </div>
                                <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-amber-500 h-1 rounded-full" 
                                    style={{ width: `${(item.value / totalValue) * 100}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="value" className="mt-0">
                    <div className="flex flex-col space-y-4 h-[350px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800/50 border border-amber-500/10 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Total Value</div>
                          <div className="text-2xl font-bold text-white">
                            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        
                        <div className="bg-gray-800/50 border border-amber-500/10 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Tokens</div>
                          <div className="text-2xl font-bold text-white">{portfolio.length}</div>
                        </div>
                        
                        <div className="bg-gray-800/50 border border-amber-500/10 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Chains</div>
                          <div className="text-2xl font-bold text-white">{uniqueChains.length}</div>
                        </div>
                        
                        <div className="bg-gray-800/50 border border-amber-500/10 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Average Token Value</div>
                          <div className="text-2xl font-bold text-white">
                            ${(totalValue / (portfolio.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto">
                        <Table>
                          <TableHeader className="bg-amber-950/30">
                            <TableRow className="hover:bg-amber-950/20 border-amber-500/20">
                              <TableHead className="text-amber-400">Rank</TableHead>
                              <TableHead className="text-amber-400">Token</TableHead>
                              <TableHead className="text-right text-amber-400">Value</TableHead>
                              <TableHead className="text-right text-amber-400">% of Portfolio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedPortfolio.slice(0, 10).map((token, idx) => (
                              <TableRow 
                                key={`value-${idx}`}
                                className="hover:bg-amber-500/5 border-amber-500/10"
                              >
                                <TableCell className="font-medium text-gray-300">{idx + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {formatTokenLogo(token)}
                                    <div>
                                      <div className="font-semibold text-white">{token.symbol}</div>
                                      <div className="text-xs text-gray-400">{token.chainName}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-gray-300">
                                  ${parseFloat(String(token.usdValue || 0)).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </TableCell>
                                <TableCell className="text-right text-gray-300">
                                  {((parseFloat(String(token.usdValue || 0))) / totalValue * 100).toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {/* Table View with fixed layout */}
            {viewMode === "table" && renderTableView()}

            {/* Cards View with fixed layout */}
            {viewMode === "cards" && renderCardView()}

            {/* No results state */}
            {!loading && filteredPortfolio.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-8 text-center"
              >
                <Search className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white">No tokens found</h3>
                <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                {(searchQuery || filterChain) && (
                  <div className="flex gap-2 mt-4">
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery('')}
                        className="border-amber-500/30 text-amber-400"
                      >
                        Clear Search
                      </Button>
                    )}
                    {filterChain && (
                      <Button 
                        variant="outline" 
                        onClick={clearFilter}
                        className="border-amber-500/30 text-amber-400"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
