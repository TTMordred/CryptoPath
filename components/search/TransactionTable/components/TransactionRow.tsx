import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { Transaction } from "../types";
import { shortenAddress } from "../utils";

interface TransactionRowProps {
  transaction: Transaction;
  expandedTx: string | null;
  isMobile: boolean;
  onRowClick: (txId: string) => void;
  onCopy: (text: string, label: string) => void;
  onExternalLink: (txHash: string) => void;
  getTransactionMethod: (tx: Transaction) => { id: string, name: string };
  onViewFullDetails: (tx: Transaction) => void;
}

export default function TransactionRow({
  transaction: tx,
  expandedTx,
  isMobile,
  onRowClick,
  onCopy,
  onExternalLink,
  getTransactionMethod,
  onViewFullDetails
}: TransactionRowProps) {
  const isExpanded = expandedTx === tx.id;

  // Return the rows without any whitespace or line breaks between elements
  return (<>{/* Wrap in fragment to prevent whitespace */}
    <TableRow className={`cursor-pointer ${isExpanded ? 'bg-amber-950/20' : ''}`} onClick={() => onRowClick(tx.id)}>
      <TableCell className="font-mono"><div className="flex items-center gap-1"><span className="text-[#F5B056] text-sm">{shortenAddress(tx.id)}</span><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onCopy(tx.id, 'Hash'); }} className="h-6 w-6"><Copy size={12} /></Button></div></TableCell>
      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'swap' ? 'bg-purple-900/50 text-purple-300' : tx.type === 'inflow' ? 'bg-green-900/50 text-green-300' : tx.type === 'outflow' ? 'bg-red-900/50 text-red-300' : 'bg-gray-800 text-gray-300'}`}>{tx.type}</span></TableCell>
      <TableCell><StatusBadge status={tx.status} /></TableCell>
      <TableCell className="font-mono text-[#F5B056] text-sm">{shortenAddress(tx.from)}</TableCell>
      <TableCell className="font-mono text-[#F5B056] text-sm">{tx.to ? shortenAddress(tx.to) : "Contract Creation"}</TableCell>
      <TableCell>{tx.value}</TableCell>
      <TableCell className={isMobile ? "hidden" : ""}>{new Date(tx.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
      <TableCell className="text-right"><div className="flex justify-end space-x-1"><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onCopy(tx.from, 'Address'); }} className="h-6 w-6"><Copy size={12} className="text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onExternalLink(tx.id); }} className="h-6 w-6"><ExternalLink size={12} className="text-gray-400" /></Button></div></TableCell>
      <TableCell><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRowClick(tx.id); }}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Button></TableCell>
    </TableRow>
    {isExpanded && (
    <TableRow className="bg-amber-950/10">
      <TableCell colSpan={9} className="py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-amber-400">Transaction Details</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="text-gray-400">Gas:</span> {tx.gas}</p>
              <p><span className="text-gray-400">Gas Price:</span> {tx.gasPrice} Gwei</p>
              <p><span className="text-gray-400">Gas Used:</span> {tx.gasUsed}</p>
              <p><span className="text-gray-400">Block:</span> {tx.blockNumber}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-amber-400">Method</h4>
            <p className="mt-2 font-mono text-xs bg-gray-800 p-2 rounded overflow-x-auto">
              {getTransactionMethod(tx).name} ({getTransactionMethod(tx).id})
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onViewFullDetails(tx);
          }}
          className="mt-4 border-amber-500/30 text-amber-400"
        >
          View Full Details
        </Button>
      </TableCell>
    </TableRow>
    )}</>
  );
}
