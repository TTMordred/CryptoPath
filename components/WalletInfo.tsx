"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Wallet, Coins, DollarSign, ListOrdered } from "lucide-react"

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
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
            <Wallet className="w-6 h-6 text-[#F5B056]" />
            <p>
              <strong>Address:</strong>{" "}
              <span className="text-[#F5B056]">{walletData.address}</span>
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
        </div>
      </CardContent>
    </Card>
  )
}
