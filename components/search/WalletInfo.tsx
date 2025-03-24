"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle, RefreshCw, Clock, Copy, ExternalLink, QrCode } from "lucide-react"
import { Wallet, Coins, DollarSign, ArrowUpCircle, ArrowDownCircle, NetworkIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ErrorCard } from "@/components/ui/error-card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { QRCodeSVG } from 'qrcode.react'
import { Progress } from "@/components/ui/progress"

// Only use timeout for Etherscan, not for Infura
const ETHERSCAN_TIMEOUT = 120000; // 120 seconds

interface WalletData {
  address: string
  balance: string
  transactionCount: number
  network?: string
}

export default function WalletInfo() {
  const searchParams = useSearchParams()
  const address = searchParams?.get("address") ?? null
  const network = searchParams?.get("network") ?? "mainnet"
  const provider = searchParams?.get("provider") ?? "etherscan"
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<"timeout" | "network" | "api" | "notFound" | "unknown">("unknown")
  const [usdValue, setUsdValue] = useState<number | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [ethPrice, setEthPrice] = useState<number | null>(null)
  const [txHistory, setTxHistory] = useState<{ inbound: number, outbound: number } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [loadingTimeElapsed, setLoadingTimeElapsed] = useState(0);
  const timeElapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const fetchWalletData = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    setLoadingTimeElapsed(0);

    // Create a new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Only set timeout for non-Infura providers
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (provider !== 'infura') {
      // Set up timeout only for non-Infura
      timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setError(`The request took too long to complete. Try switching to Infura provider.`);
          setErrorType("timeout");
          setLoading(false);
          
          // Clear time elapsed interval
          if (timeElapsedIntervalRef.current) {
            clearInterval(timeElapsedIntervalRef.current);
            timeElapsedIntervalRef.current = null;
          }
        }
      }, ETHERSCAN_TIMEOUT);
    }
    
    // Set up time elapsed counter
    timeElapsedIntervalRef.current = setInterval(() => {
      setLoadingTimeElapsed(prev => prev + 1);
    }, 1000);

    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_URL || '';

    // Initial provider to try
    let currentProvider = provider;
    let apiEndpoint = `${baseUrl}/api/wallet?address=${address}&network=${network}&provider=${currentProvider}`;
    
    console.log("Fetching wallet data from:", apiEndpoint);

    try {
      // First attempt with specified provider
      let response = await fetch(apiEndpoint, { signal });
      
      // If Etherscan fails but we originally requested it, try with Infura as fallback
      if (!response.ok && currentProvider === 'etherscan' && !isFallbackMode) {
        console.log("Etherscan API failed, trying Infura as fallback");
        setIsFallbackMode(true);
        currentProvider = 'infura';
        apiEndpoint = `${baseUrl}/api/wallet?address=${address}&network=${network}&provider=${currentProvider}`;
        response = await fetch(apiEndpoint, { signal });
      }
      
      // If still not successful
      if (!response.ok) {
        if (response.status === 404) {
          setErrorType("notFound");
          throw new Error(`Address not found or invalid on ${network}`);
        } else {
          setErrorType("api");
          throw new Error(`API responded with status: ${response.status}`);
        }
      }

      const walletData = await response.json();
      if (walletData.error) {
        setErrorType("api");
        throw new Error(walletData.error);
      }
      
      setWalletData(walletData);
      console.log("Wallet data received:", walletData);

      // Fetch ETH price
      try {
        const priceRes = await fetch(`${baseUrl}/api/eth-usd-rate`);
        const priceData = await priceRes.json();
        setEthPrice(priceData.rate || null);
        
        // Calculate USD value if we have ETH price
        if (priceData.rate) {
          const balanceParts = walletData.balance.split(" ");
          if (balanceParts.length >= 2 && balanceParts[1] === "ETH") {
            const ethBalance = Number.parseFloat(balanceParts[0]);
            setUsdValue(ethBalance * priceData.rate);
          }
        }
      } catch (priceErr) {
        console.warn("Failed to fetch ETH price", priceErr);
      }

      // Generate mock transaction history data
      // This would ideally come from the API
      const txHistory = {
        inbound: Math.round(walletData.transactionCount * 0.4), // 40% inbound
        outbound: Math.round(walletData.transactionCount * 0.6), // 60% outbound
      };
      setTxHistory(txHistory);
      
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (err: any) {
      console.error("Error fetching wallet data:", err);
      
      // Determine error type
      if (err.name === 'AbortError' && provider === 'infura') {
        setErrorType("api");
        setError("The request to Infura was unexpectedly terminated. Please try again.");
      } else if (err.name === 'AbortError') {
        setErrorType("timeout");
        setError("Request timed out. Try switching to Infura provider which has no timeout limits.");
      } else if (err.message.includes('fetch') || err.message.includes('network')) {
        setErrorType("network");
        setError("Network error. Please check your internet connection.");
      } else if (err.message.includes('not found') || err.message.includes('invalid')) {
        setErrorType("notFound");
        setError(err.message || "Address not found or invalid");
      } else {
        setErrorType("api");
        setError(err.message || "Failed to fetch wallet data");
      }
      
      toast.error(`Wallet data error: ${err.message || "Unknown error"}`, {
        description: "Try switching to a different provider or checking the address",
        action: {
          label: 'Retry',
          onClick: () => handleRetry(),
        },
      });
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
      
      // Clear time elapsed interval
      if (timeElapsedIntervalRef.current) {
        clearInterval(timeElapsedIntervalRef.current);
        timeElapsedIntervalRef.current = null;
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchWalletData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (timeElapsedIntervalRef.current) {
        clearInterval(timeElapsedIntervalRef.current);
      }
    };
  }, [address, network, provider]);

  const handleRetry = () => {
    if (retryCount >= 3) {
      // If we've tried 3 times, suggest using a different provider
      toast.info("Multiple retry attempts failed. Consider trying a different provider.");
    }
    setRetryCount(prevCount => prevCount + 1);
    fetchWalletData();
  };

  // Determine which block explorer to use based on network
  const getBlockExplorerUrl = () => {
    if (network === 'optimism') {
      return 'https://optimistic.etherscan.io/address/';
    } else if (network === 'arbitrum') {
      return 'https://arbiscan.io/address/';
    } else {
      return 'https://etherscan.io/address/';
    }
  };
  
  // Get explorer name based on network
  const getExplorerName = () => {
    if (network === 'optimism') {
      return 'Optimism Explorer';
    } else if (network === 'arbitrum') {
      return 'Arbiscan';
    } else {
      return 'Etherscan';
    }
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (!walletData?.address) return;
    
    navigator.clipboard.writeText(walletData.address)
      .then(() => {
        toast.success("Address copied to clipboard!");
      })
      .catch(err => {
        toast.error("Failed to copy address");
        console.error("Copy failed:", err);
      });
  };

  // Format ETH balance to be more readable
  const formatBalance = (balance: string) => {
    if (!balance) return "0.00 ETH";
    
    const parts = balance.split(" ");
    if (parts.length < 2) return balance;
    
    const value = parseFloat(parts[0]);
    const unit = parts[1];
    
    return (
      <span className="flex items-baseline">
        <span className="text-2xl font-bold mr-1">{value.toFixed(4)}</span>
        <span className="text-sm text-gray-400">{unit}</span>
      </span>
    );
  };

  // Calculate percentage change (mock data - would come from API in real app)
  const getPercentageChange = () => {
    // This is mock data - would normally come from API
    const change = Math.random() * 8 - 4; // Random between -4% and +4%
    return {
      value: change.toFixed(2),
      isPositive: change >= 0
    };
  };

  const percentChange = getPercentageChange();

  // Network color based on selected network
  const getNetworkColor = () => {
    switch(network) {
      case 'optimism': return 'text-red-500';
      case 'arbitrum': return 'text-blue-500';
      default: return 'text-purple-500';
    }
  };

  // Network background gradient based on selected network
  const getNetworkGradient = () => {
    switch(network) {
      case 'optimism': return 'from-red-900/20 to-red-950/30';
      case 'arbitrum': return 'from-blue-900/20 to-blue-950/30';
      default: return 'from-purple-900/20 to-purple-950/30';
    }
  };

  if (loading) {
    return (
      <Card className="border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-900/5 rounded-lg"></div>
        <CardContent className="p-0">
          <div className="relative h-[280px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 z-10">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                <div className="absolute inset-0 h-12 w-12 rounded-full blur-xl bg-amber-500/20 animate-pulse"></div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <p className="text-lg font-medium text-amber-500 mb-1">
                    {provider === 'infura' ? 'Loading wallet data from Infura...' : 'Loading wallet info...'}
                  </p>
                  <p className="text-sm text-gray-400 mb-3">Please wait while we fetch your wallet data</p>
                  
                  <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden my-2">
                    <motion.div 
                      className="h-full bg-amber-500"
                      animate={{ 
                        width: ["0%", "100%", "0%"],
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                    <Clock className="h-3 w-3" />
                    <span>Time elapsed: {loadingTimeElapsed}s</span>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {retryCount > 0 && (
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Attempt {retryCount + 1}
                </Badge>
              )}
              
              {provider === 'infura' && loadingTimeElapsed > 10 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xs text-center px-6 mt-4"
                >
                  <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-md">
                    <AlertCircle className="inline h-3 w-3 mr-1" />
                    Infura searches have no timeout limit.
                    {loadingTimeElapsed > 30 && " This may take a few minutes for complex wallets."}
                  </p>
                </motion.div>
              )}
            </div>
            
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,180,40,0.1),rgba(0,0,0,0))]"></div>
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute rounded-full bg-amber-600/30 blur-3xl"
                  style={{
                    width: `${Math.random() * 60 + 40}px`,
                    height: `${Math.random() * 60 + 40}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 10 + 10}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random() * 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorCard
        message={error}
        type={errorType}
        onRetry={handleRetry}
        timeout={errorType === "timeout" ? 30 : undefined}
        suggestion={
          errorType === "timeout" 
            ? "Try switching to a different provider or checking your network connection."
            : errorType === "notFound"
            ? "Check that the address is correct and exists on the selected network."
            : errorType === "network"
            ? "Check your internet connection or try again later."
            : "Try switching to a different provider or waiting a moment before retrying."
        }
      />
    );
  }

  if (!walletData) {
    return null;
  }
  
  const blockExplorerUrl = getBlockExplorerUrl();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5 rounded-lg pointer-events-none"></div>
        
        {/* Top Highlight Border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        
        <CardContent className="p-0 relative z-10">
          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-800">
              <TabsList className="w-full bg-black/20 p-0 h-12">
                <TabsTrigger 
                  value="overview" 
                  className="flex-1 h-full data-[state=active]:bg-gradient-to-b from-amber-500/20 to-transparent data-[state=active]:text-amber-400 rounded-none border-r border-gray-800"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions" 
                  className="flex-1 h-full data-[state=active]:bg-gradient-to-b from-amber-500/20 to-transparent data-[state=active]:text-amber-400 rounded-none"
                >
                  Transactions
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-0 m-0 pt-2">
              {/* Address and Copy Button */}
              <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-black/40 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    <Wallet className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-0.5">Wallet Address</div>
                    <div className="text-white font-mono text-sm">
                      {walletData.address.slice(0, 8)}...{walletData.address.slice(-6)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyAddress}
                          className="h-8 w-8 rounded-lg border-gray-800 bg-black/20 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-200"
                        >
                          <Copy className="h-4 w-4 text-amber-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy address</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowQR(true)}
                          className="h-8 w-8 rounded-lg border-gray-800 bg-black/20 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-200"
                        >
                          <QrCode className="h-4 w-4 text-amber-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Show QR code</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(blockExplorerUrl + walletData.address, '_blank')}
                          className="h-8 w-8 rounded-lg border-gray-800 bg-black/20 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-200"
                        >
                          <ExternalLink className="h-4 w-4 text-amber-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View on {getExplorerName()}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {/* Balance Card */}
              <div className="mt-1 px-6">
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-900/80 to-black/80 border border-amber-500/20 mb-4">
                  <div className="relative px-6 py-5 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute right-0 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -right-20 -bottom-32 w-56 h-56 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    {/* Card Content */}
                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-400">Total Balance</div>
                        {isFallbackMode && (
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500/30 text-[10px]">
                            Using Infura
                          </Badge>
                        )}
                      </div>
                      
                      {/* Balance Value */}
                      <div className="mb-2">{formatBalance(walletData.balance)}</div>
                      
                      {/* USD Value */}
                      <div className="flex items-center">
                        <div className="text-sm font-medium">
                          {usdValue ? (
                            <span className="text-gray-300">${usdValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}</span>
                          ) : (
                            <span className="text-gray-500">USD value unavailable</span>
                          )}
                        </div>
                        
                        <div className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          percentChange.isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          {percentChange.isPositive ? '+' : ''}{percentChange.value}%
                        </div>
                      </div>
                      
                      {/* ETH Price */}
                      {ethPrice && (
                        <div className="text-xs text-gray-500 mt-1">
                          ETH Price: ${ethPrice.toLocaleString()}
                        </div>
                      )}
                      
                      {/* Coins Icon */}
                      <div className="absolute right-0 top-0 opacity-20">
                        <Coins className="h-16 w-16 text-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Transaction Count and Network Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl bg-gradient-to-br from-gray-900/80 to-black/80 border border-amber-500/20 p-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="text-sm text-gray-400 mb-1">Transactions</div>
                      <div className="text-xl font-bold text-white">{walletData.transactionCount.toLocaleString()}</div>
                      <div className="mt-2">
                        {txHistory && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-green-400 flex items-center">
                                <ArrowDownCircle className="h-3 w-3 mr-1" /> In
                              </div>
                              <div className="text-xs">{txHistory.inbound.toLocaleString()}</div>
                            </div>
                            <Progress value={txHistory.inbound / walletData.transactionCount * 100} className="h-1 bg-gray-800 [&>div]:bg-green-500" />
                            
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-red-400 flex items-center">
                                <ArrowUpCircle className="h-3 w-3 mr-1" /> Out
                              </div>
                              <div className="text-xs">{txHistory.outbound.toLocaleString()}</div>
                            </div>
                            <Progress value={txHistory.outbound / walletData.transactionCount * 100} className="h-1 bg-gray-800 [&>div]:bg-red-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl bg-gradient-to-br border p-4 relative overflow-hidden group
                    ${getNetworkGradient()}
                    border-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'purple'}-500/20`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="text-sm text-gray-400 mb-1">Network</div>
                      <div className={`text-xl font-bold capitalize ${getNetworkColor()}`}>
                        {network}
                      </div>
                      <div className="flex items-center mt-2">
                        <div className={`h-2 w-2 rounded-full bg-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'purple'}-500 mr-2`}></div>
                        <div className="text-xs text-gray-400">
                          {walletData.network || network === 'mainnet' ? 'Ethereum Mainnet' : network}
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <Badge className={`bg-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'purple'}-900/20 
                          border-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'purple'}-500/30 
                          text-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'purple'}-400`}>
                          {network === 'optimism' ? 'L2 Rollup' : network === 'arbitrum' ? 'L2 Rollup' : 'L1 Chain'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Network Status Indicators */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-amber-500/20 rounded-xl p-3 mb-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-2 bg-gray-900/50 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Gas Price</div>
                      <div className="text-sm font-medium text-amber-400">
                        {Math.floor(Math.random() * 30 + 20)} Gwei
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center p-2 bg-gray-900/50 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Block Height</div>
                      <div className="text-sm font-medium text-amber-400">
                        #{Math.floor(Math.random() * 1000 + 17500000)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center p-2 bg-gray-900/50 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Network</div>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                        <div className="text-sm font-medium text-green-400">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mb-4 relative z-10">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-amber-500/30 bg-gradient-to-b from-amber-900/20 to-transparent hover:from-amber-900/40 text-amber-400"
                    onClick={() => window.open(blockExplorerUrl + walletData.address, '_blank')}
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    View on {getExplorerName()}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-amber-500/30 bg-gradient-to-b from-amber-900/20 to-transparent hover:from-amber-900/40 text-amber-400"
                    onClick={() => setShowQR(true)}
                  >
                    <QrCode className="mr-1 h-4 w-4" />
                    Show QR Code
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="m-0 p-0">
              <div className="px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-amber-400">Transaction Statistics</h3>
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10">
                    {walletData.transactionCount} Transactions
                  </Badge>
                </div>
                
                {/* Transaction History Cards */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Transaction Volume</h4>
                      
                      <div className="space-y-4">
                        {/* Simulated transaction chart - would be a real chart in production */}
                        <div className="h-16 flex items-end gap-1">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const height = Math.random() * 80 + 20;
                            return (
                              <div
                                key={i}
                                className={`bg-gradient-to-t from-amber-600 to-amber-400 rounded-sm w-full`}
                                style={{ 
                                  height: `${height}%`,
                                  opacity: i === 20 ? 1 : 0.5 + Math.random() * 0.5
                                }}
                              ></div>
                            );
                          })}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-400">Largest Transaction</div>
                            <div className="text-lg font-medium text-amber-400">
                              {(Math.random() * 5).toFixed(2)} ETH
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">First Transaction</div>
                            <div className="text-sm text-gray-300">
                              {new Date(Date.now() - Math.random() * 90 * 86400000).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Transaction Flow</h4>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-900/30 text-green-400 mr-2">
                            <ArrowDownCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Inbound</div>
                            <div className="text-lg font-medium text-green-400">{txHistory?.inbound || 0}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-900/30 text-red-400 mr-2">
                            <ArrowUpCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Outbound</div>
                            <div className="text-lg font-medium text-red-400">{txHistory?.outbound || 0}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-red-500"
                          style={{ 
                            width: '100%',
                            backgroundSize: `${txHistory ? (txHistory.inbound / walletData.transactionCount * 100) : 50}% 100%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-gray-900 border border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Wallet Address QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={walletData.address}
                size={200}
                level="H"
                imageSettings={{
                  src: "/icons/eth-diamond-purple.png",
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-center mt-4 text-sm text-gray-400">
              Use this QR code to easily transfer funds to this wallet
            </p>
            <div className="mt-4 w-full">
              <div className="bg-gray-950 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                <p className="font-mono text-amber-400 break-all text-sm">{walletData.address}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                className="border-amber-500/30 text-amber-400"
                onClick={copyAddress}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
              <Button 
                variant="outline" 
                className="border-amber-500/30 text-amber-400"
                onClick={() => window.open(blockExplorerUrl + walletData.address, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Explorer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Floating Network Indicator with Animation */}
      <div className="absolute -top-3 right-5 transform -translate-y-1/2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Badge className={`
            px-2 py-1
            border-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'amber'}-500/40
            bg-gradient-to-r 
            from-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'amber'}-950/50
            to-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'amber'}-900/20
            text-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'amber'}-300
          `}>
            <div className={`
              h-2 w-2 rounded-full mr-1 inline-block
              bg-${network === 'optimism' ? 'red' : network === 'arbitrum' ? 'blue' : 'amber'}-400
            `}></div>
            {network === 'mainnet' ? 'Ethereum' : network.charAt(0).toUpperCase() + network.slice(1)}
          </Badge>
        </motion.div>
      </div>
      {showQR && (
        <div className="absolute right-0 top-12 z-10 p-4 bg-gray-900 border border-amber-500/30 rounded-lg shadow-lg">
          <QRCodeSVG value={address || ""} size={150} fgColor="#f5b056" bgColor="transparent" />
        </div>
      )}
    </motion.div>
  );
}
