"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Copy, ExternalLink, 
  Clock, Hash, ChevronUp,
  Cpu, Fuel, Pickaxe,
  Database, Layers
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import ParticlesBackground from "@/components/ParticlesBackground";

interface BlockDetails {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  nonce: string;
  difficulty: string;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  baseFeePerGas: string;
  extraData: string;
  transactions: string[];
  size: string;
}

const InfoCard = ({ title, icon: Icon, children }: any) => (
  <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
    <div className="flex items-center gap-2 text-amber-500 mb-2">
      <Icon className="h-4 w-4" />
      <h3 className="text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

export default function BlockDetails() {
  const searchParams = useSearchParams();
  const blockNumber = searchParams.get("number");
  const router = useRouter();
  const [block, setBlock] = useState<BlockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!blockNumber) {
        setError("Block number is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/alchemy-block?blockNumber=${blockNumber}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch block details");
        }

        setBlock(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch block details");
      } finally {
        setLoading(false);
      }
    };

    fetchBlock();
  }, [blockNumber]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mt-8 bg-transparent border-amber-500/20">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            <p className="mt-4 text-amber-500 animate-pulse">Loading Block Details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mt-8 border-red-500/50">
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p className="text-lg">{error || "Block not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <ParticlesBackground />
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <Card className="mt-8 bg-transparent border-amber-500/20 shadow-xl hover:shadow-amber-500/10 transition-all duration-500 backdrop-blur-sm rounded-[10px]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Block Number" icon={Layers}>
              <p className="text-2xl font-mono bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                #{block.number}
              </p>
            </InfoCard>

            <InfoCard title="Timestamp" icon={Clock}>
              <p className="font-mono text-sm text-white/90">
                {format(new Date(block.timestamp), "PPpp")}
              </p>
            </InfoCard>

            <InfoCard title="Hash" icon={Hash}>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-white/90 truncate">
                  {block.hash}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(block.hash)}
                  className="hover:text-amber-500"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </InfoCard>

            <InfoCard title="Parent Hash" icon={ChevronUp}>
              <Button
                variant="ghost"
                className="font-mono text-xs text-white/90 truncate p-0 h-auto hover:text-amber-500"
                onClick={() => router.push(`/block?number=${Number(block.number) - 1}`)}
              >
                {block.parentHash}
              </Button>
            </InfoCard>

            <InfoCard title="Gas Used / Limit" icon={Fuel}>
                <div className="flex items-center gap-4">
                    {/* Circular Progress Bar */}
                    <div className="w-16 h-16">
                    <CircularProgressbar
                        value={(Number(block.gasUsed) / Number(block.gasLimit)) * 100}
                        text={`${((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(0)}%`}
                        styles={buildStyles({
                        textColor: "#10B981", // Green text
                        pathColor: "#10B981", // Green path
                        trailColor: "#374151", // Gray trail
                        })}
                    />
                    </div>

                    {/* Gas Usage Details */}
                    <div>
                    <p className="font-mono text-sm text-white/90">
                        {Number(block.gasUsed).toLocaleString()} / {Number(block.gasLimit).toLocaleString()}
                        <span className="text-amber-500 ml-2">
                        ({((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(2)}%)
                        </span>
                    </p>
                    <p className="text-sm text-green-400 mt-1">+{((Number(block.gasUsed) / Number(block.gasLimit)) * 100 - 100).toFixed(2)}% Gas Target</p>
                    </div>
                </div>
            </InfoCard>

            <InfoCard title="Miner" icon={Pickaxe}>
              <Button
                variant="ghost"
                className="font-mono text-xs text-white/90 truncate p-0 h-auto hover:text-amber-500"
                onClick={() => router.push(`/search?address=${block.miner}`)}
              >
                {block.miner}
              </Button>
            </InfoCard>

            <InfoCard title="Base Fee" icon={Cpu}>
              <p className="font-mono text-sm text-white/90">
                {(Number(block.baseFeePerGas) / 1e9).toFixed(2)} Gwei
              </p>
            </InfoCard>

            <InfoCard title="Size" icon={Database}>
              <p className="font-mono text-sm text-white/90">
                {Number(block.size).toLocaleString()} bytes
              </p>
            </InfoCard>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-amber-500 mb-4">
                Transactions 
                <Badge className="ml-2 bg-amber-500/20 text-amber-300">
                {block.transactions.length}
                </Badge>
            </h3>
            <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {block.transactions.slice(0, 9).map((hash) => (
                    <Button
                    key={hash}
                    variant="ghost"
                    className="font-mono text-xs text-white/90 truncate hover:text-amber-500"
                    onClick={() => router.push(`/txn-hash?hash=${hash}`)}
                    >
                    {hash.slice(0, 16)}...{hash.slice(-8)}
                    </Button>
                ))}
                </div>
                {block.transactions.length > 9 && (
                <div className="flex justify-center mt-4">
                    <Button
                    variant="ghost"
                    className="text-amber-500 hover:text-amber-400"
                    onClick={() => router.push(`/block-txns?number=${block.number}`)}
                    >
                    View all {block.transactions.length} transactions
                    </Button>
                </div>
                )}
            </div>
            </div>
        </CardContent>
      </Card>
    </motion.div>
    </>
  );
}