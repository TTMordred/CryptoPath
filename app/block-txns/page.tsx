"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, ArrowLeft,
  ChevronLeft, ChevronRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ParticlesBackground from "@/components/ParticlesBackground";

interface Transaction {
  blockHash: string;
  blockNumber: string;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  nonce: string;
  to: string;
  transactionIndex: string;
  value: string;
  type: string;
  timestamp: number;
}

interface BlockData {
  blockNumber: string;
  timestamp: number;
  transactions: Transaction[];
  total: number;
}

const ITEMS_PER_PAGE = 20;

export default function BlockTransactions() {
  const searchParams = useSearchParams();
  const blockNumber = searchParams.get("number");
  const router = useRouter();
  
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchBlockData = async () => {
      // Reset states when starting a new fetch
      setLoading(true);
      setError(null);
      setBlockData(null);
      setPage(1); // Reset pagination when new block is loaded

      if (!blockNumber) {
        setError("Block number is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/alchemy-block-txns?blockNumber=${blockNumber}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch block data");
        }

        setBlockData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching block data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch block data");
        setBlockData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockData();
  }, [blockNumber]);

  if (loading) {
    return (
      <>
        <ParticlesBackground />
        <div className="container mx-auto p-4">
          <Card className="mt-8 bg-transparent border-amber-500/20">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
              <p className="mt-4 text-amber-500 animate-pulse">Loading Block Transactions...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !blockData) {
    return (
      <>
        <ParticlesBackground />
        <div className="container mx-auto p-4">
          <Card className="mt-8 border-red-500/50">
            <CardContent className="p-6">
              <div className="text-center text-red-500">
                <p className="text-lg">{error || "Block data not found"}</p>
                <Button
                  variant="ghost"
                  className="mt-4 text-amber-500 hover:text-amber-400"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const totalTransactions = blockData.total;
  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalTransactions);
  const paginatedTransactions = blockData.transactions.slice(startIndex, endIndex);

  return (
    <>
      <ParticlesBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/block?number=${blockNumber}`)}
            className="text-amber-500 hover:text-amber-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Block
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              Block #{blockData.blockNumber}
              <Badge className="ml-2 bg-amber-500/20 text-amber-300">
                {totalTransactions} Transactions
              </Badge>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(blockData.timestamp * 1000).toLocaleString()}
            </p>
          </div>
        </div>

        <Card className="bg-transparent border-amber-500/20 shadow-xl hover:shadow-amber-500/10 transition-all duration-500 rounded-[10px] backdrop-blur-sm">
          <CardContent className="p-6">
            {totalTransactions > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-amber-500/70">Tx Hash</TableHead>
                        <TableHead className="text-amber-500/70">From</TableHead>
                        <TableHead className="text-amber-500/70">To</TableHead>
                        <TableHead className="text-right text-amber-500/70">Value (ETH)</TableHead>
                        <TableHead className="text-right text-amber-500/70">Gas Price (Gwei)</TableHead>
                        <TableHead className="text-right text-amber-500/70">Gas Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((tx) => (
                        <TableRow key={tx.hash} className="hover:bg-amber-500/5">
                          <TableCell className="font-mono">
                            <Button
                              variant="ghost"
                              className="p-0 h-auto font-mono text-xs hover:text-amber-500"
                              onClick={() => router.push(`/txn-hash?hash=${tx.hash}`)}
                            >
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="p-0 h-auto font-mono text-xs hover:text-amber-500"
                              onClick={() => router.push(`/search?address=${tx.from}`)}
                            >
                              {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="p-0 h-auto font-mono text-xs hover:text-amber-500"
                              onClick={() => router.push(`/search?address=${tx.to}`)}
                            >
                              {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(tx.value).toFixed(12)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(Number(tx.gasPrice) / 1e9).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(tx.gas).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-400">
                      Showing {startIndex + 1}-{endIndex} of {totalTransactions}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-amber-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-amber-500 py-8">
                No transactions found in this block
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}