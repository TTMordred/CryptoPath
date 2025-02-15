"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
}

interface GraphData {
  nodes: { id: string }[]
  links: { source: string; target: string; value: number }[]
}

export default function TransactionGraph() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      fetch(`/api/transactions?address=${address}`)
        .then((res) => res.json())
        .then((transactions: Transaction[]) => {
          if ("error" in transactions) {
            throw new Error(transactions.error as string)
          }
          const nodes = new Set<string>()
          const links: GraphData["links"] = []

          transactions.forEach((tx) => {
            nodes.add(tx.from)
            nodes.add(tx.to)
            links.push({
              source: tx.from,
              target: tx.to,
              value: Number.parseFloat(tx.value),
            })
          })

          setGraphData({
            nodes: Array.from(nodes).map((id) => ({ id })),
            links,
          })
        })
        .catch((err) => {
          console.error("Error fetching transaction data for graph:", err)
          setError("Failed to fetch transaction data for graph")
        })
        .finally(() => setLoading(false))
    }
  }, [address])

  if (loading) {
    return (
      <Card>
        <CardContent>Loading transaction graph...</CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>Error: {error}</CardContent>
      </Card>
    )
  }

  if (!graphData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="id"
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          width={500}
          height={400}
        />
      </CardContent>
    </Card>
  )
}

