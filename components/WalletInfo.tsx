'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WalletData {
  address: string
  balance: string
  transactionCount: number
}

export default function WalletInfo() {
  const searchParams = useSearchParams()
  const address = searchParams.get('address')
  const [walletData, setWalletData] = useState<WalletData | null>(null)

  useEffect(() => {
    if (address) {
      // In a real application, you would fetch this data from your API
      // This is just mock data for demonstration purposes
      setWalletData({
        address: address,
        balance: '1.5 ETH',
        transactionCount: 42,
      })
    }
  }, [address])

  if (!walletData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Address:</strong> {walletData.address}</p>
        <p><strong>Balance:</strong> {walletData.balance}</p>
        <p><strong>Transaction Count:</strong> {walletData.transactionCount}</p>
      </CardContent>
    </Card>
  )
}

