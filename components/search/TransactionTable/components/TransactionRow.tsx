import React, { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, ChevronUp, ChevronDown, Check, ArrowRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { Transaction } from "../types";
import { shortenAddress } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface TransactionRowProps {
  transaction: Transaction;
  expandedTx: string | null;
  isMobile: boolean;
  onRowClick: (txId: string) => void;
  onCopy: (text: string, label: string) => void;
  onExternalLink: (txHash: string) => void;
  getTransactionMethod: (tx: Transaction) => { id: string, name: string };
  onViewFullDetails: (tx: Transaction) => void;
  copiedText?: string | null;
  onSearchAddress?: (address: string) => void;
  onSearchHash?: (hash: string) => void;
  isHovered?: boolean;
}

export default function TransactionRow({
  transaction: tx,
  expandedTx,
  isMobile,
  onRowClick,
  onCopy,
  onExternalLink,
  getTransactionMethod,
  onViewFullDetails,
  copiedText,
  onSearchAddress,
  onSearchHash,
  isHovered
}: TransactionRowProps) {
  const isExpanded = expandedTx === tx.id;
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Color mapping for transaction types
  const typeColorMap = {
    'swap': 'bg-purple-900/50 text-purple-300 border-purple-800/50 hover:bg-purple-900/70',
    'inflow': 'bg-green-900/50 text-green-300 border-green-800/50 hover:bg-green-900/70',
    'outflow': 'bg-red-900/50 text-red-300 border-red-800/50 hover:bg-red-900/70',
    'transfer': 'bg-blue-900/50 text-blue-300 border-blue-800/50 hover:bg-blue-900/70'
  };

  const typeColor = typeColorMap[tx.type as keyof typeof typeColorMap] || 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700/70';

  return (<>
    <TableRow 
      className={`group ${isExpanded ? 'bg-amber-950/20' : isHovered ? 'bg-gray-800/30' : 'bg-transparent'} 
      transition-colors duration-300 hover:bg-amber-950/10 border-b border-gray-800/50`}
    >
      <TableCell className="font-mono">
        <div 
          className="flex items-center gap-1 group cursor-pointer"
          onMouseEnter={() => setHoveredCell('hash')}
          onMouseLeave={() => setHoveredCell(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSearchHash?.(tx.id);
          }}
        >
          <motion.span 
            className="text-[#F5B056] text-sm hover:underline"
            animate={{ 
              color: hoveredCell === 'hash' ? '#FFD79A' : '#F5B056'
            }}
            transition={{ duration: 0.2 }}
          >
            {shortenAddress(tx.id)}
          </motion.span>
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onCopy(tx.id, 'Hash'); 
                    }} 
                    className="h-6 w-6 hover:bg-amber-900/20"
                  >
                    {copiedText === 'Hash' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy transaction hash</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColor}`}>
          {tx.type}
        </Badge>
      </TableCell>
      
      <TableCell>
        <StatusBadge status={tx.status} />
      </TableCell>
      
      <TableCell className="font-mono">
        <div 
          className="flex items-center gap-1 group cursor-pointer"
          onMouseEnter={() => setHoveredCell('from')}
          onMouseLeave={() => setHoveredCell(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSearchAddress?.(tx.from);
          }}
        >
          <motion.span 
            className="text-[#F5B056] text-sm hover:underline"
            animate={{ color: hoveredCell === 'from' ? '#FFD79A' : '#F5B056' }}
            transition={{ duration: 0.2 }}
          >
            {shortenAddress(tx.from)}
          </motion.span>
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onCopy(tx.from, 'From Address'); 
                    }} 
                    className="h-6 w-6 hover:bg-amber-900/20"
                  >
                    {copiedText === 'From Address' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy from address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="font-mono">
        <div 
          className="flex items-center gap-1 group cursor-pointer"
          onMouseEnter={() => setHoveredCell('to')}
          onMouseLeave={() => setHoveredCell(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (tx.to) onSearchAddress?.(tx.to);
          }}
        >
          <motion.span 
            className="text-[#F5B056] text-sm hover:underline"
            animate={{ color: hoveredCell === 'to' ? '#FFD79A' : '#F5B056' }}
            transition={{ duration: 0.2 }}
          >
            {tx.to ? shortenAddress(tx.to) : (
              <Badge variant="outline" className="border-amber-500/20 bg-amber-900/20 text-amber-300">
                Contract Creation
              </Badge>
            )}
          </motion.span>
          {tx.to && (
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onCopy(tx.to, 'To Address'); 
                      }} 
                      className="h-6 w-6 hover:bg-amber-900/20"
                    >
                      {copiedText === 'To Address' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy to address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center">
          <span>{tx.value}</span>
          {parseFloat(tx.value) > 0.1 && (
            <div className="ml-2">
              <Badge className="bg-amber-900/30 border-amber-500/30 text-amber-300 text-xs">
                {tx.type === 'inflow' ? 'IN' : tx.type === 'outflow' ? 'OUT' : ''}
              </Badge>
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell className={isMobile ? "hidden" : ""}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {new Date(tx.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </TooltipTrigger>
            <TooltipContent>
              <p>{new Date(tx.timestamp).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onViewFullDetails(tx); 
                  }} 
                  className="h-7 w-7 hover:bg-amber-900/20 text-amber-400"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12C2 12 5 6 12 6C19 6 22 12 22 12C22 12 19 18 12 18C5 18 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View transaction details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onExternalLink(tx.id); 
                  }} 
                  className="h-7 w-7 hover:bg-amber-900/20"
                >
                  <ExternalLink size={14} className="text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on block explorer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onRowClick(tx.id); 
                }}
                className="hover:bg-amber-900/20"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? 'Hide' : 'Show'} details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
    
    <AnimatePresence>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={9} className="p-0 border-b border-amber-900/10">
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-amber-950/10 to-transparent"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
                <div className="space-y-4">
                  <div className="flex items-center mb-2">
                    <div className="h-6 w-1 bg-amber-500 rounded-full mr-2"></div>
                    <h4 className="text-sm font-medium text-amber-400">Transaction Details</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm bg-black/20 backdrop-blur-sm p-4 rounded-lg border border-amber-500/10">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-gray-400">Gas:</span>
                        <span className="ml-2 font-mono text-gray-200">{tx.gas?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Gas Price:</span>
                        <span className="ml-2 font-mono text-gray-200">{((tx.gasPrice ?? 0) / 1e9).toFixed(2)} Gwei</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Gas Used:</span>
                        <span className="ml-2 font-mono text-gray-200">
                          {tx.gasUsed?.toLocaleString()} 
                          {tx.gasUsed && tx.gas ? `(${((tx.gasUsed / tx.gas) * 100).toFixed(1)}%)` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Block:</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 font-mono text-amber-400 cursor-pointer hover:underline">{tx.blockNumber}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View block details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center mb-2">
                    <div className="h-6 w-1 bg-amber-500 rounded-full mr-2"></div>
                    <h4 className="text-sm font-medium text-amber-400">Method</h4>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg border border-amber-500/10">
                    <div className="flex items-center space-x-1">
                      <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                        {getTransactionMethod(tx).id || 'N/A'}
                      </Badge>
                      <ArrowRight size={12} className="text-gray-600" />
                      <span className="font-mono text-xs text-amber-400">
                        {getTransactionMethod(tx).name || 'Unknown Method'}
                      </span>
                    </div>
                    
                    {tx.input && tx.input !== '0x' && tx.input.length > 10 && (
                      <div className="mt-3 font-mono text-xs text-gray-400 overflow-hidden text-ellipsis"
                           style={{ maxWidth: '100%', whiteSpace: 'nowrap' }}>
                        {tx.input}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center p-3 bg-gradient-to-r from-transparent via-amber-900/5 to-transparent">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewFullDetails(tx);
                  }}
                  className="border-amber-500/30 text-amber-400 bg-black/10 hover:bg-amber-900/20 transition-all"
                >
                  View Full Details
                </Button>
              </div>
            </motion.div>
          </TableCell>
        </TableRow>
      )}
    </AnimatePresence>
  </>);
}
