"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Coins } from "lucide-react"

interface TokenBalance {
  token: string
  balance: string
  usdValue: number
}

export default function Portfolio() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [portfolio, setPortfolio] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)

      // In a real application, you would fetch this data from your API
      // This is just mock data for demonstration purposes
      setTimeout(() => {
        setPortfolio([
          { token: "ETH", balance: "1.5", usdValue: 3000 },
          { token: "USDT", balance: "500", usdValue: 500 },
          { token: "LINK", balance: "100", usdValue: 1000 },
        ])
        setLoading(false)
      }, 1000)
    }
  }, [address])

  if (loading) {
    return (
      <Card className="mt-4 h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-4 h-[200px]">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-center text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (portfolio.length === 0) {
    return null
  }

  const totalValue = portfolio.reduce((sum, token) => sum + token.usdValue, 0)

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left"><Coins className="w-5 h-5 text-yellow-500" />Token</th>
              <th className="text-right">Balance</th>
              <th className="text-right">USD Value</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((token) => (
              <tr key={token.token}>
                <td>{token.token}</td>
                <td className="text-right">{token.balance}</td>
                <td className="text-right">${token.usdValue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="text-right font-bold">
                Total Value:
              </td>
              <td className="text-right font-bold">${totalValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  )
}

