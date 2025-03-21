"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { ExternalLink, X, Copy, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface HostnameError {
  hostname: string
  timestamp: number
}

interface DebugBadgeProps {
  className?: string
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'
}

export function DebugBadge({ 
  className, 
  position = 'bottom-right' 
}: DebugBadgeProps) {
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hostnameErrors, setHostnameErrors] = useState<HostnameError[]>([])
  const [copied, setCopied] = useState(false)
  
  // Only run in development and client-side
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  useEffect(() => {
    setIsClient(true)
    
    // Create a custom event listener for image hostname errors
    const handleHostnameError = (event: CustomEvent<{ hostname: string, timestamp: number }>) => {
      const { hostname, timestamp } = event.detail
      
      if (hostname) {
        setHostnameErrors(prev => {
          // Don't add duplicates
          if (prev.some(item => item.hostname === hostname)) {
            return prev
          }
          return [...prev, { hostname, timestamp: timestamp || Date.now() }]
        })
      }
    }
    
    // Add event listener
    window.addEventListener(
      'nextImageHostnameError', 
      handleHostnameError as EventListener
    )
    
    return () => {
      window.removeEventListener(
        'nextImageHostnameError', 
        handleHostnameError as EventListener
      )
    }
  }, [])
  
  const copyConfigToClipboard = () => {
    const configText = hostnameErrors.map(({ hostname }) => (
      `{\n  protocol: "https",\n  hostname: "${hostname}",\n  pathname: "/**",\n},`
    )).join('\n')
    
    navigator.clipboard.writeText(configText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  
  // Only show in development and when there are errors
  if (!isClient || !isDevelopment || !isOpen || hostnameErrors.length === 0) {
    return null
  }
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
  }
  
  return (
    <div 
      className={cn(
        "fixed z-50 bg-amber-950 text-amber-100 p-3 rounded-lg shadow-lg max-w-md border border-amber-800",
        positionClasses[position],
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span>
            {hostnameErrors.length} {hostnameErrors.length === 1 ? 'image host' : 'image hosts'} not configured
          </span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-amber-400 hover:text-amber-300 p-1"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? "+" : "-"}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-amber-400 hover:text-amber-300 p-1"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleContent>
          <div className="text-xs space-y-2 mb-3">
            <p>
              Add these hostnames to your <code className="bg-amber-900/60 px-1 rounded">next.config.js</code> file:
            </p>
            
            <div className="bg-amber-900/60 p-2 rounded overflow-auto max-h-40">
              {hostnameErrors.map(({hostname}, index) => (
                <div key={hostname} className="font-mono text-xs">
                  {`{`}
                  <div className="pl-2">
                    protocol: "https",<br/>
                    hostname: "{hostname}",<br/>
                    pathname: "/**",
                  </div>
                  {`},`}
                  {index < hostnameErrors.length - 1 && <div className="h-2"></div>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <a 
                href="https://nextjs.org/docs/messages/next-image-unconfigured-host" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Documentation</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-600 text-amber-300 hover:text-amber-200 hover:bg-amber-900/50"
                onClick={copyConfigToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    <span>Copy config</span>
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-amber-400/80 italic">
              Dev mode: Images still display without optimization. Fix before production.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
