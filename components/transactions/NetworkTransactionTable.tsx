'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Eye, ChevronLeft, ChevronRight, Download, Copy } from 'lucide-react'
import { toast, useToast } from "@/components/ui/use-toast"
import { ethers } from 'ethers';

interface CoinOption {
  id: string;
  name: string;
}

interface NetworkTransactionTableProps {
  selectedCoin?: CoinOption | null;
}

interface Transaction {
  hash: string;
  method: string;
  block?: string;
  age?: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasUsed?: string;
  timestamp: number;
}

export default function NetworkTransactionTable({ selectedCoin }: NetworkTransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRelativeTime = (timestamp: number | string) => {
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp * 1000;
    const now = Date.now();
    const diff = now - ts;

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

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let response;
        if (selectedCoin) {
          // Fetch token transactions
          response = await fetch(`/api/token-transactions?coinId=${selectedCoin.id}&page=${page}&offset=50`);
        } else {
          // Fetch latest block transactions (default to ETH)
          const blockResponse = await fetch('/api/etherscan?module=proxy&action=eth_blockNumber');
          if (!blockResponse.ok) throw new Error('Failed to fetch latest block');
          const blockData = await blockResponse.json();
          
          response = await fetch(
            `/api/etherscan?module=proxy&action=eth_getBlockByNumber&tag=${blockData.result}&boolean=true`
          );
        }

        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        let formattedTransactions: Transaction[];
        if (selectedCoin) {
          // Token transactions are already formatted from the API
          formattedTransactions = data;
        } else {
          // Format ETH transactions from block data
          formattedTransactions = data.result.transactions.slice(0, 50).map((tx: any) => {
            const timestamp = parseInt(data.result.timestamp, 16);
            return {
              hash: tx.hash,
              method: tx.input === '0x' ? 'Transfer' : 'Contract Interaction',
              block: parseInt(tx.blockNumber, 16).toString(),
              age: getRelativeTime(timestamp),
              from: tx.from,
              to: tx.to || 'Contract Creation',
              value: `${ethers.utils.formatEther(tx.value)} ETH`,
              gasPrice: tx.gasPrice,
              gasUsed: tx.gas,
              timestamp
            };
          });
        }

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
        toast({
          title: "Error",
          description: "Failed to fetch transactions. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
    const interval = selectedCoin ? null : setInterval(fetchTransactions, 15000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCoin, page]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-800">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Txn Hash</TableHead>
            <TableHead>Method</TableHead>
            {!selectedCoin && <TableHead>Block</TableHead>}
            <TableHead>Age</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={selectedCoin ? 7 : 8} className="text-center py-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F5B056]"></div>
                  <span>Loading transactions...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={selectedCoin ? 7 : 8} className="text-center py-4 text-red-500">
                {error}
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={selectedCoin ? 7 : 8} className="text-center py-4">
                No transactions found
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
                {!selectedCoin && (
                  <TableCell>
                    <Link href={`/block/${tx.block}`}>
                      <span className="cursor-pointer hover:underline text-[#F5B056]">
                        {tx.block}
                      </span>
                    </Link>
                  </TableCell>
                )}
                <TableCell>{typeof tx.timestamp === 'number' ? getRelativeTime(tx.timestamp) : getRelativeTime(new Date(tx.timestamp).getTime() / 1000)}</TableCell>
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
                <TableCell>{tx.value}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 