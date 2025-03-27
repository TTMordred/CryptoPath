"use client";

import { useEffect, useState } from "react";
import { useSearchParams,useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Copy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDownRight, ArrowLeft } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";

interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueInEth: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed: string;
  nonce: number;
  status: string;
  timestamp: number;
  blockNumber: number;
  blockHash: string;
  confirmations: number;
  effectiveGasPrice: string;
  type: number;
  data: string;
  txFee: string;
}

export default function TransactionDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash");
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formatGwei = (wei: string) => {
    return (Number(wei) / 1e9).toFixed(2) + " Gwei";
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      // Reset states when starting a new fetch
      setLoading(true);
      setError(null);
      setTransaction(null);

      if (!hash) {
        setError("Transaction hash is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/alchemy-txnhash/?hash=${hash}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch transaction details");
        }

        setTransaction(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch transaction details");
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [hash]);

  const getExplorerUrl = () => {
    return `https://etherscan.io/tx/${hash}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="container mx-auto p-4"
      >
        <Card className="mt-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-500/20">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            <p className="mt-4 text-amber-500 animate-pulse">Loading Transaction Details...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error || !transaction) {
    return (
      <>
        <ParticlesBackground />
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="container mx-auto p-4"
        >
          <Card className="mt-8 border-red-500/50">
            <CardContent className="p-6">
              <div className="text-center text-red-500">
                <XCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Transaction Error</h3>
                <p>{error || "Transaction not found"}</p>
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
        </motion.div>
      </>
    );
  }

  if (!transaction) return null;

  return (
    <>
    <ParticlesBackground/>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <Card className="mt-8 bg-transparent border-amber-500/20 shadow-xl hover:shadow-amber-500/10 transition-all duration-500 rounded-[10px] backdrop-blur-sm">
        <CardHeader className="bg-black/40 border-b border-amber-500">
          <motion.div 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="flex items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                Transaction Details
              </span>
              <Badge 
                variant={transaction.status === "Success" ? "default" : "destructive"}
                className={`${
                  transaction.status === "Success" 
                    ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                } animate-pulse`}
              >
                {transaction.status}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(transaction.hash)}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all duration-300"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Hash
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getExplorerUrl(), "_blank")}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all duration-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Explorer
              </Button>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Transaction Basic Info */}
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-center gap-2">
                <h3 className="text-sm text-amber-500">Transaction Hash</h3>
              </div>
              <p className="font-mono text-sm mt-2 text-white/90">{transaction.hash}</p>
            </div>

            {/* From/To Section */}
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm text-amber-500">From</h3>
              </div>
              <Button
                variant="ghost"
                className="font-mono text-sm mt-2 text-white/90 p-0 h-auto hover:text-amber-500"
                onClick={() => router.push(`/search/?address=${transaction.from}`)}
              >
                {transaction.from}
              </Button>
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm text-amber-500">To</h3>
              </div>
              <Button
                variant="ghost"
                className="font-mono text-sm mt-2 text-white/90 p-0 h-auto hover:text-amber-500"
                onClick={() => router.push(`/search/?address=${transaction.to}`)}
              >
                {transaction.to}
              </Button>
            </div>

            {/* Value Section */}
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <h3 className="text-sm text-amber-500">Value</h3>
              <p className="font-mono text-xl mt-2 bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                {transaction.valueInEth} ETH
                <span className="text-sm ml-2 text-gray-400">
                  (${(Number(transaction.valueInEth) * 2000).toFixed(4)})
                </span>
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Gas Information */}
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <h3 className="text-sm text-amber-500">Gas Information</h3>
              <div className="mt-2 space-y-2">
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Gas Price:</span>
                  <span className="text-white/90">{formatGwei(transaction.gasPrice)}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Gas Limit:</span>
                  <span className="text-white/90">{transaction.gasLimit}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Gas Used:</span>
                  <span className="text-white/90">
                    {transaction.gasUsed} ({(Number(transaction.gasUsed) / Number(transaction.gasLimit) * 100).toFixed(2)}%)
                  </span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Effective Gas Price:</span>
                  <span className="text-white/90">{formatGwei(transaction.effectiveGasPrice)}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Transaction Fee:</span>
                  <span className="text-white/90">{transaction.txFee+"ETH"}</span>
                </p>
              </div>
            </div>

            {/* Block Information */}
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <h3 className="text-sm text-amber-500">Block Information</h3>
              <div className="mt-2 space-y-2">
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Block Number:</span>
                  <span className="text-white/90">#{transaction.blockNumber}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Block Hash:</span>
                  <span className="text-white/90 text-xs">{transaction.blockHash}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Confirmations:</span>
                  <span className="text-white/90">{transaction.confirmations}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white/90">
                    {format(new Date(transaction.timestamp * 1000), "PPpp")}
                  </span>
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
              <h3 className="text-sm text-amber-500">Transaction Details</h3>
              <div className="mt-2 space-y-2">
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Nonce:</span>
                  <span className="text-white/90">{transaction.nonce}</span>
                </p>
                <p className="font-mono text-sm flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white/90">{transaction.type}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transaction Data Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-amber-500/10"
        >
          <h3 className="text-sm text-amber-500 mb-4">Input Data</h3>
          <div className="bg-black/40 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words text-white/80">
              {transaction.data}
            </pre>
          </div>
        </motion.div>
      </CardContent>
      </Card>
    </motion.div>
    </>
  );
}