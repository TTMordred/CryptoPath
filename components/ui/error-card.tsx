"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertOctagon, AlertTriangle, RefreshCw, Clock, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export type ErrorType = "timeout" | "network" | "api" | "notFound" | "unknown"

interface ErrorCardProps {
  title?: string
  message: string
  type?: ErrorType
  onRetry?: () => void
  className?: string
  suggestion?: string
  timeout?: number // Timeout in seconds, if applicable
}

export function ErrorCard({
  title,
  message,
  type = "unknown",
  onRetry,
  className,
  suggestion,
  timeout,
}: ErrorCardProps) {
  // Determine icon based on error type
  const Icon = {
    timeout: Clock,
    network: WifiOff,
    api: AlertOctagon,
    notFound: AlertTriangle,
    unknown: AlertTriangle,
  }[type]

  // Determine background gradient based on error type
  const gradientClass = {
    timeout: "from-amber-900/20 to-orange-900/20 border-amber-500/30",
    network: "from-red-900/20 to-rose-900/20 border-red-500/30",
    api: "from-indigo-900/20 to-blue-900/20 border-indigo-500/30",
    notFound: "from-gray-900/20 to-slate-900/20 border-gray-500/30",
    unknown: "from-violet-900/20 to-purple-900/20 border-violet-500/30",
  }[type]
  
  // Determine text color based on error type
  const textColorClass = {
    timeout: "text-amber-500",
    network: "text-red-500",
    api: "text-indigo-500",
    notFound: "text-gray-400",
    unknown: "text-violet-400",
  }[type]

  const defaultTitle = {
    timeout: "Request Timed Out",
    network: "Network Error",
    api: "API Error",
    notFound: "Not Found",
    unknown: "Something Went Wrong",
  }[type]

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={`bg-gradient-to-r ${gradientClass} border-b p-6`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: type === "timeout" ? [0, 360] : 0 }}
              transition={{ duration: 2, repeat: type === "timeout" ? Infinity : 0 }}
              className={`rounded-full p-2 bg-black/20 ${textColorClass}`}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            <h3 className="text-lg font-semibold">{title || defaultTitle}</h3>
          </div>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="flex items-center gap-2 hover:bg-black/20"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
      <CardContent className="pt-6 space-y-4">
        <p className="text-gray-300">{message}</p>
        
        {suggestion && (
          <div className="bg-black/20 p-4 rounded-md text-sm text-gray-300">
            <strong className="text-gray-200">Suggestion:</strong> {suggestion}
          </div>
        )}
        
        {timeout && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            Request timed out after {timeout} seconds
          </div>
        )}
      </CardContent>
    </Card>
  )
}
