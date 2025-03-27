"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, Sparkles, Database, Hash, Coins, Layers, Star, Activity, ShieldCheck, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SearchSuggestionsProps {
  query: string
  searchType: string
  onSelect: (suggestion: string) => void
  visible: boolean
  onSuggestionMouseEnter?: () => void
  onSuggestionMouseLeave?: () => void
}

interface Suggestion {
  value: string
  label?: string
  description?: string
  type: 'recent' | 'popular' | 'verified' | 'smart' | 'trending'
  category?: 'address' | 'transaction' | 'token' | 'block' | 'neo4j'
}

export default function SearchSuggestions({
  query,
  searchType,
  onSelect,
  visible,
  onSuggestionMouseEnter,
  onSuggestionMouseLeave
}: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1)
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cryptoPathRecentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse recent searches:", e)
        setRecentSearches([])
      }
    }
  }, [])

  // Save a new search to recent searches
  const saveToRecentSearches = (value: string) => {
    const updated = [value, ...recentSearches.filter(item => item !== value)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('cryptoPathRecentSearches', JSON.stringify(updated))
  }

  // Handle selecting a suggestion
  const handleSelect = (suggestion: Suggestion) => {
    saveToRecentSearches(suggestion.value)
    onSelect(suggestion.value)
  }

  // Smart suggestions based on search type
  const getSmartSuggestions = (): Suggestion[] => {
    switch (searchType) {
      case "onchain":
        return [
          { 
            value: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
            label: "Ethereum Foundation", 
            description: "Official Ethereum Foundation wallet",
            type: 'verified', 
            category: 'address' 
          },
          { 
            value: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 
            label: "Wrapped Ether (WETH)", 
            description: "Largest ETH wrapper contract",
            type: 'popular', 
            category: 'address' 
          },
          { 
            value: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", 
            label: "Uniswap V2 Router", 
            description: "Popular DEX router",
            type: 'popular', 
            category: 'address' 
          },
        ]
      case "Txn Hash":
        return [
          { 
            value: "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b", 
            label: "Large ETH Transfer", 
            description: "Notable $156M transfer",
            type: 'popular', 
            category: 'transaction' 
          },
          { 
            value: "0x4fc1580e7f66c58b7c26881cce0aab9c3509afe6e507527f30566fbf8039bcd0", 
            label: "Genesis Block First Tx", 
            description: "Historical transaction",
            type: 'verified', 
            category: 'transaction' 
          },
        ]
      case "Token":
        return [
          { 
            value: "0xdac17f958d2ee523a2206206994597c13d831ec7", 
            label: "USDT (Tether)", 
            description: "Popular stablecoin",
            type: 'popular', 
            category: 'token' 
          },
          { 
            value: "0x6b175474e89094c44da98b954eedeac495271d0f", 
            label: "DAI Stablecoin", 
            description: "Decentralized stablecoin",
            type: 'verified', 
            category: 'token' 
          },
          { 
            value: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 
            label: "UNI Token", 
            description: "Uniswap governance token",
            type: 'popular', 
            category: 'token' 
          },
        ]
      case "Block":
        return [
          { 
            value: "12965000", 
            label: "London Hard Fork", 
            description: "EIP-1559 implementation",
            type: 'verified', 
            category: 'block' 
          },
          { 
            value: "17000000", 
            label: "Recent Major Block", 
            description: "Post-Merge significant block",
            type: 'trending', 
            category: 'block' 
          },
        ]
      case "offchain":
        return [
          { 
            value: "0x388c818ca8b9251b393131c08a736a67ccb19297", 
            label: "Key Neo4j Node", 
            description: "High centrality node",
            type: 'smart', 
            category: 'neo4j' 
          },
        ]
      default:
        // All/universal search combines all suggestions
        return [
          { 
            value: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
            label: "Ethereum Foundation", 
            description: "Official Ethereum Foundation wallet",
            type: 'verified', 
            category: 'address' 
          },
          { 
            value: "0xdac17f958d2ee523a2206206994597c13d831ec7", 
            label: "USDT (Tether)", 
            description: "Popular stablecoin",
            type: 'popular', 
            category: 'token' 
          },
          { 
            value: "12965000", 
            label: "London Hard Fork", 
            description: "EIP-1559 implementation",
            type: 'smart', 
            category: 'block' 
          },
        ]
    }
  }

  // Update suggestions based on input
  useEffect(() => {
    if (!visible || !query.trim()) {
      setSuggestions([])
      return
    }

    const smartSuggestions = getSmartSuggestions()
    
    // Format recent searches as suggestions
    const recentSearchItems: Suggestion[] = recentSearches.map(value => ({
      value,
      type: 'recent',
      category: value.startsWith('0x') ? 
        (value.length === 66 ? 'transaction' : 'address') : 
        (/^\d+$/.test(value) ? 'block' : 'neo4j')
    }))

    // Combine and filter suggestions based on query
    const allSuggestions = [...recentSearchItems, ...smartSuggestions]
      .filter(suggestion => 
        suggestion.value.toLowerCase().includes(query.toLowerCase()) ||
        (suggestion.label && suggestion.label.toLowerCase().includes(query.toLowerCase())) ||
        (suggestion.description && suggestion.description.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 6)

    setSuggestions(allSuggestions)
    setActiveSuggestion(-1) // Reset active suggestion when suggestions change
  }, [query, searchType, recentSearches, visible])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible || suggestions.length === 0) return
      
      // Down arrow
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion(prev => (prev + 1) % suggestions.length)
      }
      // Up arrow
      else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length)
      }
      // Enter key
      else if (e.key === 'Enter' && activeSuggestion !== -1) {
        e.preventDefault()
        handleSelect(suggestions[activeSuggestion])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, suggestions, activeSuggestion])

  if (!visible || suggestions.length === 0) return null

  const getIcon = (suggestion: Suggestion) => {
    // For recent searches, show the clock icon
    if (suggestion.type === 'recent') {
      return <Clock className="h-4 w-4 text-gray-400" />
    }

    // Otherwise, show an icon based on the category
    switch (suggestion.category) {
      case 'address':
        return <Database className="h-4 w-4 text-amber-400" />
      case 'transaction':
        return <Hash className="h-4 w-4 text-green-400" />
      case 'token':
        return <Coins className="h-4 w-4 text-pink-400" />
      case 'block':
        return <Layers className="h-4 w-4 text-cyan-400" />
      case 'neo4j':
        return <Database className="h-4 w-4 text-blue-400" />
      default:
        return <Search className="h-4 w-4 text-purple-400" />
    }
  }

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'verified':
        return <ShieldCheck className="h-3 w-3 text-emerald-400" />
      case 'popular':
        return <Star className="h-3 w-3 text-amber-400" />
      case 'trending':
        return <Activity className="h-3 w-3 text-red-400" />
      case 'smart':
        return <Sparkles className="h-3 w-3 text-blue-400" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getTypeBadgeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'verified':
        return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20'
      case 'popular':
        return 'bg-amber-900/30 text-amber-400 border-amber-500/20'
      case 'trending':
        return 'bg-red-900/30 text-red-400 border-red-500/20'
      case 'smart':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/20'
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/20'
    }
  }

  // Truncate long addresses
  const formatAddress = (value: string): string => {
    if (value.startsWith('0x') && value.length > 16) {
      return `${value.slice(0, 8)}...${value.slice(-6)}`
    }
    return value
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl z-50 backdrop-blur-sm overflow-hidden"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onMouseEnter={onSuggestionMouseEnter}
        onMouseLeave={onSuggestionMouseLeave}
      >
        <div className="p-1">
          <div className="px-2 py-1.5 text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> 
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} for "{query}"
          </div>

          {suggestions.map((suggestion, index) => (
            <motion.div
              key={`${suggestion.value}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHoveredSuggestion(index)}
              onMouseLeave={() => setHoveredSuggestion(null)}
              className={`px-3 py-2 cursor-pointer rounded-lg transition-all duration-150 relative ${
                index === activeSuggestion || index === hoveredSuggestion 
                  ? 'bg-gray-800/80' 
                  : 'hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/80 border border-gray-700/50">
                  {getIcon(suggestion)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-200">
                      {suggestion.label || formatAddress(suggestion.value)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 text-[10px] py-0.5 px-2 ${getTypeBadgeColor(suggestion.type)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getTypeIcon(suggestion.type)}
                        <span>{suggestion.type}</span>
                      </span>
                    </Badge>
                  </div>
                  
                  {suggestion.label && (
                    <div className="text-xs font-mono text-gray-400 truncate mt-0.5">
                      {formatAddress(suggestion.value)}
                    </div>
                  )}
                  
                  {suggestion.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.description}
                    </div>
                  )}
                </div>
              </div>
              
              {(index === activeSuggestion || index === hoveredSuggestion) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300"
                  >
                    Select
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
          
          <div className="border-t border-gray-800 mt-1 pt-1">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 hover:text-gray-300 transition-colors cursor-help">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Tips</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Use arrow keys to navigate suggestions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div>
                <Button
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-300"
                  onClick={() => {
                    localStorage.removeItem('cryptoPathRecentSearches')
                    setRecentSearches([])
                  }}
                >
                  Clear History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}