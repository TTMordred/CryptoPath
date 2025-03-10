// lib/format.ts
export const formatCurrency = (value: number): string => {
    if (typeof value !== "number" || isNaN(value)) return "$0.00";
  
    if (value < 0.01 && value > 0) {
      return `$${value.toExponential(2)}`;
    }
  
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };
  
  export const formatNumber = (value: number): string => {
    if (typeof value !== "number" || isNaN(value)) return "0";
  
    if (value < 1) {
      return value.toFixed(6);
    }
  
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    } else {
      return value.toFixed(2);
    }
  };
  
  export const formatPercentage = (value: number): string => {
    if (typeof value !== "number" || isNaN(value)) return "0%";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };
  
  export const getColorForPercentChange = (value: number): string => {
    if (typeof value !== "number" || isNaN(value)) return "text-gray-500";
    return value >= 0 ? "text-green-500" : "text-red-500";
  };
  
  export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  
  export const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  export const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };