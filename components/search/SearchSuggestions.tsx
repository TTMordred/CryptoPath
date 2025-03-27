"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, Building2, Wallet, Coins, Image, Building, ArrowLeftRight, Globe, Database } from "lucide-react"
import { useEffect, useState } from "react"

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
  label: string
  category: 'dapp' | 'cex' | 'dex' | 'token' | 'nft' | 'dao' | 'bridge' | 'recent'
  description?: string
}

// Comprehensive suggestions database
const BLOCKCHAIN_SUGGESTIONS: Record<string, Suggestion[]> = {
  // Popular DApps
  dapp: [
    { value: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", label: "Uniswap Router", category: 'dapp', description: "Decentralized Exchange Protocol" },
    { value: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", label: "Compound", category: 'dapp', description: "Lending Protocol" },
    { value: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", label: "Uniswap Factory", category: 'dapp', description: "DEX Factory" },
    { value: "0x0000000000A39bb272e79075ade125fd351887Ac", label: "Blur.io", category: 'dapp', description: "NFT Marketplace" },
  ],
  // Centralized Exchanges
  cex: [
    { value: "0x28C6c06298d514Db089934071355E5743bf21d60", label: "Binance Hot Wallet", category: 'cex', description: "Binance Exchange" },
    { value: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d", label: "Coinbase", category: 'cex', description: "Coinbase Exchange" },
    { value: "0x75e89d5979E4f6Fba9F97c104c2F0AFB3F1dcB88", label: "Kraken", category: 'cex', description: "Kraken Exchange" },
    { value: "0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF", label: "Crypto.com", category: 'cex', description: "Crypto.com Exchange" },
  ],
  // Decentralized Exchanges
  dex: [
    { value: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", label: "Uniswap V3", category: 'dex', description: "Leading DEX Protocol" },
    { value: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", label: "SushiSwap", category: 'dex', description: "Multi-chain DEX" },
    { value: "0xDef1C0ded9bec7F1a1670819833240f027b25EfF", label: "0x Protocol", category: 'dex', description: "DEX Aggregator" },
    { value: "0x1111111254EEB25477B68fb85Ed929f73A960582", label: "1inch", category: 'dex', description: "DEX Aggregator" },
  ],
  // Popular Tokens
  token: [
    { value: "0xdAC17F958D2ee523a2206206994597C13D831ec7", label: "USDT", category: 'token', description: "Tether USD" },
    { value: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", label: "USDC", category: 'token', description: "USD Coin" },
    { value: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", label: "WBTC", category: 'token', description: "Wrapped Bitcoin" },
    { value: "0x514910771AF9Ca656af840dff83E8264EcF986CA", label: "LINK", category: 'token', description: "Chainlink" },
  ],
  // Notable NFT Collections
  nft: [
    { value: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", label: "BAYC", category: 'nft', description: "Bored Ape Yacht Club" },
    { value: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6", label: "MAYC", category: 'nft', description: "Mutant Ape Yacht Club" },
    { value: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB", label: "CryptoPunks", category: 'nft', description: "CryptoPunks Collection" },
    { value: "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258", label: "Otherdeed", category: 'nft', description: "Otherside Land" },
  ],
  // DAOs
  dao: [
    { value: "0x408e41876cCCDC0F92210600ef50372656052a38", label: "REN DAO", category: 'dao', description: "Cross-chain Liquidity" },
    { value: "0x0BEF27FEB58e857046d630B2c03dFb7bae567494", label: "Nexus Mutual", category: 'dao', description: "DeFi Insurance" },
    { value: "0x470ebf5f030ed85fc1ed4c2d36b9dd02e77cf1b7", label: "TheGraph", category: 'dao', description: "Indexing Protocol" },
    { value: "0x744d16d200175cd20c971fe0c1881168372c21d0", label: "Aave", category: 'dao', description: "Lending Protocol" },
  ],
  // Cross-chain Bridges
  bridge: [
    { value: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1", label: "Optimism Bridge", category: 'bridge', description: "ETH-Optimism Bridge" },
    { value: "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a", label: "Arbitrum Bridge", category: 'bridge', description: "ETH-Arbitrum Bridge" },
    { value: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf", label: "Polygon Bridge", category: 'bridge', description: "ETH-Polygon Bridge" },
    { value: "0xa3A7B6F88361F48403514059F1F16C8E78d60EeC", label: "Arbitrum One", category: 'bridge', description: "Layer 2 Bridge" },
  ],
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'dapp':
      return <Building className="h-4 w-4 text-purple-400" />
    case 'cex':
      return <Building2 className="h-4 w-4 text-green-400" />
    case 'dex':
      return <ArrowLeftRight className="h-4 w-4 text-blue-400" />
    case 'token':
      return <Coins className="h-4 w-4 text-amber-400" />
    case 'nft':
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image className="h-4 w-4 text-pink-400" />
    case 'dao':
      return <Globe className="h-4 w-4 text-indigo-400" />
    case 'bridge':
      return <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
    case 'recent':
      return <Clock className="h-4 w-4 text-gray-400" />
    default:
      return <Search className="h-4 w-4 text-gray-400" />
  }
}

export default function SearchSuggestions({
  query,
  searchType,
  onSelect,
  visible
}: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Update suggestions based on input and search type
  useEffect(() => {
    if (!visible) {
      setSuggestions([])
      return
    }

    let filteredSuggestions: Suggestion[] = []
    const searchLower = query.toLowerCase()

    // Add recent searches first
    const recentItems: Suggestion[] = recentSearches.map(value => ({
      value,
      label: 'Recent Search',
      category: 'recent'
    }))

    // Combine all categories
    const allSuggestions = [
      ...recentItems,
      ...Object.values(BLOCKCHAIN_SUGGESTIONS).flat()
    ]

    if (!query) {
      // Show popular items when no query
      filteredSuggestions = allSuggestions
        .filter(s => s.category !== 'recent')
        .slice(0, 8)
    } else {
      // Filter based on query
      filteredSuggestions = allSuggestions.filter(suggestion =>
        suggestion.value.toLowerCase().includes(searchLower) ||
        suggestion.label.toLowerCase().includes(searchLower) ||
        (suggestion.description && suggestion.description.toLowerCase().includes(searchLower))
      )
    }

    // Prioritize exact matches and starts with
    filteredSuggestions.sort((a, b) => {
      if (a.value.toLowerCase() === searchLower) return -1
      if (b.value.toLowerCase() === searchLower) return 1
      if (a.value.toLowerCase().startsWith(searchLower)) return -1
      if (b.value.toLowerCase().startsWith(searchLower)) return 1
      return 0
    })

    // Limit results
    setSuggestions(filteredSuggestions.slice(0, 8))
  }, [query, searchType, recentSearches, visible])

  if (!visible || suggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 border border-gray-700 rounded-xl shadow-xl z-50 backdrop-blur-sm"
      >
        <div className="p-2 space-y-1">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(suggestion.value)}
              className={`px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 group hover:bg-gray-800 ${
                suggestion.category === 'recent' ? 'border-l-2 border-gray-600' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getCategoryIcon(suggestion.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-200 truncate group-hover:text-white transition-colors duration-200">
                      {suggestion.label}
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 group-hover:bg-gray-700 transition-colors duration-200">
                      {suggestion.category.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate group-hover:text-gray-400 transition-colors duration-200">
                    {suggestion.value}
                  </div>
                  
                  {suggestion.description && (
                    <div className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-200 mt-1">
                      {suggestion.description}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}