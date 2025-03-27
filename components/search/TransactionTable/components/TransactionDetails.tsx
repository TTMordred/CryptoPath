import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Check, ArrowRight, ArrowUpRight, Info, DollarSign, ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "../types";
import { formatAddress, getTransactionMethod, getBlockExplorerUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "./StatusBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // Get explorer name based on network
  const getExplorerName = () => {
    switch (network) {
      case 'optimism': return 'Optimistic Etherscan';
      case 'arbitrum': return 'Arbiscan';
      default: return 'Etherscan';
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl bg-gradient-to-b from-gray-900 to-gray-950 border border-amber-500/20 shadow-lg shadow-amber-900/10 p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0"></div>
              
              <DialogHeader className="p-6 pb-2 border-b border-amber-500/10">
                <motion.div 
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 flex items-center gap-2">
                    <Info className="h-5 w-5 text-amber-500" />
                    Transaction Details
                  </DialogTitle>
                </motion.div>
              </DialogHeader>
              
              <ScrollArea className="h-[70vh] lg:max-h-[600px] pr-4">
                <div className="p-6 space-y-6">
                  {/* Transaction Overview Card */}
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center">
                          <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                          Transaction Hash
                        </h3>
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-amber-500/5 opacity-0 group-hover:opacity-100 rounded-lg blur-sm transition duration-300"></div>
                          <div className="relative flex items-center bg-gray-900 p-2 rounded-lg">
                            <code className="text-xs font-mono text-amber-300 truncate overflow-hidden w-full break-all">
                              {transaction.id}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="ml-2 h-7 w-7 opacity-50 hover:opacity-100 hover:bg-gray-800" 
                              onClick={() => onCopy(transaction.id, 'Hash')}
                            >
                              {copiedText === 'Hash' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex gap-6">
                          <div>
                            <span className="text-xs text-gray-400 block">Status</span>
                            <div className="mt-1">
                              <StatusBadge status={transaction.status} />
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 block">Block</span>
                            <span className="text-md font-mono text-amber-400">#{transaction.blockNumber}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 block">Type</span>
                            <div className="mt-1">
                              <div className={`
                                inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                ${transaction.type === 'swap' ? 'bg-purple-900/30 text-purple-300 border border-purple-800/50' : 
                                  transaction.type === 'inflow' ? 'bg-green-900/30 text-green-300 border border-green-800/50' :
                                  transaction.type === 'outflow' ? 'bg-red-900/30 text-red-300 border border-red-800/50' :
                                  'bg-gray-800/50 text-gray-300 border border-gray-700/50'}
                              `}>
                                {transaction.type}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center">
                          <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                          Transaction Value
                        </h3>
                        
                        <div className="flex flex-col bg-gray-900 p-3 rounded-lg">
                          <span className="text-2xl font-bold text-white">{transaction.value}</span>
                          {ethPriceUsd && transaction.value && (
                            <span className="text-sm text-gray-400">
                              ≈ ${(parseFloat(transaction.value) * ethPriceUsd).toFixed(2)} USD
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between text-sm bg-gray-900/50 p-2 rounded-lg">
                          <span className="text-gray-400">Transaction Fee:</span>
                          <span className="font-mono text-amber-400">{((transaction.gasUsed || 0) * (transaction.gasPrice || 0) / 1e18).toFixed(6)} ETH</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* From/To Card with Animation */}
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                      <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                      Transaction Path
                    </h3>
                    
                    <div className="relative">
                      {/* Sender */}
                      <div className="flex flex-col mb-2">
                        <div className="text-xs text-gray-400 mb-1">From</div>
                        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-amber-500">F</span>
                          </div>
                          <div className="flex-1">
                            <code className="text-sm font-mono text-amber-300 break-all">
                              {transaction.from}
                            </code>
                            {formatAddress(transaction.from, transaction.from.toLowerCase() === address?.toLowerCase()).name && (
                              <div className="text-xs text-amber-500/80">
                                {formatAddress(transaction.from, transaction.from.toLowerCase() === address?.toLowerCase()).name}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onCopy(transaction.from, 'From Address')}
                            className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-gray-800"
                          >
                            {copiedText === 'From Address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex justify-center my-2">
                        <motion.div 
                          animate={{ y: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowDown className="h-6 w-6 text-amber-500/50" />
                        </motion.div>
                      </div>
                      
                      {/* Recipient */}
                      <div className="flex flex-col">
                        <div className="text-xs text-gray-400 mb-1">To</div>
                        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-500">T</span>
                          </div>
                          <div className="flex-1">
                            <code className="text-sm font-mono text-blue-300 break-all">
                              {transaction.to || "Contract Creation"}
                            </code>
                            {transaction.to && formatAddress(transaction.to, transaction.to.toLowerCase() === address?.toLowerCase()).name && (
                              <div className="text-xs text-blue-500/80">
                                {formatAddress(transaction.to, transaction.to.toLowerCase() === address?.toLowerCase()).name}
                              </div>
                            )}
                          </div>
                          {transaction.to && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => onCopy(transaction.to, 'To Address')}
                              className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-gray-800"
                            >
                              {copiedText === 'To Address' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Transaction Details Card */}
                  <motion.div 
                    className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                      <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                      Technical Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">Timestamp</span>
                        <span className="text-sm text-gray-200">{new Date(transaction.timestamp).toLocaleString()}</span>
                      </div>
                      
                      <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">Gas Limit</span>
                        <span className="text-sm text-gray-200">{transaction.gas?.toLocaleString() || 'N/A'}</span>
                      </div>
                      
                      <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">Gas Used</span>
                        <span className="text-sm text-gray-200">
                          {transaction.gasUsed?.toLocaleString() || 'N/A'} 
                          {transaction.gasUsed && transaction.gas && (
                            <span className="text-amber-500/70 ml-1">
                              ({((transaction.gasUsed / transaction.gas) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">Gas Price</span>
                        <span className="text-sm text-gray-200">
                          {transaction.gasPrice ? `${(transaction.gasPrice / 1e9).toFixed(2)} Gwei` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">Nonce</span>
                        <span className="text-sm text-gray-200">{transaction.nonce}</span>
                      </div>
                      
                      <div className="bg-gray-900/70 p-3 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">Block Confirmation</span>
                        <span className="text-sm text-gray-200">
                          {transaction.blockNumber ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Method/Input Data Card */}
                  {transaction.input && transaction.input !== '0x' && (
                    <motion.div 
                      className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                        <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                        Contract Interaction
                      </h3>
                      
                      <div className="bg-gray-900/70 p-3 rounded-lg mb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Method:</span>
                            <div className="bg-gray-800 px-2 py-1 rounded-md font-mono text-xs text-amber-400">{getTransactionMethod(transaction).id || 'Unknown'}</div>
                            <ArrowRight className="h-3 w-3 text-gray-600" />
                            <span className="font-semibold text-amber-400">{getTransactionMethod(transaction).name}()</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 relative">
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-xs"
                            onClick={() => onCopy(transaction.input || '', 'Input data')}
                          >
                            {copiedText === 'Input data' 
                              ? <Check size={12} className="mr-1 text-green-500" /> 
                              : <Copy size={12} className="mr-1" />}
                            {copiedText === 'Input data' ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                        <div className="font-mono text-xs bg-black/40 p-3 pt-10 rounded-md overflow-x-auto max-h-36 scrollbar scrollbar-track-gray-900 scrollbar-thumb-amber-800">
                          {transaction.input}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Token Transfers Card */}
                  {transaction.tokenTransfers && transaction.tokenTransfers.length > 0 && (
                    <motion.div 
                      className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10 shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                        <div className="w-1 h-4 bg-amber-500 rounded-full mr-2"></div>
                        Token Transfers
                      </h3>
                      
                      <div className="space-y-3">
                        {transaction.tokenTransfers.map((transfer, index) => (
                          <div key={index} className="bg-gray-900/70 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between">
                            <div className="flex items-center gap-2 mb-2 md:mb-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{transfer.tokenSymbol || 'Token'}</div>
                                <div className="text-xs text-gray-400">
                                  {formatAddress(transfer.from).formatted} → {formatAddress(transfer.to).formatted}
                                </div>
                              </div>
                            </div>
                            
                            <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/30">
                              {transfer.value} {transfer.tokenSymbol}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Action Buttons */}
                  <motion.div 
                    className="flex justify-center gap-3 mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => onExternalLink(transaction.id)}
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all flex items-center gap-2"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            View on {getExplorerName()}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open in blockchain explorer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            onClick={() => onCopy(transaction.id, 'Full Transaction')}
                            className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 transition-all flex items-center gap-2"
                          >
                            {copiedText === 'Full Transaction' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copiedText === 'Full Transaction' ? 'Copied' : 'Copy TX Hash'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy transaction hash to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                </div>
              </ScrollArea>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}