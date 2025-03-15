"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
  type: "transfer" | "swap" | "inflow" | "outflow"
}

export default function TransactionTable() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      fetch(`/api/transactions?address=${address}&page=${page}&offset=20`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error)
          }
          // Mock categorization of transactions
          const categorizedData = data.map((tx: Transaction) => ({
            ...tx,
            type: categorizeTransaction(tx, address),
          }))
          setTransactions(categorizedData)
        })
        .catch((err) => {
          console.error("Error fetching transactions:", err)
          setError(err.message || "Failed to fetch transactions")
        })
        .finally(() => setLoading(false))
    }
  }, [address, page])

  const categorizeTransaction = (tx: Transaction, userAddress: string): Transaction["type"] => {
    if (tx.from === userAddress && tx.to === userAddress) return "swap"
    if (tx.from === userAddress) return "outflow"
    if (tx.to === userAddress) return "inflow"
    return "transfer"
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent>No transactions found.</CardContent>
      </Card>
    )
  }

  const renderTransactionTable = (transactions: Transaction[]) => (
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
            <TableCell className="font-mono text-[#F5B056]">
              {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
            </TableCell>
            <TableCell className="font-mono text-[#F5B056]">
              {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
            </TableCell>
            <TableCell>{tx.value}</TableCell>
            <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-2 p-1 bg-gradient-to-r from-gray-900 to-black rounded-lg">
            <TabsTrigger 
              value="all"
              className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200 
                hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="transfer"
              className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200
                hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Transfer
            </TabsTrigger>
            <TabsTrigger 
              value="swap"
              className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200
                hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Swap
            </TabsTrigger>
            <TabsTrigger 
              value="inflow"
              className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200
                hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Inflow
            </TabsTrigger>
            <TabsTrigger 
              value="outflow"
              className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200
                hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Outflow
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderTransactionTable(transactions)}</TabsContent>
          <TabsContent value="transfer">
            {renderTransactionTable(transactions.filter((tx) => tx.type === "transfer"))}
          </TabsContent>
          <TabsContent value="swap">
            {renderTransactionTable(transactions.filter((tx) => tx.type === "swap"))}
          </TabsContent>
          <TabsContent value="inflow">
            {renderTransactionTable(transactions.filter((tx) => tx.type === "inflow"))}
          </TabsContent>
          <TabsContent value="outflow">
            {renderTransactionTable(transactions.filter((tx) => tx.type === "outflow"))}
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-between py-4 px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-[#F5B056] text-white px-6 py-2 rounded-lg font-medium
              hover:bg-[#E69A45]
              disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Previous
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={transactions.length < 20}
            className="bg-[#F5B056] text-white px-6 py-2 rounded-lg font-medium
              hover:bg-[#E69A45]
              disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

