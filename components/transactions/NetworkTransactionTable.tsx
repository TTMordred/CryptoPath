'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Eye, ChevronLeft, ChevronRight, Download, Copy } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { ethers } from 'ethers';

interface Transaction {
  hash: string;
  method: string;
  block: string;
  age: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  timestamp: number;
}

export default function NetworkTransactionTable() {
  // State variables
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [totalPages] = useState(5000);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Etherscan API configuration
  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
  const API_URL = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`;

  interface MethodSignatures {
    [key: string]: string;
  }
  
  const knownMethods: MethodSignatures = {
    '0xa9059cbb': 'Transfer',
    '0x23b872dd': 'TransferFrom',
    '0x095ea7b3': 'Approve',
    '0x70a08231': 'BalanceOf',
    '0x18160ddd': 'TotalSupply',
    '0x313ce567': 'Decimals',
    '0x06fdde03': 'Name',
    '0x95d89b41': 'Symbol',
    '0xd0e30db0': 'Deposit',
    '0x2e1a7d4d': 'Withdraw',
    '0x3593564c': 'Execute',
    '0x4a25d94a': 'SwapExactTokensForTokens',
    '0x7ff36ab5': 'SwapExactETHForTokens',
    '0x791ac947': 'SwapExactTokensForETH',
    '0xfb3bdb41': 'SwapETHForExactTokens',
    '0x5c11d795': 'SwapTokensForExactTokens',
    '0xb6f9de95': 'Claim',
    '0x6a627842': 'Mint',
    '0xa0712d68': 'Mint',
  };
  
  const getTransactionMethod = (input: string): string => {
    if (input === '0x') return 'Transfer';
    
    const functionSelector = input.slice(0, 10).toLowerCase();
    
    if (knownMethods[functionSelector]) {
      return knownMethods[functionSelector];
    }
    
    return 'Swap';
  };

  // Function to get relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;

    // Ensure diff is not negative
    if (diff < 0) return "Just now";

    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  // Function to truncate addresses
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch latest blocks and their transactions
  const fetchLatestTransactions = async () => {
    if (!ETHERSCAN_API_KEY) {
      console.error('Etherscan API key is not set')
      return
    }

    try {
      setIsLoading(true)
      const latestBlockResponse = await fetch('/api/etherscan?module=proxy&action=eth_blockNumber')
      const latestBlockData = await latestBlockResponse.json()
      const latestBlock = parseInt(latestBlockData.result, 16)

      const response = await fetch(
        `/api/etherscan?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true`
      )
      const data = await response.json()

      if (data.result && data.result.transactions) {
        const formattedTransactions = await Promise.all(
          data.result.transactions.slice(0, 50).map(async (tx: any) => {
            const timestamp = parseInt(data.result.timestamp, 16)
            return {
              hash: tx.hash,
              method: getTransactionMethod(tx.input),
              block: parseInt(tx.blockNumber, 16).toString(),
              age: getRelativeTime(timestamp),
              from: tx.from,
              to: tx.to || 'Contract Creation',
              amount: ethers.utils.formatEther(tx.value) + ' ETH',
              fee: ethers.utils.formatEther(BigInt(tx.gas) * BigInt(tx.gasPrice)),
              timestamp: timestamp
            }
          })
        )
        setTransactions(formattedTransactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast({
        title: "Error fetching transactions",
        description: "Failed to fetch latest transactions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestTransactions()
    const interval = setInterval(fetchLatestTransactions, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-800">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Txn Hash</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Block</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Txn Fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-4 bg-white text-black">
                Loading transactions...
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx, index) => (
              <TableRow key={index} className="bg-gray-900 text-gray-300 hover:bg-gray-800 transition-colors">
                <TableCell className="p-0">
                  <div className="flex items-center justify-center h-full">
                    <Eye size={16} className="text-gray-400" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Link href={`/transaction/${tx.hash}`}>
                      <span className="cursor-pointer hover:underline text-[#F5B056]">
                        {truncateAddress(tx.hash)}
                      </span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(tx.hash)}
                      className="h-5 w-5 p-0"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full bg-gray-800 text-xs">
                    {tx.method}
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`/block/${tx.block}`}>
                    <span className="cursor-pointer hover:underline text-[#F5B056]">
                      {tx.block}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{tx.age}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link href={`/address/${tx.from}`}>
                      <span className="cursor-pointer hover:underline text-[#F5B056]">
                        {truncateAddress(tx.from)}
                      </span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(tx.from)}
                      className="h-5 w-5 p-0"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link href={`/address/${tx.to}`}>
                      <span className="cursor-pointer hover:underline text-[#F5B056]">
                        {truncateAddress(tx.to)}
                      </span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(tx.to)}
                      className="h-5 w-5 p-0"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{tx.amount}</TableCell>
                <TableCell>{tx.fee}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 