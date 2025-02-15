"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      fetch(`/api/wallet?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error)
          }
          setWalletData(data)
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
      <Card>
        <CardContent>Loading wallet information...</CardContent>
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
        <p>
          <strong>Transaction Count:</strong> {walletData.transactionCount}
        </p>
      </CardContent>
    </Card>
  )
}

