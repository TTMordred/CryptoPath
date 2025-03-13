'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Eye, ChevronLeft, ChevronRight, Download, Copy } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { ethers } from 'ethers';
import { formatEther } from 'ethers/lib/utils';


interface Stats {
  transactions24h: number;
  pendingTransactions: number;
  networkFee: number;
  avgGasFee: number;
  totalTransactionAmount: number; // New field for total transaction amount
}

// Initial state
const initialStats: Stats = {
  transactions24h: 0,
  pendingTransactions: 0,
  networkFee: 0,
  avgGasFee: 0,
  totalTransactionAmount: 0, // Initialize to 0
};

export default function TransactionExplorer() {
  // State variables
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [totalPages] = useState(5000);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  // Etherscan API configuration
  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY; // Replace with your API key
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
  const fetchLatestTransactions = useCallback(async () => {
    if (!ETHERSCAN_API_KEY) {
      console.error('Etherscan API key is not set')
      return
    }

    try {
      setIsLoading(true)
      const latestBlockResponse = await fetch(API_URL)
      const latestBlockData = await latestBlockResponse.json()
      const latestBlock = parseInt(latestBlockData.result, 16)

      const response = await fetch(
        `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true&apikey=${ETHERSCAN_API_KEY}`
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
              amount: formatEther(tx.value) + ' ETH',
              fee: formatEther(BigInt(tx.gas) * BigInt(tx.gasPrice)),
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
  }, [toast])

  useEffect(() => {
    fetchLatestTransactions()
    const interval = setInterval(fetchLatestTransactions, 150000) // Refresh every 2.5 minutes
    return () => clearInterval(interval)
  }, [fetchLatestTransactions])


  // Effect to fetch data
  useEffect(() => {
    fetchLatestTransactions();
    const interval = setInterval(() => {
      fetchLatestTransactions();
    }, 150000); // Refresh every 2.5 minutes

    return () => clearInterval(interval);
  }, [currentPage]); //Refresh every page changes

  // Effect to handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Utility functions (handleDownload, copyToClipboard, etc.)
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The text has been copied to your clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Failed to copy",
        description: "An error occurred while copying the text.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const headers = ['Transaction Hash', 'Method', 'Block', 'Age', 'From', 'To', 'Amount', 'Txn Fee'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx =>
        [
          tx.hash,
          tx.method,
          tx.block,
          formatTimestamp(tx.timestamp),
          tx.from,
          tx.to,
          tx.amount,
          tx.fee,
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'ethereum_transactions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    // Create a date object from the timestamp
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

    // Convert to GMT+7
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Bangkok', // GMT+7 timezone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
    };

    // Format the date
    return date.toLocaleString('en-GB', options).replace(',', ''); // Remove comma for better CSV formatting
};

  const handleMethodClick = (method: string) => {
    setSelectedMethod(method === selectedMethod ? null : method);
  };

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white font-exo2">
      <div className="container mx-auto p-4">


        {/* Transaction table header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="mb-4 md:mb-0">
            <p className="text-white">Latest {transactions.length} transactions</p>
            <p className="text-gray-400 text-sm">(Auto-updating)</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-gray-300 border border-gray-700 rounded-md hover:bg-[#F5B056] hover:text-white transition-all duration-300"
              onClick={handleDownload}
            >
              <Download size={16} />
              {!isMobile && "Download Data"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center justify-center min-w-[120px] h-9 px-3 bg-white text-gray-900 border border-gray-300 rounded-md">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>


{/* Transaction table */}
<div className="overflow-x-auto">
<Table className="w-full border border-gray-800 rounded-2xl">
            <TableHeader>
              <TableRow className="bg-gray-900 border-b border-gray-800">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="text-gray-300">Transaction Hash</TableHead>
                <TableHead className="text-gray-300">Method</TableHead>
                <TableHead className="text-gray-300">Block</TableHead>
                <TableHead className="text-gray-300">Age</TableHead>
                <TableHead className="text-gray-300">From</TableHead>
                <TableHead className="text-gray-300">To</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Txn Fee</TableHead>
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
                      <button
                        onClick={() => handleMethodClick(tx.method)}
                        className={`px-3 py-1 rounded-full text-base font-medium w-25 h-10 flex items-center justify-center ${
                          selectedMethod === tx.method
                            ? 'bg-[#F5B056] text-white border-2 border-[#F5B056]'
                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#F5B056] transition-all duration-300'
                        }`}
                      >
                        {tx.method}
                      </button>
                    </TableCell>
                    <TableCell>{tx.block}</TableCell>
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
                    <TableCell>{formatAmount(tx.amount)}</TableCell>
                    <TableCell>{formatFee(tx.fee)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls (bottom) */}
        <div className="flex justify-center md:justify-between items-center mt-4 flex-wrap gap-2">
          <br />
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center justify-center min-w-[120px] h-9 px-3 bg-white text-gray-900 border border-gray-300 rounded-md">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-[#F5B069]"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>

        {/* Info text */}
        <p className="mt-4 text-sm text-gray-400">
          A transaction is a cryptographically signed instruction that changes the blockchain state.
          Block explorers track the details of all transactions in the network.
        </p>

        {/* Back to top button */}
        <Button
          id="back-to-top"
          variant="link"
          className="mt-4 text-blue-500 hover:text-[#F5B069]"
          onClick={scrollToTop}
        >
          Back to Top
        </Button>
      </div>
    </div>
  );
}

// Utility functions
const formatAmount = (amount: string) => {
  if (!amount) return '0 ETH';
  const value = parseFloat(amount);
  return `${value.toFixed(6)} ETH`;
};

const formatFee = (fee: string) => {
  if (!fee) return '0';
  const value = parseFloat(fee);
  return value.toFixed(6);
};
                      


                        