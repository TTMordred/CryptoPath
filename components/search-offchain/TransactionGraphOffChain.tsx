"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";

// Dynamically import ForceGraph2D
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  ),
});

interface Transaction {
  id: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
}

export interface GraphNode {
  id: string;
  label: string;
  color: string;
  type: string;
  value?: number; // Adding value to size nodes properly
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
  transaction?: Transaction;
  color?: string;
  curvature?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function TransactionGraphOffChain() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get("address");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const graphRef = useRef<any>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  
  useEffect(() => {
    if (address) {
      setLoading(true);
      setError(null);

      fetch(`/api/transactions-offchain?address=${address}&offset=50`)
        .then((res) => res.json())
        .then((data: unknown) => {
          if (!Array.isArray(data)) {
            throw new Error((data as any).error || "Unexpected API response");
          }

          const transactions = data as Transaction[];
          const nodes = new Map<string, GraphNode>();
          const links: GraphLink[] = [];
          
          // Track transaction counts for each address to size nodes appropriately
          const txCounts = new Map<string, number>();
          
          // Initialize main address
          txCounts.set(address, 0);

          // Add the main address node
          nodes.set(address, {
            id: address,
            label: shortenAddress(address),
            color: "#f5b056", // Amber color for the main node
            type: "both",
            value: 10, // Start with larger size for main node
          });

          transactions.forEach((tx) => {
            // Count transactions for node sizing
            txCounts.set(tx.from, (txCounts.get(tx.from) || 0) + 1);
            txCounts.set(tx.to, (txCounts.get(tx.to) || 0) + 1);
            
            if (!nodes.has(tx.from)) {
              nodes.set(tx.from, {
                id: tx.from,
                label: shortenAddress(tx.from),
                color: getRandomColor(),
                type: tx.from === address ? "out" : "in",
              });
            }
            if (!nodes.has(tx.to)) {
              nodes.set(tx.to, {
                id: tx.to,
                label: shortenAddress(tx.to),
                color: getRandomColor(),
                type: tx.to === address ? "in" : "out",
              });
            }

            // Use stronger colors with higher opacity for better visibility
            links.push({
              source: tx.from,
              target: tx.to,
              value: Math.max(0.5, Math.min(3, Number.parseFloat(tx.value) || 1)),
              transaction: tx,
              color: tx.from === address ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 197, 94, 0.8)", // Brighter colors
              curvature: 0.2, // Increase curvature for better visualization
            });
          });
          
          // Update node values based on transaction counts
          for (const [nodeId, count] of txCounts.entries()) {
            const node = nodes.get(nodeId);
            if (node) {
              node.value = Math.max(3, Math.min(12, 3 + count)); // Scale between 3-12 based on transaction count
            }
          }

          setGraphData({
            nodes: Array.from(nodes.values()),
            links,
          });
        })
        .catch((err) => {
          console.error("Error fetching transaction data for graph:", err);
          setError(err.message || "Failed to fetch transaction data for graph");
        })
        .finally(() => setLoading(false));
    }
  }, [address]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const graphNode = node as GraphNode;
      if (graphNode.id.startsWith("tx-")) return; // Skip transaction nodes
      router.push(`/search-offchain/?address=${graphNode.id}`);
    },
    [router]
  );
  
  const handleNodeHover = useCallback(
    (node: { [others: string]: any; id?: string | number; x?: number; y?: number } | null) => {
      if (node && 'label' in node && 'color' in node && 'type' in node) {
        setHoverNode(node as GraphNode);
        document.body.style.cursor = 'pointer';
      } else {
        setHoverNode(null);
        document.body.style.cursor = 'default';
      }
    },
    []
  );

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.2, 400); // 20% zoom in with 400ms animation
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.2, 400); // 20% zoom out with 400ms animation
    }
  };

  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1, 800); // Reset to zoom level 1 with 800ms animation
      graphRef.current.centerAt(0, 0, 800); // Center the graph
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center bg-gray-900 border border-amber-500/20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm text-gray-300">Loading transaction graph...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center bg-gray-900 border border-amber-500/20">
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }

  if (!graphData) {
    return null;
  }

  return (
    <Card
      className={`bg-gray-900/95 backdrop-blur-sm border border-amber-500/20 ${
        isFullscreen ? "fixed top-0 left-0 right-0 bottom-0 z-50 h-screen w-screen rounded-none" : "h-[593px]"
      }`}
    >
      <CardHeader className="bg-black/20 border-b border-amber-500/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <span className="text-amber-400">Transaction Graph</span>
            {graphData.links.length > 0 ? (
              <Badge variant="outline" className="ml-2 text-xs bg-amber-500/10 border-amber-500/30 text-amber-400">
                {graphData.links.length} {graphData.links.length === 1 ? "Transaction" : "Transactions"}
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-xs bg-gray-800 border-gray-700 text-gray-400">
                No Transactions
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleZoomIn} 
              title="Zoom In"
              className="p-1 hover:bg-gray-800 rounded"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              onClick={handleZoomOut} 
              title="Zoom Out"
              className="p-1 hover:bg-gray-800 rounded"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              onClick={handleResetZoom} 
              title="Reset Zoom"
              className="p-1 hover:bg-gray-800 rounded text-xs"
            >
              1:1
            </button>
            <button 
              onClick={toggleFullscreen} 
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-1 hover:bg-gray-800 rounded"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`p-0 ${isFullscreen ? "h-[calc(100vh-116px)]" : "h-[calc(100%-116px)]"}`}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeRelSize={6} // Increase the relative node size
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          linkWidth={(link) => Math.sqrt((link as GraphLink).value) * 0.5} // Better scaling for link width
          linkColor={(link) => (link as GraphLink).color || "rgba(255, 255, 255, 0.3)"}
          linkCurvature={(link) => (link as GraphLink).curvature || 0.2}
          d3AlphaDecay={0.02} // Slower cooling for better layout
          d3VelocityDecay={0.1} // Less resistance for better separation
          cooldownTime={3000} // Longer cooldown for better positioning
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const { id, label, type, value, x, y } = node as GraphNode;
            if (x == null || y == null) return;

            // Calculate node size based on value with minimum size
            const nodeSize = (value || 5) * 0.8;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(x, y, nodeSize, 0, 2 * Math.PI, false);
            
            // Use consistent coloring based on node type
            ctx.fillStyle = 
              type === "in" ? "rgba(34, 197, 94, 0.9)" : 
              type === "out" ? "rgba(239, 68, 68, 0.9)" : 
              "rgba(245, 176, 86, 0.9)";
                
            // Add highlighting for hovered nodes
            if (hoverNode && hoverNode.id === id) {
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            
            ctx.fill();

            // Only show labels if we're zoomed in enough or on hover
            const labelVisible = globalScale > 1.2 || (hoverNode && hoverNode.id === id);
            
            if (labelVisible) {
              // Draw a background for the text to improve readability
              const fontSize = 8 / Math.sqrt(globalScale);
              ctx.font = `${fontSize}px Arial`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth + 8, fontSize + 4].map(n => n + 2);
              
              ctx.fillStyle = "rgba(0, 0, 0, 0)";
              ctx.fillRect(
                x - bckgDimensions[0] / 2,
                y + nodeSize + 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              
              // Draw text
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "white";
              ctx.fillText(
                label,
                x,
                y + nodeSize + 2 + bckgDimensions[1] / 2
              );
            }
          }}
          width={isFullscreen ? window.innerWidth : 580}
          height={isFullscreen ? window.innerHeight - 116 : 510}
        />
      </CardContent>
      <CardFooter className="bg-black/20 border-t border-amber-500/10 flex justify-between">
        <div className="text-xs text-gray-400">
          {hoverNode && `Selected: ${hoverNode.label}`}
        </div>
        <button 
          onClick={toggleFullscreen}
          className="px-2 py-1 text-xs hover:bg-gray-800 rounded text-amber-400"
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </CardFooter>
    </Card>
  );
}