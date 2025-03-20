"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Coins, ArrowUpDown, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import { handleImageError, getDevImageProps } from "@/utils/imageUtils"

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
}

export default function Portfolio() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [portfolio, setPortfolio] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalValue, setTotalValue] = useState(0)
  const [provider, setProvider] = useState<"moralis" | "alchemy" | "combined">("alchemy")
  const [sortField, setSortField] = useState<"value" | "name" | "balance" | "chain">("value")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterChain, setFilterChain] = useState<string | null>(null)
  const [showZeroBalances, setShowZeroBalances] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const tokensPerPage = 5 // Number of tokens to display per page

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
      
      // Filter out zero balances if toggle is off
      const filteredTokens = showZeroBalances 
        ? data.tokens 
        : data.tokens.filter((token: TokenBalance) => 
            parseFloat(token.balance || token.balanceFormatted || '0') > 0
          );
      
      setPortfolio(filteredTokens);
      setTotalValue(data.totalValue);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch portfolio data");
      toast.error("Failed to fetch portfolio data");
    } finally {
      setLoading(false);
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

  const sortedPortfolio = [...portfolio].sort((a, b) => {
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

  const filteredPortfolio = filterChain 
    ? sortedPortfolio.filter(token => token.chain === filterChain) 
    : sortedPortfolio;
    
  // Extract unique chains for the filter dropdown
  const uniqueChains = Array.from(new Set(portfolio.map(token => token.chain)))
    .filter(Boolean) as string[];
    
  // Calculate pagination
  const totalPages = Math.ceil(filteredPortfolio.length / tokensPerPage)
  const paginatedPortfolio = filteredPortfolio.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  )
  
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
        <div className="relative h-8 w-8 mr-2">
          <Image
            src={imageUrl}
            alt={token.symbol || "Token"}
            width={32}
            height={32}
            className="rounded-full"
            onError={(event) => handleImageError(event, "/icons/token-placeholder.png")}
            {...getDevImageProps()} // Add development mode props
          />
        </div>
      );
    }
    return (
      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
        <span className="text-sm font-bold">{token.symbol?.substring(0, 2) || "?"}</span>
      </div>
    );
  };

  const formatChainLogo = (token: TokenBalance) => {
    if (token.chainIcon) {
      return (
        <div className="relative h-5 w-5">
          <Image
            src={token.chainIcon}
            alt={token.chainName || "Chain"}
            width={20}
            height={20}
            className="rounded-full"
            onError={(event) => handleImageError(event, "/icons/chain-placeholder.png")}
            {...getDevImageProps()} // Add development mode props
          />
        </div>
      );
    }
    return null;
  };

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
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-400">Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-500">Error loading portfolio</p>
            <p className="text-gray-400 max-w-md mt-2">{error}</p>
            <Button 
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" 
              onClick={() => address && fetchPortfolio(address)}
            >
              Retry
            </Button>
          </div>
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
        <CardTitle className="text-2xl font-bold text-amber-400">Portfolio</CardTitle>
        <div className="flex items-center">
          <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-400">
            Total: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Badge>
          <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-400">
            {portfolio.length} Tokens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-amber-400">Provider:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "moralis" | "alchemy" | "combined")}
                className="bg-gray-800 border border-amber-500/30 rounded p-1 text-sm text-gray-200"
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
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-amber-400">Filter Chain:</span>
            <select
              value={filterChain || ""}
              onChange={(e) => setFilterChain(e.target.value || null)}
              className="bg-gray-800 border border-amber-500/30 rounded p-1 text-sm text-gray-200"
            >
              <option value="">All Chains</option>
              {uniqueChains.map((chain) => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
            {filterChain && (
              <Button
                variant="ghost"
                onClick={clearFilter}
                className="text-sm text-amber-400 hover:text-amber-300 h-7 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="border border-amber-500/10 rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-amber-950/30">
              <TableRow className="hover:bg-amber-950/20 border-amber-500/20">
                <TableHead className="w-[300px] text-amber-400">Token</TableHead>
                <TableHead className="text-right cursor-pointer text-amber-400" onClick={() => handleSort("balance")}>
                  <div className="flex items-center justify-end">
                    Balance
                    {sortField === "balance" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer text-amber-400" onClick={() => handleSort("value")}>
                  <div className="flex items-center justify-end">
                    Value
                    {sortField === "value" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer text-amber-400" onClick={() => handleSort("chain")}>
                  <div className="flex items-center justify-end">
                    Chain
                    {sortField === "chain" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPortfolio.map((token, idx) => (
                <TableRow 
                  key={`${token.contractAddress || token.token_address}-${token.chain}-${idx}`}
                  className="hover:bg-amber-500/5 border-amber-500/10"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {formatTokenLogo(token)}
                      <div>
                        <div className="font-semibold text-white">{token.name || 'Unknown Token'}</div>
                        <div className="text-xs text-amber-300/80">{token.symbol}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
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
                          <p>{parseFloat(token.balance || token.balanceFormatted || '0').toString()} {token.symbol}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
                    ${(token.usdValue || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
                    <div className="flex items-center justify-end">
                      {formatChainLogo(token)}
                      <span className="ml-1">{token.chainName}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination controls */}
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
      </CardContent>
    </Card>
  );
}
