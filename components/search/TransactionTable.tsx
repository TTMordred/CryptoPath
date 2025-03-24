"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, ExternalLink, RefreshCcw, ArrowUpDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { utils } from 'ethers'
import Link from 'next/link'

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
  network?: string
  gas?: number
  gasPrice?: number
  blockNumber?: number
  nonce?: number
  type?: "transfer" | "swap" | "inflow" | "outflow"
  input?: string
}

interface ApiResponse {
  data?: Transaction[]
  error?: string
  message?: string
}

// Cache for storing transaction data
const CACHE_DURATION = 60000; // 1 minute cache
const transactionCache = new Map<string, {data: Transaction[], timestamp: number}>();

export default function TransactionTable() {
  const searchParams = useSearchParams()
  const address = searchParams?.get("address") ?? null
  const network = searchParams?.get("network") ?? "mainnet"
  const provider = searchParams?.get("provider") ?? "etherscan"
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"all" | "transfer" | "swap" | "inflow" | "outflow">("all")
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  // Refs for debouncing and preventing race conditions
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const pauseAutoRefreshRef = useRef(false);
  
  // Common function signatures for better categorization
  const knownMethods: Record<string, Transaction["type"]> = {
    '0x4a25d94a': 'swap',    // swapExactTokensForTokens
    '0x7ff36ab5': 'swap',    // swapExactETHForTokens
    '0xa9059cbb': 'transfer', // transfer
    '0x23b872dd': 'transfer', // transferFrom
    '0x095ea7b3': 'transfer', // approve
  }

  // Create a cache key based on address, network, provider and page
  const getCacheKey = useCallback(() => {
    return `${address}-${network}-${provider}-${page}`;
  }, [address, network, provider, page]);

  const categorizeTransaction = useCallback((tx: Transaction, userAddress: string): Transaction["type"] => {
    if (!tx.from || !tx.to) return "transfer";
    
    const userAddressLower = userAddress.toLowerCase();
    const fromLower = typeof tx.from === 'string' ? tx.from.toLowerCase() : '';
    const toLower = typeof tx.to === 'string' ? tx.to.toLowerCase() : '';
    
    // Check for known method signatures in input data
    if (tx.input && tx.input !== '0x') {
      const functionSelector = tx.input.slice(0, 10).toLowerCase();
      if (knownMethods[functionSelector]) return knownMethods[functionSelector];
    }
    
    if (fromLower === userAddressLower && toLower === userAddressLower) return "swap";
    if (fromLower === userAddressLower) return "outflow";
    if (toLower === userAddressLower) return "inflow";
    return "transfer";
  }, [knownMethods]);

  // Debounced fetch function to prevent rate limiting
  const debouncedFetch = useCallback((func: () => Promise<void>, delay: number) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Check if we need to delay based on rate limiting
    const now = Date.now();
    const timePassedSinceLastFetch = now - lastFetchTimeRef.current;
    
    // For Etherscan, enforce at least 300ms between requests (max ~3 req/sec)
    const minDelay = provider === 'etherscan' ? 300 : 100;
    const actualDelay = Math.max(delay, minDelay - timePassedSinceLastFetch);
    
    return new Promise<void>(resolve => {
      fetchTimeoutRef.current = setTimeout(async () => {
        lastFetchTimeRef.current = Date.now();
        try {
          await func();
          resolve();
        } catch (err) {
          resolve();
        }
      }, actualDelay);
    });
  }, [provider]);

  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    if (!address || !isMountedRef.current) return;

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cacheKey = getCacheKey();
      const cachedData = transactionCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log('Using cached transaction data');
        setTransactions(cachedData.data);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prevent other fetches during this one
      pauseAutoRefreshRef.current = true;
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_URL || '';
      
      const apiEndpoint = `${baseUrl}/api/transactions?address=${address}&page=${page}&offset=20&network=${network}&provider=${provider}`;
      
      console.log("Fetching transactions from:", apiEndpoint);
      
      const response = await fetch(apiEndpoint);
      if (!isMountedRef.current) return;
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!isMountedRef.current) return;
      
      if (Array.isArray(data)) {
        // Format and categorize transactions
        const processedTransactions = data.map(tx => ({
          ...tx,
          // Add type classification
          type: categorizeTransaction(tx, address)
        }));
        
        // Update cache with new data
        transactionCache.set(getCacheKey(), {
          data: processedTransactions,
          timestamp: Date.now()
        });
        
        setTransactions(processedTransactions);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch transactions";
      setError(errorMessage);
      
      // Only show toast on errors that aren't about finding no transactions
      if (!errorMessage.includes("No transactions found")) {
        toast.error(`Transaction error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      pauseAutoRefreshRef.current = false;
    }
  }, [address, page, network, provider, categorizeTransaction, getCacheKey]);

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle responsive design
  useEffect(() => {
    isMountedRef.current = true;
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch transactions when dependencies change
  useEffect(() => {
    if (address) {
      // Debounce the fetch to prevent rapid requests
      debouncedFetch(() => fetchTransactions(), 100);
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [address, page, network, provider, debouncedFetch, fetchTransactions]);

  // Set up auto-refresh with a reasonable interval (30 seconds)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    if (autoRefresh && address) {
      intervalId = setInterval(() => {
        if (!pauseAutoRefreshRef.current && document.visibilityState === 'visible') {
          debouncedFetch(() => fetchTransactions(true), 500);
        }
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, address, debouncedFetch, fetchTransactions]);

  // Copy to clipboard function
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied!`);
    }).catch(() => {
      toast.error(`Failed to copy ${label}`);
    });
  }, []);

  // Open transaction in block explorer
  const openExternalLink = useCallback((txHash: string) => {
    const baseUrl = 'https://cryptopathabcd.vercel.app/search?address=';
    const address = '0x5b43453fce04b92e190f391a83136bfbecedefd1';
    const network = 'mainnet';
    
    window.open(`${baseUrl}${address}&network=${network}`, '_blank', 'noopener,noreferrer');
  }, []);

  // Helper to truncate addresses/hashes
  const truncateString = (str: string, startChars = 6, endChars = 4) => {
    if (!str) return "";
    if (str.length <= startChars + endChars) return str;
    return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    toast.info('Refreshing transaction data...');
    fetchTransactions(true);
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast.info(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled');
  };

  // Filter transactions based on selected tab
  const filteredTransactions = selectedTab === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === selectedTab);

  if (loading && transactions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="ml-2 text-amber-500">Loading transactions...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (transactions.length === 0 && !loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center h-40 space-y-2">
          <p className="text-center text-gray-400">No transactions found for this address.</p>
          <Button 
            onClick={handleManualRefresh} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2">
          {loading && transactions.length > 0 && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs text-gray-400">Updating...</span>
            </div>
          )}
          <Button 
            onClick={toggleAutoRefresh}
            variant="outline" 
            size="sm"
            className={`text-xs ${autoRefresh ? 'bg-amber-900/20 text-amber-400 border-amber-800' : ''}`}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button 
            onClick={handleManualRefresh} 
            variant="outline" 
            size="icon"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="all" 
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 gap-2 p-1 bg-gradient-to-r from-gray-900 to-black rounded-lg">
            {["all", "transfer", "swap", "inflow", "outflow"].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab}
                className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200 
                  hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                  data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 relative overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No {selectedTab} transactions found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hash</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-[#F5B056] text-sm">
                            {truncateString(tx.id)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(tx.id, 'Hash')}
                            className="h-6 w-6"
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'swap' ? 'bg-purple-900/50 text-purple-300' :
                          tx.type === 'inflow' ? 'bg-green-900/50 text-green-300' :
                          tx.type === 'outflow' ? 'bg-red-900/50 text-red-300' :
                          'bg-gray-800 text-gray-300'
                        }`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[#F5B056] text-sm">
                        <Link href={`/search?address=${tx.from}&network=mainnet`}>
                          <span className="cursor-pointer hover:underline text-[#F5B056]">
                            {truncateString(tx.from)}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[#F5B056] text-sm">
                        <Link href={`/search?address=${tx.to}&network=mainnet`}>
                          <span className="cursor-pointer hover:underline text-[#F5B056]">
                            {truncateString(tx.to)}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>{tx.value}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>
                        {new Date(tx.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(tx.from, 'Address')}
                            className="h-6 w-6"
                          >
                            <Copy size={12} className="text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openExternalLink(tx.id)}
                            className="h-6 w-6"
                          >
                            <ExternalLink size={12} className="text-gray-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Tabs>

        <div className="flex items-center justify-between py-4 px-4 mt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <ArrowUpDown className="mr-1 h-4 w-4 rotate-90 transform scale-x-[-1]" /> Previous
          </Button>
          
          <span className="text-gray-400">
            Page {page}
          </span>
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={filteredTransactions.length < 20 || loading}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Next <ArrowUpDown className="ml-1 h-4 w-4 rotate-90" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
