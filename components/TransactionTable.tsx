

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string


export default function TransactionTable() {
  const searchParams = useSearchParams()

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>

      </CardContent>
    </Card>
  )
}

