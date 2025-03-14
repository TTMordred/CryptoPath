"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2} from "lucide-react";

// Dynamically import ForceGraph2D (without generic type arguments)
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
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setLoading(true);
      setError(null);
      fetch(`/api/transactions?address=${address}&offset=50`)
        .then((res) => res.json())
        .then((data: unknown) => {
          if (!Array.isArray(data)) {
            throw new Error((data as any).error || "Unexpected API response");
          }
          const transactions = data as Transaction[];
          const nodes = new Map<string, GraphNode>();
          const links: GraphData["links"] = [];

          transactions.forEach((tx) => {
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
            links.push({
              source: tx.from,
              target: tx.to,
              value: Number.parseFloat(tx.value),
            });
          });

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

  // Update onNodeClick to accept both the node and the MouseEvent.
  const handleNodeClick = useCallback(
    (node: { [others: string]: any }, event: MouseEvent) => {
      const n = node as GraphNode;
      router.push(`/search/?address=${n.id}`);
    },
    [router]
  );

  // Update nodes to reflect their transaction type ("both" if a node has both incoming and outgoing links)
  useEffect(() => {
    if (graphData) {
      const updatedNodes: GraphNode[] = graphData.nodes.map((node) => {
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
      <Card className="h-[500px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[500px]">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-center text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
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
      </CardContent>
    </Card>
  );
}
