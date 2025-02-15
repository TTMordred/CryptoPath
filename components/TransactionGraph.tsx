'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface GraphData {
  nodes: { id: string; val: number }[]
  links: { source: string; target: string; value: number }[]
}

export default function TransactionGraph() {
  const searchParams = useSearchParams()
  const address = searchParams.get('address')
  const [graphData, setGraphData] = useState<GraphData | null>(null)

  useEffect(() => {
    if (address) {
      // In a real application, you would fetch this data from your API
      // This is just mock data for demonstration purposes
      setGraphData({
        nodes: [
          { id: address, val: 20 },
          { id: 'address1', val: 10 },
          { id: 'address2', val: 15 },
          { id: 'address3', val: 5 },
        ],
        links: [
          { source: address, target: 'address1', value: 1 },
          { source: address, target: 'address2', value: 1 },
          { source: 'address2', target: 'address3', value: 1 },
        ],
      })
    }
  }, [address])

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

