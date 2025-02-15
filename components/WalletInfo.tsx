

interface WalletData {
  address: string
  balance: string
  transactionCount: number
}

export default function WalletInfo() {
  const searchParams = useSearchParams()

  if (!walletData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Information</CardTitle>
      </CardHeader>
      <CardContent>

      </CardContent>
    </Card>
  )
}

