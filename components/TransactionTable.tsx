'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
}

export default function TransactionTable() {
  const searchParams = useSearchParams()
  const address = searchParams.get('address')
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    if (address) {
      // In a real application, you would fetch this data from your API
      // This is just mock data for demonstration purposes
      setTransactions([
        { id: '1', from: address, to: 'address1', value: '0.5 ETH', timestamp: '2023-06-01 10:00:00' },
        { id: '2', from: 'address2', to: address, value: '1.0 ETH', timestamp: '2023-06-02 14:30:00' },
        { id: '3', from: address, to: 'address3', value: '0.2 ETH', timestamp: '2023-06-03 09:15:00' },
      ])
    }
  }, [address])

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
                <TableCell>{tx.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

