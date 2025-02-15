"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { scaleOrdinal } from "d3-scale"
import { schemeCategory10 } from "d3-scale-chromatic"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
}

interface GraphNode {
  id: string
  label: string
  color: string
}

interface GraphData {
  nodes: GraphNode[]
  links: { source: string; target: string; value: number }[]
}

const colorScale = scaleOrdinal(schemeCategory10)

function shortenAddress(address: string): string {
  return address.slice(0, 4)
}

// Mock function to get name for address (replace with actual implementation)
function getNameForAddress(address: string): string | null {
  const mockNames: { [key: string]: string } = {
    "0x1234567890123456789012345678901234567890": "Alice",
    "0x0987654321098765432109876543210987654321": "Bob",
    // Add more mock names as needed
  }
  return mockNames[address] || null
}

export default function TransactionGraph() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      fetch(`/api/transactions?address=${address}&offset=50`)
        .then((res) => res.json())
        .then((transactions: Transaction[]) => {
          if ("error" in transactions) {
            throw new Error(transactions.error as string)
          }
          const nodes = new Map<string, GraphNode>()
          const links: GraphData["links"] = []

          transactions.forEach((tx) => {
            if (!nodes.has(tx.from)) {
              const name = getNameForAddress(tx.from)
              nodes.set(tx.from, {
                id: tx.from,
                label: name || shortenAddress(tx.from),
                color: colorScale(tx.from) as string,
              })
            }
            if (!nodes.has(tx.to)) {
              const name = getNameForAddress(tx.to)
              nodes.set(tx.to, {
                id: tx.to,
                label: name || shortenAddress(tx.to),
                color: colorScale(tx.to) as string,
              })
            }
            links.push({
              source: tx.from,
              target: tx.to,
              value: Number.parseFloat(tx.value),
            })
          })

          setGraphData({
            nodes: Array.from(nodes.values()),
            links,
          })
        })
        .catch((err) => {
          console.error("Error fetching transaction data for graph:", err)
          setError(err.message || "Failed to fetch transaction data for graph")
        })
        .finally(() => setLoading(false))
    }
  }, [address])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    window.addEventListener("resize", updateDimensions)
    updateDimensions()

    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const handleNodeClick = useCallback((node: GraphNode) => {
    window.open(`https://etherscan.io/address/${node.id}`, "_blank")
  }, [])

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[500px]">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-center text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!graphData) {
    return null
  }

  return (
    <Card className="h-[500px]">
      <CardHeader>
        <CardTitle>Transaction Graph</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]" ref={containerRef}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={(node: GraphNode) => node.id}
          nodeColor={(node: GraphNode) => node.color}
          nodeCanvasObject={(node: GraphNode, ctx, globalScale) => {
            const label = node.label
            const fontSize = 14 / globalScale
            ctx.font = `${fontSize}px Sans-Serif`
            const textWidth = ctx.measureText(label).width
            const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2)

            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
            ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, ...bckgDimensions)

            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = node.color
            ctx.fillText(label, node.x!, node.y!)
          }}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          width={dimensions.width}
          height={dimensions.height}
        />
      </CardContent>
    </Card>
  )
}

