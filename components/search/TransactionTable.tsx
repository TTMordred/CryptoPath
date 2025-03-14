"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
  type: "transfer" | "swap" | "inflow" | "outflow"
}

export function SimpleTransactionTable() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const network = searchParams.get("network") || "mainnet";
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    const fetchTransactions = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_URL || '';
        
        const response = await fetch(`${baseUrl}/api/transactions?address=${address}&network=${network}&page=1&offset=20`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setTransactions([]);
        } else {
          setTransactions(data.transactions || []);
          if (data.transactions.length === 0) {
            setError(`No transactions found on ${network} for this address.`);
          }
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [address, network]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-amber-400">{error}</p>
          <p className="mt-2 text-gray-400">
            Try checking the address or switching to another network.
          </p>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (transactions.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p>No transactions found on {network}</p>
        </div>
      </div>
    );
  }
  
  // Render transactions table
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Transactions</h2>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left">Hash</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-right">Value (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.hash} className="border-t border-gray-700">
                <td className="px-4 py-3">
                  <a 
                    href={getBlockExplorerUrl(network, tx.hash)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#F5B056] hover:underline truncate block max-w-[120px]"
                  >
                    {shortenHash(tx.hash)}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatDate(tx.timeStamp)}
                </td>
                <td className="px-4 py-3">
                  <a 
                    href={`/search?address=${tx.from}&network=${network}`}
                    className="text-[#F5B056] hover:underline truncate block max-w-[120px]"
                  >
                    {shortenAddress(tx.from)}
                  </a>
                </td>
                <td className="px-4 py-3">
                  {tx.to ? (
                    <a 
                      href={`/search?address=${tx.to}&network=${network}`}
                      className="text-[#F5B056] hover:underline truncate block max-w-[120px]"
                    >
                      {shortenAddress(tx.to)}
                    </a>
                  ) : (
                    <span className="text-gray-400">Contract Creation</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatEther(tx.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper functions
function shortenHash(hash: string): string {
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}

function shortenAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function formatEther(wei: string): string {
  return (parseInt(wei) / 1e18).toFixed(6);
}

function getBlockExplorerUrl(network: string, hash: string): string {
  const explorers: {[key: string]: string} = {
    mainnet: 'https://etherscan.io/tx/',
    goerli: 'https://goerli.etherscan.io/tx/',
    sepolia: 'https://sepolia.etherscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    arbitrum: 'https://arbiscan.io/tx/'
  };
  
  return (explorers[network] || explorers.mainnet) + hash;
}

export default function TransactionTable() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "mainnet"
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      
      // Get the base URL dynamically
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_URL || ''
        
      fetch(`${baseUrl}/api/transactions?address=${address}&network=${network}&page=${page}&offset=20`)
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
  }, [address, network, page])

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
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-amber-400">{error}</p>
          <p className="mt-2 text-gray-400">
            Try checking the address or switching to another network.
          </p>
        </div>
      </div>
    );
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
          <TableHead>Network</TableHead>
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
            <TableCell>{network}</TableCell>
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
