"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { ErrorCard } from "@/components/ui/error-card";

// Only apply timeout for non-Infura providers - Infura needs unlimited time
const ETHERSCAN_TIMEOUT = 120000; // 30 seconds timeout for Etherscan

// Dynamically import ForceGraph2D
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface Transaction {
  id: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
}

// Define our node type with our custom properties.
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

interface GraphData {
  nodes: GraphNode[];
  links: { source: string; target: string; value: number }[];
}

const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

function shortenAddress(address: string): string {
  return `${address.slice(0, 3)}...${address.slice(-2)}`;
}

// A mock function to get a name for an address (replace with your actual logic)
function getNameForAddress(address: string): string | null {
  const mockNames: { [key: string]: string } = {
    "0x1234567890123456789012345678901234567890": "Alice",
    "0x0987654321098765432109876543210987654321": "Bob",
  };
  return mockNames[address] || null;
}

export default function TransactionGraph() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get("address");
  const network = searchParams.get("network") || "mainnet";
  const provider = searchParams.get("provider") || "etherscan";
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"timeout" | "network" | "api" | "notFound" | "unknown">("unknown");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingTimeElapsed, setLoadingTimeElapsed] = useState(0);
  const timeElapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (address) {
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
        
      fetch(`${baseUrl}/api/transactions?address=${address}&network=${network}&provider=${provider}&offset=50`, { signal })
        .then((res) => {
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
        .then((data: unknown) => {
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
            const links: GraphData["links"] = [];
            
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
          const links: GraphData["links"] = [];

          transactions.forEach((tx) => {
            // Skip transactions with invalid addresses
            if (!tx.from || !tx.to || tx.from === "Bitcoin Transaction" || 
                tx.from === "Unknown" || tx.to === "Unknown") {
              return;
            }
            
            if (!nodes.has(tx.from)) {
              const name = getNameForAddress(tx.from);
              nodes.set(tx.from, {
                id: tx.from,
                label: name || shortenAddress(tx.from),
                color: getRandomColor(),
                type: tx.from === address ? "out" : "in",
              });
            }
            if (!nodes.has(tx.to)) {
              const name = getNameForAddress(tx.to);
              nodes.set(tx.to, {
                id: tx.to,
                label: name || shortenAddress(tx.to),
                color: getRandomColor(),
                type: tx.to === address ? "in" : "out",
              });
            }
            
            // Extract numeric value from the value string
            let value = 1; // Default value
            if (tx.value) {
              const valueMatch = tx.value.match(/[\d.]+/);
              if (valueMatch) {
                value = parseFloat(valueMatch[0]);
              }
            }
            
            links.push({
              source: tx.from,
              target: tx.to,
              value: value || 1,
            });
          });

          setGraphData({
            nodes: Array.from(nodes.values()),
            links,
          });
        })
        .catch((err) => {
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
            setError(err.message || "No transactions found for this address");
            
            // Create a fallback simple graph with just the address
            const fallbackNode = {
              id: address,
              label: shortenAddress(address),
              color: "#f5b056", // Match theme color
              type: "both",
            };
            
            setGraphData({
              nodes: [fallbackNode],
              links: [],
            });
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

  // Update onNodeClick to accept both the node and the MouseEvent.
  const handleNodeClick = useCallback(
    (node: { [others: string]: any }, event: MouseEvent) => {
      const n = node as GraphNode;
      
      // Skip click if this is a transaction node
      if (n.id.startsWith('tx-')) {
        return;
      }
      
      router.push(`/search/?address=${n.id}&network=${network}&provider=${provider}`);
    },
    [router, network, provider]
  );

  // Update nodes to reflect their transaction type ("both" if a node has both incoming and outgoing links)
  useEffect(() => {
    if (graphData) {
      const updatedNodes: GraphNode[] = graphData.nodes.map((node) => {
        // Skip transaction nodes
        if (node.id.startsWith('tx-')) {
          return node;
        }
        
        const incoming = graphData.links.filter(link => link.target === node.id);
        const outgoing = graphData.links.filter(link => link.source === node.id);
        if (incoming.length > 0 && outgoing.length > 0) {
          // Explicitly assert that the type is the literal "both"
          return { ...node, type: "both" as "both" };
        }
        return node;
      });
      if (JSON.stringify(updatedNodes) !== JSON.stringify(graphData.nodes)) {
        // Use the existing graphData rather than a functional update.
        setGraphData({
          ...graphData,
          nodes: updatedNodes,
        });
      }
    }
  }, [graphData]);

  if (loading) {
    return (
      <Card className="h-[500px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-1">
            {provider === 'infura' 
              ? 'Loading transaction data from Infura...' 
              : 'Loading transaction data...'}
          </p>
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
    <Card className="h-[540px] bg-gray-900">
      <CardHeader>
        <CardTitle>Transaction Graph</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={((node: GraphNode) => node.id) as any}
          nodeColor={((node: GraphNode) => node.color) as any}
          nodeCanvasObject={
            ((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
              if (node.x == null || node.y == null) return;
              const { label, type, x, y } = node;
              const fontSize = 4;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.beginPath();
              ctx.arc(x, y, type === "both" ? 4 : 3, 0, 2 * Math.PI, false);
              ctx.fillStyle =
                type === "in"
                  ? "rgba(0, 255, 0, 0.5)"
                  : type === "out"
                  ? "rgba(255, 0, 0, 0.5)"
                  : type === "transaction" 
                  ? "rgba(245, 176, 86, 0.5)" // Transaction nodes
                  : "rgba(255, 255, 0, 0.5)";
              ctx.fill();
              ctx.fillStyle = "white";
              ctx.fillText(label, x, y);
            }) as any
          }
          nodeRelSize={6}
          linkWidth={1}
          linkColor={() => "rgb(255, 255, 255)"}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleSpeed={0.005}
          d3VelocityDecay={0.3}
          d3AlphaDecay={0.01}
          onNodeClick={handleNodeClick}
          width={580}
          height={440}
        />
        
        {error && (
          <div className="mt-2 text-center text-xs text-amber-400">
            Note: Some graph data may be incomplete. {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
