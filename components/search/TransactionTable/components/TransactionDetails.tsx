import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "../types";
import { formatAddress, getTransactionMethod, getBlockExplorerUrl } from "../utils";
import StatusBadge from "./StatusBadge";

interface TransactionDetailsProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (text: string, label: string) => void;
  onExternalLink: (txHash: string) => void;
  copiedText: string | null;
  address?: string | null;
  network: string;
  ethPriceUsd: number | null;
}

export default function TransactionDetails({
  transaction,
  isOpen,
  onOpenChange,
  onCopy,
  onExternalLink,
  copiedText,
  address,
  network,
  ethPriceUsd
}: TransactionDetailsProps) {
  if (!transaction) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border border-amber-500/20">
        <DialogHeader>
          <DialogTitle className="text-xl text-amber-400">Transaction Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-amber-400">Transaction Hash</h3>
                <div className="flex items-center">
                  <code className="bg-gray-800 px-2 py-1 rounded font-mono text-xs break-all">
                    {transaction.id}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="ml-2 h-8 w-8" 
                    onClick={() => onCopy(transaction.id, 'Hash')}
                  >
                    {copiedText === 'Hash' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-amber-400">Status</h3>
                <div>
                  <StatusBadge status={transaction.status} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-amber-400">From</h3>
                <div className="flex items-center">
                  <code className="bg-gray-800 px-2 py-1 rounded font-mono text-xs break-all">
                    {transaction.from}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="ml-2 h-8 w-8" 
                    onClick={() => onCopy(transaction.from, 'Address')}
                  >
                    {copiedText === 'Address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </Button>
                </div>
                {formatAddress(transaction.from, transaction.from.toLowerCase() === address?.toLowerCase()).name && (
                  <p className="text-xs text-gray-400">
                    {formatAddress(transaction.from, transaction.from.toLowerCase() === address?.toLowerCase()).name}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-amber-400">To</h3>
                <div className="flex items-center">
                  <code className="bg-gray-800 px-2 py-1 rounded font-mono text-xs break-all">
                    {transaction.to || "Contract Creation"}
                  </code>
                  {transaction.to && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="ml-2 h-8 w-8" 
                      onClick={() => onCopy(transaction.to, 'To Address')}
                    >
                      {copiedText === 'To Address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </Button>
                  )}
                </div>
                {transaction.to && formatAddress(transaction.to, transaction.to.toLowerCase() === address?.toLowerCase()).name && (
                  <p className="text-xs text-gray-400">
                    {formatAddress(transaction.to, transaction.to.toLowerCase() === address?.toLowerCase()).name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-amber-400">Value</h3>
                <p>
                  {transaction.value}
                  {ethPriceUsd && transaction.value && (
                    <span className="text-xs text-gray-400 ml-2">
                      (${(parseFloat(transaction.value) * ethPriceUsd).toFixed(2)} USD)
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-amber-400">Transaction Type</h3>
                <p className="mt-1">
                  <Badge className={`${
                    transaction.type === 'swap' ? 'bg-purple-900/50 text-purple-300 border-purple-800' :
                    transaction.type === 'inflow' ? 'bg-green-900/50 text-green-300 border-green-800' :
                    transaction.type === 'outflow' ? 'bg-red-900/50 text-red-300 border-red-800' :
                    'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                    {transaction.type}
                  </Badge>
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-amber-400">Transaction Details</h3>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-800/50 p-3 rounded-md">
                <div>
                  <span className="text-xs text-gray-400">Block Number:</span>
                  <span className="text-sm ml-2 text-gray-200">{transaction.blockNumber || 'Pending'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Timestamp:</span>
                  <span className="text-sm ml-2 text-gray-200">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Gas Limit:</span>
                  <span className="text-sm ml-2 text-gray-200">{transaction.gas?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Gas Used:</span>
                  <span className="text-sm ml-2 text-gray-200">{transaction.gasUsed?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Gas Price:</span>
                  <span className="text-sm ml-2 text-gray-200">
                    {transaction.gasPrice ? `${(transaction.gasPrice / 1e9).toFixed(2)} Gwei` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Nonce:</span>
                  <span className="text-sm ml-2 text-gray-200">{transaction.nonce}</span>
                </div>
              </div>
            </div>
            {transaction.input && transaction.input !== '0x' && (
              <div>
                <h3 className="text-sm font-medium text-amber-400">Input Data</h3>
                <div className="mt-2 relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs"
                      onClick={() => onCopy(transaction.input || '', 'Input data')}
                    >
                      <Copy size={12} className="mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="font-mono text-xs bg-gray-800 p-3 pt-10 rounded-md overflow-x-auto max-h-40">
                    {transaction.input}
                  </div>
                  <div className="mt-2 px-3 py-2 bg-gray-800/50 rounded-md">
                    <span className="text-xs text-gray-400">Method ID:</span>{' '}
                    <span className="font-mono text-amber-400">{getTransactionMethod(transaction).id}</span>
                    <br />
                    <span className="text-xs text-gray-400">Function:</span>{' '}
                    <span className="font-mono text-amber-400">{getTransactionMethod(transaction).name}()</span>
                  </div>
                </div>
              </div>
            )}
            {transaction.tokenTransfers && transaction.tokenTransfers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-amber-400">Token Transfers</h3>
                <div className="mt-2 space-y-2">
                  {transaction.tokenTransfers.map((transfer, index) => (
                    <div key={index} className="bg-gray-800/50 p-3 rounded-md mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{transfer.tokenSymbol || 'Token'}</span>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {transfer.value} {transfer.tokenSymbol}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-gray-400">From:</span>{' '}
                          <span className="font-mono">{formatAddress(transfer.from).formatted}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">To:</span>{' '}
                          <span className="font-mono">{formatAddress(transfer.to).formatted}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => onExternalLink(transaction.id)}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on {network === 'optimism' ? 'Optimistic Etherscan' : network === 'arbitrum' ? 'Arbiscan' : 'Etherscan'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}