"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface WalletData {
  address: string
  balance: string
  transactionCount: number
}

export default function WalletInfo() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usdValue, setUsdValue] = useState<number | null>(null)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)

      Promise.all([
        fetch(`/api/wallet?address=${address}`).then((res) => res.json()),
        fetch("/api/eth-usd-rate").then((res) => res.json()),
      ])
        .then(([walletData, rateData]) => {
          if (walletData.error) throw new Error(walletData.error)
          if (rateData.error) throw new Error(rateData.error)

          setWalletData(walletData)
          const ethBalance = Number.parseFloat(walletData.balance.split(" ")[0])
          setUsdValue(ethBalance * rateData.rate)
        })
        .catch((err) => {
          console.error("Error fetching wallet data:", err)
          setError("Failed to fetch wallet data")
        })
        .finally(() => setLoading(false))
    }
  }, [address])

  if (loading) {
    return (
      <Card className="h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[200px]">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-center text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!walletData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Address:</strong> {walletData.address}
        </p>
        <p>
          <strong>Balance:</strong> {walletData.balance}
        </p>
        {usdValue !== null && (
          <p>
            <strong>USD Value:</strong> ${usdValue.toFixed(2)}
          </p>
        )}
        <p>
          <strong>Transaction Count:</strong> {walletData.transactionCount}
        </p>
      </CardContent>
    </Card>
  )
}

