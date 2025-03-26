"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ParticlesBackground from "@/components/ParticlesBackground";
import { 
  Loader2, Copy, ExternalLink, 
  Coins, Users, ArrowLeftRight, 
  Calendar, Shield, Clock,
  TrendingUp, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// Types
interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timestamp: string;
}

interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  totalSupply: string;
  logo: string;
  holders: number;
  transfers: number;
  lastUpdated: string;
  contractDeployed: string;
  implementation?: string;
  isProxy: boolean;
  recentTransfers: TokenTransfer[];
  priceUSD?: string;
  volume24h?: string;
  marketCap?: string;
}

// Helper Functions
const formatNumber = (num: number | string, useCommas = true) => {
    if (!useCommas) return Number(num).toString();
    return new Intl.NumberFormat().format(Number(num));
  };

const formatUSD = (value: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value));
};

// Components
const TokenStatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  delay 
}: { 
  icon: any; 
  title: string; 
  value: React.ReactNode; 
  delay: number; 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-black/20 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300"
  >
    <div className="flex items-center gap-2 text-amber-500 mb-2">
      <Icon className="h-5 w-5" />
      <h3>{title}</h3>
    </div>
    <p className="text-2xl font-mono">{value}</p>
  </motion.div>
);

// Main Component
export default function TokenPage() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const [token, setToken] = useState<TokenDetails | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (!address) {
        setError("Token address is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/alchemy-token?address=${address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch token details");
        }

        setToken(data);
      } catch (err) {
        console.error("Error fetching token:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch token details");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mt-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-500/20">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            <p className="mt-4 text-amber-500 animate-pulse">Loading Token Details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mt-8 border-red-500/50">
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p className="text-lg">{error || "Token not found"}</p>
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
      <Card className="mt-8 bg-transparent border-amber-500/20 shadow-xl hover:shadow-amber-500/10 transition-all duration-500 rounded-[10px]">
        <CardHeader className="bg-black/40 border-b border-amber-500/10">
          <motion.div 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={token.logo} 
                  alt={token.name}
                  className="w-16 h-16 rounded-full bg-black/50"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-token.png';
                  }}
                />
                {token.priceUSD && (
                  <Badge 
                    className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-[10px] hover:bg-emerald-400/20"
                    variant="secondary"
                  >
                    ${Number(token.priceUSD).toFixed(2)}
                  </Badge>
                )}
              </div>
              <div>
                <CardTitle className="text-3xl bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
                  {token.name}
                  <Badge className="ml-2 bg-amber-500/20 text-amber-300">
                    {token.symbol}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1 font-mono">
                  {token.address}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(token.address)}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://etherscan.io/token/${token.address}`, "_blank")}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Explorer
              </Button>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TokenStatCard
              icon={Coins}
              title="Total Supply"
              value={
                <>
                  {formatNumber(Number(token.totalSupply) / Math.pow(10, token.decimals))}
                  <span className="text-sm text-gray-400 ml-2">{token.symbol}</span>
                </>
              }
              delay={0.2}
            />
            <TokenStatCard
              icon={Users}
              title="Holders"
              value={token.holders+"%"}
              delay={0.3}
            />
            <TokenStatCard
              icon={ArrowLeftRight}
              title="Transfers"
              value={formatNumber(token.transfers)}
              delay={0.4}
            />
            
            {token.marketCap && (
              <TokenStatCard
                icon={TrendingUp}
                title="Market Cap"
                value={formatUSD(token.marketCap)}
                delay={0.5}
              />
            )}
            
            {token.volume24h && (
              <TokenStatCard
                icon={BarChart3}
                title="24h Volume"
                value={formatUSD(token.volume24h)}
                delay={0.6}
              />
            )}
            
            <TokenStatCard
              icon={Calendar}
              title="Deployed On"
              value={new Date(token.contractDeployed).toLocaleDateString()}
              delay={0.7}
            />
          </div>

          {token.recentTransfers && token.recentTransfers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <h3 className="text-xl font-semibold text-amber-500 mb-4">Recent Transfers</h3>
              <div className="bg-black/20 rounded-xl border border-amber-500/10 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-amber-500/5">
                      <TableHead className="text-amber-500/70">Transaction</TableHead>
                      <TableHead className="text-amber-500/70">Block</TableHead>
                      <TableHead className="text-amber-500/70">Type</TableHead>
                      <TableHead className="text-amber-500/70">From</TableHead>
                      <TableHead className="text-amber-500/70">To</TableHead>
                      <TableHead className="text-amber-500/70">Amount</TableHead>
                      <TableHead className="text-amber-500/70">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {token.recentTransfers.map((transfer) => (
                      <TableRow 
                        key={transfer.hash}
                        className="hover:bg-amber-500/5 transition-colors"
                      >
                        <TableCell className="font-mono">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/txn-hash/?hash=${transfer.hash}`)}
                            className="hover:text-amber-500 transition-colors p-0"
                          >
                            {transfer.hash.slice(0, 6)}...{transfer.hash.slice(-4)}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://etherscan.io/block/${transfer.blockNumber}`, "_blank")}
                            className="hover:text-amber-500 transition-colors p-0"
                        >
                            {formatNumber(transfer.blockNumber, false)}
                        </Button>
                        </TableCell>
                        <TableCell>
                          {transfer.from === token.address ? (
                            <Badge variant="destructive" className="bg-rose-500/20 text-rose-300">
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                              Out
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-emerald-500/20 text-emerald-300">
                              <ArrowDownRight className="w-3 h-3 mr-1" />
                              In
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/search/?address=${transfer.from}`)}
                            className="font-mono hover:text-amber-500 transition-colors p-0"
                          >
                            {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/search/?address=${transfer.to}`)}
                            className="font-mono hover:text-amber-500 transition-colors p-0"
                          >
                            {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono whitespace-nowrap">
                        <span className={transfer.from === token.address ? "text-rose-400" : "text-emerald-400"}>
                            {transfer.from === token.address ? "-" : "+"}
                        </span>
                        {/* {(Number(transfer.value) / Math.pow(10, token.decimals))} {token.symbol} */}
                        {transfer.value} {token.symbol}
                        {token.priceUSD && (
                            <div className="text-xs text-gray-500">
                            {formatUSD((Number(transfer.value) / Math.pow(10, token.decimals) * Number(token.priceUSD)).toString())}
                            </div>
                        )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-gray-400">
                          {new Date(transfer.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    </>
  );
}