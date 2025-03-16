"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, Download, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { utils } from 'ethers'

interface Transaction {
  id: string
  from: string
  to: string
  value: string
  timestamp: string
  network?: string
  gas?: number
  gasPrice?: number
  blockNumber?: number
  nonce?: number
  type?: "transfer" | "swap" | "inflow" | "outflow"
  input?: string
}

interface ApiResponse {
  data?: Transaction[]
  error?: string
  message?: string
}

export default function TransactionTable() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "mainnet"
  const provider = searchParams.get("provider") || "etherscan"
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Common function signatures for better categorization
  const knownMethods: Record<string, Transaction["type"]> = {
    '0x4a25d94a': 'swap',    // swapExactTokensForTokens
    '0x7ff36ab5': 'swap',    // swapExactETHForTokens
    '0xa9059cbb': 'transfer', // transfer
    '0x23b872dd': 'transfer', // transferFrom
    '0x095ea7b3': 'transfer', // approve
  }

  const categorizeTransaction = useCallback((tx: Transaction, userAddress: string): Transaction["type"] => {
    if (!tx.from || !tx.to) return "transfer";
    
    const userAddressLower = userAddress.toLowerCase();
    const fromLower = typeof tx.from === 'string' ? tx.from.toLowerCase() : '';
    const toLower = typeof tx.to === 'string' ? tx.to.toLowerCase() : '';
    
    // Check for known method signatures in input data
    if (tx.input && tx.input !== '0x') {
      const functionSelector = tx.input.slice(0, 10).toLowerCase();
      if (knownMethods[functionSelector]) return knownMethods[functionSelector];
    }
    
    if (fromLower === userAddressLower && toLower === userAddressLower) return "swap"
    if (fromLower === userAddressLower) return "outflow"
    if (toLower === userAddressLower) return "inflow"
    return "transfer"
  }, [knownMethods]);

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_URL || '';
        
      const apiEndpoint = new URL(`${baseUrl}/api/transactions`);
      apiEndpoint.searchParams.append('address', address);
      apiEndpoint.searchParams.append('page', page.toString());
      apiEndpoint.searchParams.append('offset', '20');
      apiEndpoint.searchParams.append('network', network);
      apiEndpoint.searchParams.append('provider', provider);
      
      console.log("Fetching transactions from:", apiEndpoint.toString());
      
      const res = await fetch(apiEndpoint.toString());
      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }
      
      const responseData: ApiResponse = await res.json();
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      // Format and categorize transactions
      const formattedTransactions = (responseData.data || []).map(tx => ({
        ...tx,
        // Format values if they're in wei
        value: tx.value?.startsWith('0x') ? 
          `${parseFloat(utils.formatEther(tx.value)).toFixed(6)} ETH` : 
          tx.value,
        type: categorizeTransaction(tx, address)
      }));

      setTransactions(formattedTransactions);
      
    } catch (err) {
      console.error("Error fetching transactions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch transactions";
      setError(errorMessage);
      toast.error(`Transaction error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [address, page, network, provider, categorizeTransaction]);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-refresh transactions and fetch initial data
  useEffect(() => {
    fetchTransactions();
    
    let intervalId: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchTransactions();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchTransactions, autoRefresh]);

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to download");
      return;
    }
    
    try {
      // Create CSV content
      const headers = ['Hash', 'Type', 'From', 'To', 'Value', 'Timestamp', 'Block Number'];
      const csvContent = [
        headers.join(','),
        ...transactions.map(tx => [
          tx.id,
          tx.type || 'transfer',
          tx.from,
          tx.to,
          tx.value,
          new Date(tx.timestamp).toISOString(),
          tx.blockNumber || ''
        ].join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${address}-transactions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV file downloaded successfully");
    } catch (err) {
      toast.error("Failed to download CSV file");
      console.error("CSV download error:", err);
    }
  };

  // Copy address/hash to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${type} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${type}`));
  };

  // View transaction on block explorer
  const openExternalLink = (txHash: string) => {
    const baseUrl = network === 'mainnet' ? 
      'https://etherscan.io/tx/' : 
      `https://${network}.etherscan.io/tx/`;
    window.open(`${baseUrl}${txHash}`, '_blank');
  };

  // Helper to truncate addresses/hashes
  const truncateAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error && transactions.length === 0) {
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
        <CardContent className="py-10 text-center">
          <p className="text-gray-400">No transactions found for this address.</p>
        </CardContent>
      </Card>
    )
  }

  const renderTransactionTable = (filteredTxs: Transaction[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hash</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className={isMobile ? "hidden" : ""}>Time</TableHead>
            {provider === 'bitquery' && <TableHead>Network</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTxs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 6 : 7} className="text-center py-4">
                No {filteredTxs === transactions ? "" : "matching"} transactions found.
              </TableCell>
            </TableRow>
          ) : (
            filteredTxs.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5B056]">{truncateAddress(tx.id)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tx.id, "Hash")}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.type === 'swap' ? 'bg-purple-900/50 text-purple-300' :
                    tx.type === 'inflow' ? 'bg-green-900/50 text-green-300' :
                    tx.type === 'outflow' ? 'bg-red-900/50 text-red-300' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {tx.type}
                  </span>
                </TableCell>
                <TableCell className="font-mono">
                  <div className="flex items-center gap-2">
                    <span className={tx.from?.toLowerCase() === address?.toLowerCase() ? 'text-red-400' : 'text-[#F5B056]'}>
                      {truncateAddress(tx.from)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tx.from, "From address")}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-mono">
                  <div className="flex items-center gap-2">
                    <span className={tx.to?.toLowerCase() === address?.toLowerCase() ? 'text-green-400' : 'text-[#F5B056]'}>
                      {tx.to ? truncateAddress(tx.to) : "Contract"}
                    </span>
                    {tx.to && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(tx.to, "To address")}
                      >
                        <Copy size={12} />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>{tx.value}</TableCell>
                <TableCell className={isMobile ? "hidden" : ""}>
                  {new Date(tx.timestamp).toLocaleString()}
                </TableCell>
                {provider === 'bitquery' && <TableCell>{tx.network}</TableCell>}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openExternalLink(tx.id)}
                  >
                    <ExternalLink size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <div className="flex items-center gap-2">
          {loading && transactions.length > 0 && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs ${autoRefresh ? 'bg-green-900/20 text-green-400 border-green-800' : ''}`}
          >
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            {!isMobile && "Download CSV"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-2 p-1 bg-gradient-to-r from-gray-900 to-black rounded-lg">
            {["all", "transfer", "swap", "inflow", "outflow"].map(tab => (
              <TabsTrigger 
                key={tab}
                value={tab}
                className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md transition-all duration-200 
                  hover:bg-gradient-to-r hover:from-[#F5B056] hover:to-orange-600 hover:text-black hover:shadow-lg
                  data-[state=active]:bg-[#F5B056] data-[state=active]:text-black data-[state=active]:font-bold"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4">
            <TabsContent value="all">{renderTransactionTable(transactions)}</TabsContent>
            <TabsContent value="transfer">
              {renderTransactionTable(transactions.filter(tx => tx.type === "transfer"))}
            </TabsContent>
            <TabsContent value="swap">
              {renderTransactionTable(transactions.filter(tx => tx.type === "swap"))}
            </TabsContent>
            <TabsContent value="inflow">
              {renderTransactionTable(transactions.filter(tx => tx.type === "inflow"))}
            </TabsContent>
            <TabsContent value="outflow">
              {renderTransactionTable(transactions.filter(tx => tx.type === "outflow"))}
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="flex items-center justify-between py-4 px-4 mt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-[#F5B056] text-white px-6 py-2 rounded-lg font-medium
              hover:bg-[#E69A45]
              disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-400">Page {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={transactions.length < 20}
            className="bg-[#F5B056] text-white px-6 py-2 rounded-lg font-medium
              hover:bg-[#E69A45]
              disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
