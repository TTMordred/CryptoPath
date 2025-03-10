"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useMemo, useRef, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionTableProps } from '@/lib/types'
import { useVirtualizer } from '@tanstack/react-virtual'

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
  type: "transfer" | "swap" | "inflow" | "outflow"
}

// Cache for storing transaction data with LRU eviction
class LRUCache {
  private cache: Map<string, { data: Transaction[], timestamp: number }>
  private maxSize: number

  constructor(maxSize = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: string): { data: Transaction[], timestamp: number } | undefined {
    const item = this.cache.get(key)
    if (item) {
      // Move to front (most recently used)
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: string, value: { data: Transaction[], timestamp: number }): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used item
      const firstKey = Array.from(this.cache.keys())[0]
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }
}

const transactionCache = new LRUCache(50)
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Memoized tab options
const TAB_OPTIONS = {
  all: "All",
  transfer: "Transfer",
  swap: "Swap",
  inflow: "Inflow",
  outflow: "Outflow"
} as const

export default function FilteredTransactionTable({ data }: TransactionTableProps) {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const parentRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoize the cache key
  const cacheKey = useMemo(() => `${address}-${page}`, [address, page])

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // estimated row height
    overscan: 5
  })

  const fetchTransactions = useCallback(async () => {
    if (!address) return

    // Check cache first
    const cached = transactionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      startTransition(() => {
        setTransactions(cached.data)
      })
      return
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/transactions?address=${address}&page=${page}&offset=20`,
        { signal: abortControllerRef.current.signal }
      )
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      const categorizedData = data.map((tx: Transaction) => ({
        ...tx,
        type: categorizeTransaction(tx, address),
      }))

      // Update cache
      transactionCache.set(cacheKey, {
        data: categorizedData,
        timestamp: Date.now(),
      })

      startTransition(() => {
        setTransactions(categorizedData)
      })
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error("Error fetching transactions:", err)
      setError(err.message || "Failed to fetch transactions")
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [address, page, cacheKey])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Debounced fetch effect
  useEffect(() => {
    const timer = setTimeout(fetchTransactions, 300)
    return () => clearTimeout(timer)
  }, [fetchTransactions])

  const categorizeTransaction = useCallback((tx: Transaction, userAddress: string): Transaction["type"] => {
    if (tx.from === userAddress && tx.to === userAddress) return "swap"
    if (tx.from === userAddress) return "outflow"
    if (tx.to === userAddress) return "inflow"
    return "transfer"
  }, [])

  // Memoize filtered transactions with type checking
  const filteredTransactions = useMemo(() => ({
    all: transactions,
    transfer: transactions.filter((tx) => tx.type === "transfer"),
    swap: transactions.filter((tx) => tx.type === "swap"),
    inflow: transactions.filter((tx) => tx.type === "inflow"),
    outflow: transactions.filter((tx) => tx.type === "outflow"),
  }), [transactions])

  // Memoize table rendering function
  const renderTransactionTable = useCallback((transactions: Transaction[]) => (
    <div ref={parentRef} className="max-h-[500px] overflow-auto">
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
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const tx = transactions[virtualRow.index]
              return (
                <TableRow
                  key={tx.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TableCell className="font-mono text-[#F5B056]">
                    {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                  </TableCell>
                  <TableCell className="font-mono text-[#F5B056]">
                    {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                  </TableCell>
                  <TableCell>{tx.value}</TableCell>
                  <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              )
            })}
          </div>
        </TableBody>
      </Table>
    </div>
  ), [rowVirtualizer])

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

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-2 p-1 bg-gradient-to-r from-gray-900 to-black rounded-lg">
            {Object.entries(TAB_OPTIONS).map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200 
                  hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                  data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(filteredTransactions).map(([type, txs]) => (
            <TabsContent key={type} value={type}>
              {renderTransactionTable(txs)}
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex items-center justify-between py-4 px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isPending}
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
            disabled={transactions.length < 20 || isPending}
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