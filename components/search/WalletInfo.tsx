"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, RefreshCw, Clock } from "lucide-react"
import { Wallet, Coins, DollarSign, ListOrdered, Globe } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ErrorCard } from "@/components/ui/error-card"

// Only use timeout for Etherscan, not for Infura
const ETHERSCAN_TIMEOUT = 120000; // 30 seconds

interface WalletData {
  address: string
  balance: string
  transactionCount: number
  network?: string
}

export default function WalletInfo() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "mainnet"
  const provider = searchParams.get("provider") || "etherscan"
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<"timeout" | "network" | "api" | "notFound" | "unknown">("unknown")
  const [usdValue, setUsdValue] = useState<number | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [loadingTimeElapsed, setLoadingTimeElapsed] = useState(0);
  const timeElapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

    // Only fetch USD rate for ETH networks
    const isEthereumType = network === 'mainnet' || network === 'optimism' || network === 'arbitrum';
    
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
      
      // Fetch USD value if applicable
      if (isEthereumType) {
        try {
          const rateResponse = await fetch(`${baseUrl}/api/eth-usd-rate`, { signal });
          const rateData = await rateResponse.json();
          
          if (!rateData.error) {
            const balanceParts = walletData.balance.split(" ");
            if (balanceParts.length >= 2 && balanceParts[1] === "ETH") {
              const ethBalance = Number.parseFloat(balanceParts[0]);
              setUsdValue(ethBalance * rateData.rate);
            } else {
              setUsdValue(null);
            }
          }
        } catch (err) {
          console.warn("USD rate fetch failed:", err);
          setUsdValue(null);
        }
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (err: any) {
      console.error("Error fetching wallet data:", err);
      
      // Determine error type
      if (err.name === 'AbortError' && provider === 'infura') {
        console.error("Unexpected abort with Infura provider:", err);
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

  if (loading) {
    return (
      <Card className="h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm text-gray-400">
            {provider === 'infura' ? 'Loading wallet data from Infura...' : 'Loading wallet info...'}
          </p>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Time elapsed: {loadingTimeElapsed}s</span>
          </div>
          
          {retryCount > 0 && (
            <p className="text-xs text-gray-500">Attempt {retryCount + 1}</p>
          )}
          
          {provider === 'infura' && (
            <p className="text-xs text-amber-400 text-center px-4">
              Infura searches have no timeout limit.<br/>Please be patient.
            </p>
          )}
        </div>
      </Card>
    )
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
    )
  }

  if (!walletData) {
    return null
  }
  
  // Determine which block explorer to use based on network
  const getBlockExplorerUrl = () => {
    if (network === 'mainnet') {
      return 'https://etherscan.io/address/';
    } else if (network === 'optimism') {
      return 'https://optimistic.etherscan.io/address/';
    } else if (network === 'arbitrum') {
      return 'https://arbiscan.io/address/';
    }
    return null;
  };
  
  const blockExplorerUrl = getBlockExplorerUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Wallet Information</span>
          {isFallbackMode && (
            <span className="text-xs text-amber-500 font-normal">Using Infura (Fallback)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
            <Wallet className="w-6 h-6 text-[#F5B056]" />
            <p>
              <strong>Address:</strong>{" "}
              <span className="text-[#F5B056]">{walletData.address}</span>
              {blockExplorerUrl && (
                <a
                  href={`${blockExplorerUrl}${walletData.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-blue-400 hover:underline"
                >
                  View on Explorer
                </a>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
            <Coins className="w-6 h-6 text-gray-500" />
            <p><strong>Balance:</strong> {walletData.balance}</p>
          </div>

          {usdValue !== null && (
            <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
              <DollarSign className="w-6 h-6 text-green-500" />
              <p><strong>USD Value:</strong> ${usdValue.toFixed(2)}</p>
            </div>
          )}

          <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
            <ListOrdered className="w-6 h-6 text-blue-500" />
            <p><strong>Transaction Count:</strong> {walletData.transactionCount}</p>
          </div>
          
          {walletData.network && (
            <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
              <Globe className="w-6 h-6 text-purple-500" />
              <p><strong>Network:</strong> {walletData.network}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
