"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
}

export default function TransactionTable() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      fetch(`/api/transactions?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error)
          }
          setTransactions(data)
        })
        .catch((err) => {
          console.error("Error fetching transactions:", err)
          setError("Failed to fetch transactions")
        })
        .finally(() => setLoading(false))
    }
  }, [address])

  if (loading) {
    return (
      <Card>
        <CardContent>Loading transactions...</CardContent>
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

  if (transactions.length === 0) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.from}</TableCell>
                <TableCell>{tx.to}</TableCell>
                <TableCell>{tx.value}</TableCell>
                <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

