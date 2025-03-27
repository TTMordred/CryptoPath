import React from "react";
import { Check, AlertTriangle, Clock, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status?: "success" | "failed" | "pending" | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === "success") {
    return (
      <Badge variant="outline" className={`bg-green-900/20 text-green-400 border-green-800 ${className}`}>
        <Check size={12} className="mr-1" /> Success
      </Badge>
    );
  } 
  
  if (status === "failed") {
    return (
      <Badge variant="outline" className={`bg-red-900/20 text-red-400 border-red-800 ${className}`}>
        <AlertTriangle size={12} className="mr-1" /> Failed
      </Badge>
    );
  } 
  
  if (status === "pending") {
    return (
      <Badge variant="outline" className={`bg-amber-900/20 text-amber-400 border-amber-800 ${className}`}>
        <Clock size={12} className="mr-1" /> Pending
      </Badge>
    );
  }
  
  return (
    <span className="text-gray-400 text-xs">Unknown</span>
  );
}
