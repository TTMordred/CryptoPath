"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Code, Copy, CheckCircle2, XCircle, 
  Shield, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface ContractDetailsProps {
  address: string;
}

export default function ContractDetails({ address }: ContractDetailsProps) {
  interface ContractData {
    isContract: boolean;
    contractInfo?: {
      name: string;
      symbol?: string;
      tokenType?: string;
      verified?: boolean;
    };
  }

  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getDetailsLink = (tokenType?: string) => {
    switch (tokenType?.toUpperCase()) {
      case 'ERC721':
        return `/NFT/collection/${address}`;
      case 'ERC1155':
        return `/NFT/collection/${address}`;
      case 'ERC20':
        return `/token?address=${address}`;
      default:
        return false;
    }
  };
  useEffect(() => {
    const fetchContractData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/alchemy-iscontract?address=${address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch contract data");
        }

        setContractData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch contract data");
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, [address]);

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-amber-500/20">
        <CardContent className="p-4">
          <Skeleton className="h-8 w-1/3 bg-amber-500/10" />
        </CardContent>
      </Card>
    );
  }

  if (!contractData?.isContract) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-amber-500/20">
        <CardContent className="p-4 text-center">
          <XCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <p className="text-gray-400">Regular wallet address</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !contractData.contractInfo) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-red-500/50">
        <CardContent className="p-4 text-center">
          <p className="text-red-500 text-sm">{error || "Error loading data"}</p>
        </CardContent>
      </Card>
    );
  }

  const { contractInfo } = contractData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="bg-black/40 backdrop-blur-xl border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-medium text-amber-500">
                  {contractInfo.name || "Smart Contract"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {contractInfo.symbol && (
                    <Badge className="bg-amber-500/20 text-amber-300 text-xs">
                      {contractInfo.symbol}
                    </Badge>
                  )}
                  {contractInfo.tokenType && (
                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                      {contractInfo.tokenType}
                    </Badge>
                  )}
                  {contractInfo.verified && (
                    <Badge className="bg-green-500/20 text-green-300 text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-500 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                const link = getDetailsLink(contractInfo.tokenType);
                if (link) window.location.href = link;
              }}
              disabled={!getDetailsLink(contractInfo.tokenType)}
            >
              <span className="text-sm mr-2">
                {contractInfo.tokenType?.toUpperCase()?.includes('ERC721') || 
                contractInfo.tokenType?.toUpperCase()?.includes('ERC1155') 
                  ? 'View NFT'
                  : contractInfo.tokenType?.toUpperCase() === 'ERC20'
                    ? 'View Token'
                    : 'View Contract'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}