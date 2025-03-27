"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Clock, AlertTriangle, Info, Lock, Unlock, ZoomIn, ZoomOut,
  Maximize2, Minimize2, ArrowLeftRight, ExternalLink, Sparkles, History, Check, Copy, ArrowUpRight, ArrowDown
} from "lucide-react";
import { ErrorCard } from "@/components/ui/error-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatEthValue } from "@/components/search/TransactionTable/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import StatusBadge from "@/components/search/TransactionTable/components/StatusBadge";

// Only apply timeout for non-Infura providers - Infura needs unlimited time
const ETHERSCAN_TIMEOUT = 120000; // 120 seconds timeout for Etherscan

// Dynamically import ForceGraph2D with custom options
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  )
});

interface Transaction {
  id: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  gas?: number;
  gasPrice?: number;
  blockNumber?: number;
  nonce?: number;
  input?: string;
  status?: string;
  gasUsed?: number;
}

// Define our node type with our custom properties
export interface GraphNode {
  id: string;
  label: string;
  color: string;
  type: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | GraphNode; 
  target: string | GraphNode; 
  value: number;
  transaction?: Transaction; // Store the full transaction for showing details
  color?: string;
  curvature?: number;
  highlighted?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface TransactionDetailsProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  network: string;
}

// Enhanced random color generation with better contrast
const getRandomColor = () => {
  // Predefined colors with good contrast on dark backgrounds
  const colors = [
    "#f59e0b", // amber-500
    "#10b981", // emerald-500
    "#3b82f6", // blue-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#a855f7", // purple-500
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Format addresses for display
function shortenAddress(address: string): string {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format currency values
function formatValue(value: string): string {
  if (!value) return "0 ETH";
  
  // If value is already formatted, return as is
  if (value.includes("ETH") || value.includes("$")) return value;
  
  // Format numbers with commas
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(num) + " ETH";
}

// Enhanced Transaction details modal component with improved UI
const TransactionDetails = ({ transaction, isOpen, onClose, network }: TransactionDetailsProps) => {
  if (!transaction) return null;
  
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
    toast.success(`${type} copied to clipboard`);
  };
  
  // Get block explorer URL based on network
  const getBlockExplorerUrl = (txHash: string) => {
    if (network === 'optimism') {
      return `https://optimistic.etherscan.io/tx/${txHash}`;
    } else if (network === 'arbitrum') {
      return `https://arbiscan.io/tx/${txHash}`;
    } else {
      // Default to Ethereum mainnet
      return `https://etherscan.io/tx/${txHash}`;
    }
  };
  
  // Get block explorer name based on network
  const getBlockExplorerName = () => {
    if (network === 'optimism') {
      return 'Optimistic Etherscan';
    } else if (network === 'arbitrum') {
      return 'Arbiscan';
    } else {
      return 'Etherscan';
    }
  };
  
  // Determine if this is an inbound or outbound transaction
  const getTransactionDirection = () => {
    // This would need the current address we're viewing to determine
    // For now we'll just show a generic icon
    return <ArrowLeftRight className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl bg-gradient-to-b from-gray-900 to-gray-950 border border-amber-500/20 shadow-lg shadow-amber-900/10 p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0"></div>
          
          <DialogHeader className="p-6 pb-2 border-b border-amber-500/10">
            <motion.div 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-500" />
                Transaction Details
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Transaction {shortenAddress(transaction.id)}
              </DialogDescription>
            </motion.div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] lg:max-h-[600px] pr-4">
            <div className="p-6 space-y-6">
              {/* Transaction Overview Card */}
              <motion.div 
                className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center">
                      <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                      Transaction Hash
                    </h3>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-amber-500/5 opacity-0 group-hover:opacity-100 rounded-lg blur-sm transition duration-300"></div>
                      <div className="relative flex items-center bg-gray-900 p-2 rounded-lg">
                        <code className="text-xs font-mono text-amber-300 truncate overflow-hidden w-full break-all">
                          {transaction.id}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="ml-2 h-7 w-7 opacity-50 hover:opacity-100 hover:bg-gray-800" 
                          onClick={() => copyToClipboard(transaction.id, 'Hash')}
                        >
                          {copiedItem === 'Hash' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-6">
                      <div>
                        <span className="text-xs text-gray-400 block">Status</span>
                        <div className="mt-1">
                          <StatusBadge status={transaction.status} />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Block</span>
                        <span className="text-md font-mono text-amber-400">#{transaction.blockNumber}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center">
                      <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                      Transaction Value
                    </h3>
                    
                    <div className="flex flex-col bg-gray-900 p-3 rounded-lg">
                      <span className="text-2xl font-bold text-white">{formatEthValue(transaction.value)}</span>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm bg-gray-900/50 p-2 rounded-lg">
                      <span className="text-gray-400">Transaction Fee:</span>
                      <span className="font-mono text-amber-400">
                        {((transaction.gasUsed || 0) * (transaction.gasPrice || 0) / 1e18).toFixed(6)} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* From/To Card with Animation */}
              <motion.div 
                className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                  <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                  Transaction Path
                </h3>
                
                <div className="relative">
                  {/* Sender */}
                  <div className="flex flex-col mb-2">
                    <div className="text-xs text-gray-400 mb-1">From</div>
                    <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-amber-500">F</span>
                      </div>
                      <div className="flex-1">
                        <code className="text-sm font-mono text-amber-300 break-all">
                          {transaction.from}
                        </code>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => copyToClipboard(transaction.from, 'From Address')}
                        className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-gray-800"
                      >
                        {copiedItem === 'From Address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center my-2">
                    <motion.div 
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowDown className="h-6 w-6 text-amber-500/50" />
                    </motion.div>
                  </div>
                  
                  {/* Recipient */}
                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400 mb-1">To</div>
                    <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-500">T</span>
                      </div>
                      <div className="flex-1">
                        <code className="text-sm font-mono text-blue-300 break-all">
                          {transaction.to || "Contract Creation"}
                        </code>
                      </div>
                      {transaction.to && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard(transaction.to, 'To Address')}
                          className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-gray-800"
                        >
                          {copiedItem === 'To Address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Transaction Details Card */}
              <motion.div 
                className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                  <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                  Technical Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Timestamp</span>
                    <span className="text-sm text-gray-200">{formatDate(transaction.timestamp)}</span>
                  </div>
                  
                  <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Gas Limit</span>
                    <span className="text-sm text-gray-200">{transaction.gas?.toLocaleString() || 'N/A'}</span>
                  </div>
                  
                  <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Gas Used</span>
                    <span className="text-sm text-gray-200">
                      {transaction.gasUsed?.toLocaleString() || 'N/A'} 
                      {transaction.gasUsed && transaction.gas && (
                        <span className="text-amber-500/70 ml-1">
                          ({((transaction.gasUsed / transaction.gas) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Gas Price</span>
                    <span className="text-sm text-gray-200">
                      {transaction.gasPrice ? `${(transaction.gasPrice / 1e9).toFixed(2)} Gwei` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Nonce</span>
                    <span className="text-sm text-gray-200">{transaction.nonce}</span>
                  </div>
                  
                  <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">Block Confirmation</span>
                    <span className="text-sm text-gray-200">
                      {transaction.blockNumber ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollArea>
          
          {/* Action Buttons */}
          <div className="p-6 border-t border-amber-500/10 bg-black/20">
            <motion.div 
              className="flex justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => window.open(getBlockExplorerUrl(transaction.id), '_blank')}
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all flex items-center gap-2"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View on {getBlockExplorerName()}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open in blockchain explorer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      onClick={() => copyToClipboard(transaction.id, 'Full Transaction')}
                      className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                      {copiedItem === 'Full Transaction' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedItem === 'Full Transaction' ? 'Copied' : 'Copy TX Hash'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy transaction hash to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

function TransactionGraph() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams?.get("address") ?? null;
  const network = searchParams?.get("network") ?? "mainnet";
  const provider = searchParams?.get("provider") ?? "etherscan";
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"timeout" | "network" | "api" | "notFound" | "unknown">("unknown");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingTimeElapsed, setLoadingTimeElapsed] = useState(0);
  const timeElapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const graphRef = useRef<any>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [lastClickedLink, setLastClickedLink] = useState<string | null>(null);
  
  // UI controls state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showTransactionHints, setShowTransactionHints] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (address) {
      // ... existing loading logic ...
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingTimeElapsed(0);
      
      // Create a new AbortController for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // For Infura, we don't use any timeouts to prevent AbortErrors
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // Only set timeout for non-Infura providers
      let timeoutId: NodeJS.Timeout | null = null;
      
      if (provider !== 'infura') {
        // Set up timeout only for non-Infura providers
        timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setErrorType("timeout");
            setError(`The request took too long to complete (${ETHERSCAN_TIMEOUT/1000}s). Please try switching to Infura.`);
            setLoading(false);
            
            // Clear intervals
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            
            if (timeElapsedIntervalRef.current) {
              clearInterval(timeElapsedIntervalRef.current);
              timeElapsedIntervalRef.current = null;
            }
          }
        }, ETHERSCAN_TIMEOUT);
      }
      
      // Set up a progress interval to show simulated loading progress
      progressIntervalRef.current = setInterval(() => {
        setLoadingProgress(prev => {
          // Even slower progress for Infura - never make it look like it's almost done
          const incrementRate = provider === 'infura' ? 0.01 : 0.05;
          const maxProgress = provider === 'infura' ? 80 : 95; // Cap at 80% for Infura
          const newProgress = prev + (maxProgress - prev) * incrementRate;
          return Math.min(newProgress, maxProgress);
        });
      }, 1000);
      
      // Set up time elapsed counter
      timeElapsedIntervalRef.current = setInterval(() => {
        setLoadingTimeElapsed(prev => prev + 1);
      }, 1000);
      
      // Get the base URL dynamically
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_URL || '';
        
      console.log(`Fetching transactions for ${address} on ${network} using ${provider}...`);
        
      // Function to manage Infura API key
      const getInfuraApiKey = () => {
        return process.env.NEXT_PUBLIC_INFURA_KEY || "your-fallback-key";
      };
      
      // Retry mechanism for better error handling
      const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
        let retries = 0;
        while (retries < maxRetries) {
          try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
          } catch (err) {
            retries++;
            if (retries === maxRetries) throw err;
            await new Promise(r => setTimeout(r, 1000 * retries));
          }
        }
        // This ensures TypeScript knows we always return a Response or throw an error
        throw new Error("Failed to fetch after max retries");
      };

      fetchWithRetry(`${baseUrl}/api/transactions?address=${address}&network=${network}&provider=${provider}&offset=50`, {
        signal,
        headers: provider === 'infura' ? { 'X-Infura-Source': 'cryptopath-app', 'Infura-Api-Key': getInfuraApiKey() } : {}
      })
        .then((res) => {
          // res is now guaranteed to be defined
          if (!res.ok) {
            if (res.status === 404) {
              setErrorType("notFound");
              throw new Error(`No transaction data found for this address on ${network}`);
            } else {
              setErrorType("api");
              throw new Error(`API responded with status: ${res.status}`);
            }
          }
          return res.json();
        })
        .then((data: any) => {
          // ... existing data processing logic ...
          if (!Array.isArray(data)) {
            setErrorType("api");
            throw new Error((data as any).error || "Unexpected API response");
          }
          
          const transactions = data as Transaction[];
          
          // Set loading progress to 100%
          setLoadingProgress(100);
          
          if (transactions.length === 0) {
            // Create a simple graph with just the address
            const singleNode = {
              id: address,
              label: shortenAddress(address),
              color: "#f5b056", // Match theme color
              type: "both",
            };
            
            setGraphData({
              nodes: [singleNode],
              links: [],
            });
            
            return;
          }
          
          // Special case for Bitcoin or other networks
          const isBitcoinOrSpecial = network === 'bitcoin' || 
                                    transactions.some(tx => tx.from === "Bitcoin Transaction" || 
                                                           !tx.from || !tx.to ||
                                                           tx.from === "Unknown");
          
          if (isBitcoinOrSpecial) {
            const nodes = new Map<string, GraphNode>();
            const links: GraphLink[] = [];
            
            // Create a simplified view with the address in the center
            nodes.set(address, {
              id: address,
              label: shortenAddress(address),
              color: network === 'bitcoin' ? "#f7931a" : "#f5b056", // Bitcoin orange or default
              type: "both",
            });
            
            // Add transaction nodes around it
            transactions.forEach((tx, index) => {
              if (!tx.id) return; // Skip if no transaction ID
              
              const txNodeId = `tx-${tx.id.substring(0, 8)}`;
              nodes.set(txNodeId, {
                id: txNodeId,
                label: shortenAddress(tx.id),
                color: getRandomColor(),
                type: "transaction",
              });
              
              // Connect address to transaction
              links.push({
                source: address,
                target: txNodeId,
                value: 1,
                transaction: tx,
                color: '#f5b05660' // Semi-transparent amber
              });
            });
            
            setGraphData({
              nodes: Array.from(nodes.values()),
              links,
            });
            
            return;
          }
          
          // Regular EVM chain transaction graph
          const nodes = new Map<string, GraphNode>();
          const links: GraphLink[] = [];

          // Add the main address first with a distinctive color
          nodes.set(address, {
            id: address,
            label: shortenAddress(address),
            color: "#f5b056", // Theme amber color
            type: "both", 
          });

          transactions.forEach((tx) => {
            // Skip transactions with invalid addresses
            if (!tx.from || !tx.to || tx.from === "Bitcoin Transaction" || 
                tx.from === "Unknown" || tx.to === "Unknown") {
              return;
            }
            
            if (!nodes.has(tx.from)) {
              nodes.set(tx.from, {
                id: tx.from,
                label: shortenAddress(tx.from),
                color: tx.from === address ? "#f5b056" : getRandomColor(),
                type: tx.from === address ? "out" : "in",
              });
            }
            
            if (!nodes.has(tx.to)) {
              nodes.set(tx.to, {
                id: tx.to,
                label: shortenAddress(tx.to),
                color: tx.to === address ? "#f5b056" : getRandomColor(),
                type: tx.to === address ? "in" : "out",
              });
            }
            
            // Extract numeric value from the value string
            let value = 1; // Default value
            if (tx.value) {
              const valueMatch = tx.value.match(/[\d.]+/);
              if (valueMatch) {
                value = parseFloat(valueMatch[0]);
                // Cap the value to a reasonable range for visualization
                value = Math.min(Math.max(value * 0.5, 0.5), 3);
              }
            }
            
            // Determine if this is incoming or outgoing
            const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
            const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
            
            // Add some curvature to distinguish between bidirectional links
            const curvature = Math.random() * 0.3 + 0.1; // Random curvature between 0.1 and 0.4
            
            links.push({
              source: tx.from,
              target: tx.to,
              value: value,
              transaction: tx,
              curvature: curvature,
              color: isOutgoing ? 'rgba(239, 68, 68, 0.6)' : // red for outgoing
                      isIncoming ? 'rgba(34, 197, 94, 0.6)' : // green for incoming
                      'rgba(255, 255, 255, 0.3)', // white for others
            });
          });

          setGraphData({
            nodes: Array.from(nodes.values()),
            links,
          });
        })
        .catch((err) => {
          // ... existing error handling logic ...
          console.error("Error fetching transaction data for graph:", err);
          
          if (err.name === 'AbortError') {
            console.debug("Request aborted", { provider, network, timeElapsed: loadingTimeElapsed });
            
            // Special handling for unexpected aborts - shouldn't happen with Infura
            if (provider === 'infura') {
              setErrorType("api");
              setError("The request to Infura was unexpectedly terminated. Please try again.");
            } else {
              setErrorType("timeout");
              setError(`Request timed out after ${loadingTimeElapsed} seconds. Try switching to Infura which can handle longer searches.`);
            }
          } else if (err.message.includes('fetch') || err.message.includes('network')) {
            setErrorType("network");
            setError("Network error. Please check your internet connection.");
          } else if (err.message.includes('not found') || err.message.includes('No transaction data')) {
            setErrorType("notFound");
            if (provider === 'etherscan') {
              console.log("Attempting to switch to Infura as fallback...");
              router.push(`/search?address=${address}&network=${network}&provider=infura`);
              return;
            }
            setError(err.message || "No transactions found for this address");
          } else if (err.message.includes('exceeded') || err.message.includes('rate limit')) {
            setErrorType("api");
            setError("Infura API rate limit exceeded. Please try again later or use a different provider.");
          } else {
            setErrorType("api");
            setError(err.message || "Failed to fetch transaction data for graph");
          }
        })
        .finally(() => {
          // Clear timeout if it exists
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
          
          setLoading(false);
          
          // Clear the intervals
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          if (timeElapsedIntervalRef.current) {
            clearInterval(timeElapsedIntervalRef.current);
            timeElapsedIntervalRef.current = null;
          }
        });
    }
    
    return () => {
      // Cleanup function - make sure to abort any in-progress requests when unmounting
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear intervals
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (timeElapsedIntervalRef.current) {
        clearInterval(timeElapsedIntervalRef.current);
      }
    };
  }, [address, network, provider]);
  
  // Show transaction hint on first render
  useEffect(() => {
    if (graphData && graphData.links.length > 0 && !showTransactionHints) {
      setTimeout(() => {
        toast.info(
          "Click on any transaction line to view details",
          {
            duration: 5000,
            icon: <Sparkles className="text-amber-400" />,
          }
        );
        setShowTransactionHints(true);
      }, 2000);
    }
  }, [graphData, showTransactionHints]);

  // Update onNodeClick to match the expected signature
  const handleNodeClick = useCallback(
    (node: any, event: MouseEvent) => {
      if (node.id && typeof node.id === 'string' && node.id.startsWith('tx-')) {
        return; // Skip clicks on transaction nodes
      }
      
      router.push(`/search/?address=${node.id}&network=${network}&provider=${provider}`);
    },
    [router, network, provider]
  );
  
  // Handle link/edge click to show transaction details
  const handleLinkClick = useCallback(
    (link: any, event: MouseEvent) => {
      if (link.transaction) {
        setSelectedTransaction(link.transaction);
        setIsDialogOpen(true);
        setLastClickedLink(link.transaction.id);
        
        // Highlight the clicked link
        if (graphData) {
          const updatedLinks = graphData.links.map(l => ({
            ...l,
            highlighted: l.transaction?.id === link.transaction?.id
          }));
          
          setGraphData({
            nodes: [...graphData.nodes],
            links: updatedLinks
          });
          
          // Add a visual effect to the clicked link (pulsing)
          setTimeout(() => {
            if (graphRef.current) {
              graphRef.current.refresh();
            }
          }, 100);
        }
      }
    },
    [graphData]
  );
  
  // Handle link hover
  const handleLinkHover = useCallback(
    (link: GraphLink | null) => {
      if (link?.transaction) {
        setHoveredLink(link.transaction.id);
        
        // Change cursor to pointer when hovering over a link
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'pointer';
        }
      } else {
        setHoveredLink(null);
        
        // Reset cursor
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    },
    []
  );
  
  // Get canvas ref from ForceGraph
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    
    // Add tooltip hint on canvas
    if (canvas) {
      canvas.title = "Click on any transaction line to view details";
    }
  }, []);

  // Update nodes to reflect their transaction type
  useEffect(() => {
    if (graphData) {
      const updatedNodes: GraphNode[] = graphData.nodes.map((node) => {
        // Skip transaction nodes
        if (node.id.startsWith('tx-')) {
          return node;
        }
        
        const incoming = graphData.links.filter(link => {
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return targetId === node.id;
        });
        
        const outgoing = graphData.links.filter(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          return sourceId === node.id;
        });
        
        if (incoming.length > 0 && outgoing.length > 0) {
          // Both incoming and outgoing transactions
          return { ...node, type: "both" as "both" };
        } else if (incoming.length > 0) {
          // Only incoming transactions
          return { ...node, type: "in" as "in" };
        } else if (outgoing.length > 0) {
          // Only outgoing transactions
          return { ...node, type: "out" as "out" };
        }
        return node;
      });
      
      if (JSON.stringify(updatedNodes) !== JSON.stringify(graphData.nodes)) {
        // Use the existing graphData rather than a functional update
        setGraphData({
          ...graphData,
          nodes: updatedNodes,
        });
      }
    }
  }, [graphData]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.2, 400); // 20% zoom in with 400ms animation
      setZoomLevel(prevZoom => prevZoom * 1.2);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.2, 400); // 20% zoom out with 400ms animation
      setZoomLevel(prevZoom => prevZoom / 1.2);
    }
  };
  
  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1, 800); // Reset to zoom level 1 with 800ms animation
      setZoomLevel(1);
      
      // Also center the graph
      if (address && graphRef.current.centerAt) {
        // Find the main address node
        const mainNode = graphData?.nodes.find(node => node.id === address);
        if (mainNode) {
          // Center on the main address node
          setTimeout(() => {
            graphRef.current.centerAt(mainNode.x, mainNode.y, 1000);
          }, 100);
        } else {
          // If we can't find the main node, just recenter the graph
          graphRef.current.zoomToFit(800);
        }
      }
    }
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center bg-gray-900 border border-amber-500/20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-1">
            {provider === 'infura'
              ? loadingTimeElapsed > 30
                ? "Processing large transaction history with Infura..."
                : "Loading transaction graph from Infura..."
              : "Loading transaction graph..."}
          </p>
          <div className="w-64 h-2 bg-gray-800 rounded-full mt-2 mb-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-amber-400">{Math.round(loadingProgress)}%</p>
          
          <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Time elapsed: {loadingTimeElapsed}s</span>
          </div>
          
          {provider === 'infura' && (
            <div className="mt-4 max-w-sm px-4">
              <p className="text-xs text-amber-400">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Infura searches have no timeout and may take several minutes to complete for complex wallets. Please be patient.
              </p>
              {loadingTimeElapsed > 30 && (
                <p className="mt-2 text-xs text-amber-500">
                  Still searching... Infura queries can take a long time for addresses with many transactions.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (error && !graphData) {
    return (
      <ErrorCard type={errorType} message={error} />
    );
  }

  if (!graphData) {
    return null;
  }

  return (
    <Card className={`bg-gray-900/95 backdrop-blur-sm border border-amber-500/20 ${isFullscreen ? 'fixed top-0 left-0 right-0 bottom-0 z-50 h-screen w-screen rounded-none' : 'h-[593px]'}`}>
      <CardHeader className="bg-black/20 border-b border-amber-500/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <span className="text-amber-400">Transaction Graph</span>
            {graphData.links.length > 0 ? (
              <Badge variant="outline" className="ml-2 text-xs bg-amber-500/10 border-amber-500/30 text-amber-400">
                {graphData.links.length} {graphData.links.length === 1 ? 'Transaction' : 'Transactions'}
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-xs bg-gray-800 border-gray-700 text-gray-400">
                No Transactions
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              <span className="text-xs">1:1</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`p-0 ${isFullscreen ? 'h-[calc(100vh-116px)]' : 'h-[calc(100%-116px)]'}`}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel={((node: GraphNode) => node.id) as any}
          nodeColor={((node: GraphNode) => node.color) as any}
          linkColor={(link) => (link as any as GraphLink).color || 'rgba(255, 255, 255, 0.2)'}
          linkCurvature={(link) => (link as any as GraphLink).curvature || 0}
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          linkWidth={(link) => (link as any as GraphLink).value || 1}
          nodeCanvasObject={
            ((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
              if (node.x == null || node.y == null) return;
              const { label, type, x, y } = node;
              const fontSize = 4;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              
              // Draw node
              ctx.beginPath();
              const nodeSize = type === "both" ? 5 : 3;
              ctx.arc(x, y, nodeSize, 0, 2 * Math.PI, false);
              
              const isMainNode = node.id === address;
              
              // Node fill style based on type
              if (isMainNode) {
                // Gradient fill for the main node
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeSize * 1.5);
                gradient.addColorStop(0, "#F5B056");
                gradient.addColorStop(1, "#D97706");
                ctx.fillStyle = gradient;
              } else {
                ctx.fillStyle = 
                  type === "in"
                    ? "rgba(34, 197, 94, 0.8)" // Incoming - green
                    : type === "out"
                    ? "rgba(239, 68, 68, 0.8)" // Outgoing - red
                    : "rgba(245, 176, 86, 0.8)"; // Transaction - amber
              }
              ctx.fill();
              
              // Draw label
              ctx.fillStyle = "white";
              ctx.fillText(label, x, y + nodeSize + 4);
            }) as any
          }
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          width={isFullscreen ? window.innerWidth : 580}
          height={isFullscreen ? window.innerHeight - 116 : 510}
        />
      </CardContent>
      <CardFooter className="bg-black/20 border-t border-amber-500/10 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
      </CardFooter>
      <TransactionDetails 
        transaction={selectedTransaction} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        network={network}
      />
    </Card>
  );
}

export default TransactionGraph;