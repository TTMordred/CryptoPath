"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2, Copy, Check, ExternalLink, AlertTriangle, EyeOff, Grid, List, 
  ArrowUpDown, Sparkles, Image as ImageIcon, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RotateCw, DownloadIcon, Share2, Heart, X, Info
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { handleImageError, getDevImageProps } from "@/utils/imageUtils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NFT {
  tokenID: string
  tokenName: string
  tokenSymbol: string
  contractAddress: string
  imageUrl?: string
  metadata?: {
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  }
}

interface NFTResponse {
  nfts: NFT[]
  totalCount: number
  pageKey?: string | null
  error?: string
}

// Utility to truncate long strings
const truncateString = (str: string, startChars = 6, endChars = 4) => {
  if (!str) return "";
  if (str.length <= startChars + endChars) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
};

// Enhanced utility to handle and format token IDs correctly
const formatTokenId = (tokenId: string) => {
  if (!tokenId) return "Unknown ID";
  
  // Remove leading zeros for display if the ID is in hex format
  if (tokenId.startsWith('0x')) {
    // Convert to BigInt to handle large numbers correctly
    try {
      const bigIntValue = BigInt(tokenId);
      // If the value is actually zero, return 0x0
      if (bigIntValue === BigInt(0)) return "0x0";
      // Otherwise return the hex representation without extra leading zeros
      return '0x' + bigIntValue.toString(16);
    } catch (e) {
      // If conversion fails, return the original
      return tokenId;
    }
  }
  
  return tokenId;
};

// Detect potential spam NFTs
const isPotentialSpam = (nft: NFT): boolean => {
  // Common patterns in spam NFT names
  const spamPatterns = [
    /visit.*website/i,
    /claim.*rewards/i,
    /.+\.org/i,
    /.+\.net/i,
    /airdrop/i,
    /^get.+/i,
    /free/i
  ];
  
  // Check name against spam patterns
  if (nft.tokenName && spamPatterns.some(pattern => pattern.test(nft.tokenName))) {
    return true;
  }
  
  // Check if token ID is suspiciously simple like "0x00"
  if (nft.tokenID === "0x00" || nft.tokenID === "0x0" || nft.tokenID === "0") {
    return true;
  }
  
  return false;
};

// Generate dynamic gradient background for NFT cards
const generateGradient = (nft: NFT): string => {
  // Create a deterministic but visually pleasing gradient based on contract address
  const hash = nft.contractAddress.slice(-6);
  const hue1 = parseInt(hash.slice(0, 2), 16) % 360; // 0-359
  const hue2 = (hue1 + 40) % 360; // Complementary-ish
  
  return `linear-gradient(135deg, hsla(${hue1}, 80%, 60%, 0.8), hsla(${hue2}, 70%, 45%, 0.8))`;
};

export default function NFTGallery() {
  const searchParams = useSearchParams()
  const address = searchParams?.get("address") ?? null
  const [nfts, setNFTs] = useState<NFT[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [pageKeys, setPageKeys] = useState<(string | null)[]>([null])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const nftsPerPage = 15
  const galleryRef = useRef<HTMLDivElement>(null)

  // UI State
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [hideSpamNFTs, setHideSpamNFTs] = useState<boolean>(true)
  const [filteredNFTs, setFilteredNFTs] = useState<NFT[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'id'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageScale, setImageScale] = useState(1)
  const [imageRotation, setImageRotation] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [hoveredNFT, setHoveredNFT] = useState<string | null>(null)
  const [showZoomEffect, setShowZoomEffect] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")

  // Enhanced UI effects
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handleScroll = () => {
      if (galleryRef.current) {
        setScrollY(window.scrollY)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sort NFTs
  const sortNFTs = (nfts: NFT[]) => {
    return [...nfts].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.tokenName || 'Unnamed NFT';
        const nameB = b.tokenName || 'Unnamed NFT';
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        const idA = BigInt(a.tokenID);
        const idB = BigInt(b.tokenID);
        return sortOrder === 'asc'
          ? idA > idB ? 1 : -1
          : idB > idA ? 1 : -1;
      }
    });
  };

  // Copy to clipboard function with visual feedback
  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(identifier);
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    });
  };

  const fetchNFTs = async (page: number, pageKey?: string | null) => {
    if (!address) return;

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/nfts?address=${address}&limit=${nftsPerPage}${pageKey ? `&pageKey=${pageKey}` : ''}`)
      const data: NFTResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setNFTs(data.nfts)
      setTotalCount(data.totalCount)

      setPageKeys(prev => {
        const newPageKeys = [...prev]
        newPageKeys[page] = data.pageKey || null
        return newPageKeys
      })
    } catch (err) {
      console.error("Error fetching NFTs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch NFTs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    setPageKeys([null])
    fetchNFTs(1, null)
  }, [address])

  useEffect(() => {
    if (hideSpamNFTs) {
      setFilteredNFTs(nfts.filter(nft => !isPotentialSpam(nft)));
    } else {
      setFilteredNFTs(nfts);
    }
  }, [nfts, hideSpamNFTs]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('nftFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (nftId: string) => {
    const newFavorites = favorites.includes(nftId)
      ? favorites.filter(id => id !== nftId)
      : [...favorites, nftId];
    
    setFavorites(newFavorites);
    localStorage.setItem('nftFavorites', JSON.stringify(newFavorites));
    
    toast.success(favorites.includes(nftId) ? "Removed from favorites" : "Added to favorites", {
      icon: favorites.includes(nftId) ? "🗑️" : "❤️",
    });
  };

  const isNftFavorite = (nftId: string) => favorites.includes(nftId);

  // Download NFT image
  const downloadNFTImage = async (imageUrl: string, name: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name || 'nft-image'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  // Share NFT
  const shareNFT = async (nft: NFT) => {
    if (!navigator.share) {
      toast.error("Web Share API not supported in your browser");
      return;
    }

    try {
      await navigator.share({
        title: nft.tokenName || 'NFT',
        text: `Check out this NFT: ${nft.tokenName || `#${nft.tokenID}`}`,
        url: `https://etherscan.io/token/${nft.contractAddress}?a=${nft.tokenID}`,
      });
      toast.success("Shared successfully!");
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error("Failed to share");
      }
    }
  };

  // Filter NFTs by tab
  const getFilteredNFTsByTab = () => {
    if (activeTab === "all") return filteredNFTs;
    if (activeTab === "favorites") {
      return filteredNFTs.filter(nft => 
        isNftFavorite(`${nft.contractAddress}-${nft.tokenID}`));
    }
    return filteredNFTs;
  };

  // Loading skeleton component with animation
  const LoadingSkeleton = () => (
    <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
          <div className="h-8 w-40 bg-gray-800 animate-pulse rounded"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-8 w-24 bg-gray-800 animate-pulse rounded"></div>
          <div className="h-8 w-24 bg-gray-800 animate-pulse rounded"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  delay: i * 0.05
                }
              }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5 rounded-xl"></div>
              <div className="absolute inset-0 animate-pulse bg-gray-800/80 rounded-xl"></div>
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/70 backdrop-blur-sm rounded-b-xl p-2">
                <div className="h-3 w-3/4 bg-gray-700 animate-pulse rounded mb-2"></div>
                <div className="h-2 w-1/2 bg-gray-700 animate-pulse rounded"></div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Animated loading effect at the bottom */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <span className="text-amber-400 animate-pulse">Loading NFT collection...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!address) return null;
  
  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <Card className="mt-8 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-red-500/20">
        <CardContent className="p-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          </motion.div>
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl font-bold text-red-400 mb-2"
          >
            Error Loading NFTs
          </motion.h3>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-gray-400 max-w-md"
          >
            {error}
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button 
              className="mt-6 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => fetchNFTs(1, null)}
            >
              <RotateCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card className="mt-8 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
            NFT Gallery
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ImageIcon className="h-16 w-16 text-amber-500/30 mb-4" />
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-gray-400"
          >
            No NFTs found for this address.
          </motion.p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(totalCount / nftsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchNFTs(newPage, pageKeys[newPage - 1]);
      
      // Scroll to top of gallery on page change
      if (galleryRef.current) {
        galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && pageKeys[currentPage]) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchNFTs(newPage, pageKeys[currentPage]);
      
      // Scroll to top of gallery on page change
      if (galleryRef.current) {
        galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const markImageAsError = (nftId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [nftId]: true
    }));
  };

  const displayedNFTs = getFilteredNFTsByTab();

  return (
    <>
      <Card
        ref={galleryRef}
        className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm overflow-hidden relative"
      >
        {/* Animated background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-amber-500/5 z-0"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradient-animation 15s ease infinite',
          }}
        />
        
        <CardHeader className="relative z-10 border-b border-amber-500/10 bg-black/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                NFT Gallery
              </CardTitle>
              <Badge className="ml-3 bg-amber-500/20 text-amber-300 border-amber-500/30">
                {totalCount} NFTs
              </Badge>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap gap-2 items-center"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-8 w-8"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Grid View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-8 w-8"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>List View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Sort Controls */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as ['name' | 'id', 'asc' | 'desc'];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="bg-gray-800/70 border border-amber-500/30 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="id-asc">Token ID (Low-High)</option>
                <option value="id-desc">Token ID (High-Low)</option>
              </select>
              
              {/* Spam Filter */}
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                <Label htmlFor="hide-spam" className="text-sm text-amber-300">Hide Spam</Label>
                <Switch
                  id="hide-spam"
                  checked={hideSpamNFTs}
                  onCheckedChange={setHideSpamNFTs}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 p-6">
          {/* Tabs for filtering */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6"
          >
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-800/50 border border-amber-500/10">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  All NFTs
                </TabsTrigger>
                <TabsTrigger 
                  value="favorites"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  Favorites {favorites.length > 0 && `(${favorites.filter(id => filteredNFTs.some(nft => `${nft.contractAddress}-${nft.tokenID}` === id)).length})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
          
          {/* Warnings */}
          <AnimatePresence>
            {hideSpamNFTs && nfts.length > filteredNFTs.length && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <p className="text-sm text-amber-100">
                    {nfts.length - filteredNFTs.length} potential spam NFTs are hidden. 
                    <Button variant="link" className="px-1 h-auto text-amber-400" onClick={() => setHideSpamNFTs(false)}>
                      Show all
                    </Button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Empty state for filtered results */}
          <AnimatePresence>
            {displayedNFTs.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12 text-center"
                transition={{ duration: 0.4 }}
              >
                {activeTab === "favorites" ? (
                  <>
                    <Heart className="h-12 w-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No favorites yet</h3>
                    <p className="text-gray-400">Click the heart icon on NFTs to add them to your favorites</p>
                  </>
                ) : hideSpamNFTs && nfts.length > 0 ? (
                  <>
                    <EyeOff className="h-12 w-12 text-amber-500/50 mb-4" />
                    <h3 className="text-lg font-medium text-amber-400 mb-2">All NFTs were filtered as potential spam</h3>
                    <Button 
                      variant="outline"
                      className="mt-4 border-amber-500 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setHideSpamNFTs(false)}
                    >
                      Show All NFTs
                    </Button>
                  </>
                ) : (
                  <>
                    <Info className="h-12 w-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No NFTs found</h3>
                    <p className="text-gray-400">Try changing your filters</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* NFT Grid View */}
          {displayedNFTs.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortNFTs(displayedNFTs).map((nft, index) => {
                const nftId = `${nft.contractAddress}-${nft.tokenID}`;
                const formattedTokenId = formatTokenId(nft.tokenID);
                const truncatedTokenId = truncateString(formattedTokenId, 6, 4);
                const isSpam = isPotentialSpam(nft);
                const isFavorite = isNftFavorite(nftId);

                return (
                  <motion.div
                    key={nftId}
                    layoutId={`nft-card-${nftId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ 
                      y: -8,
                      transition: { 
                        duration: 0.3,
                      }
                    }}
                    onMouseEnter={() => setHoveredNFT(nftId)}
                    onMouseLeave={() => setHoveredNFT(null)}
                    className="relative"
                  >
                    <div 
                      className={cn(
                        "group relative bg-gray-900/40 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg transition-all duration-300 h-full",
                        isSpam && !hideSpamNFTs && "border-2 border-red-500/40",
                        hoveredNFT === nftId ? "shadow-2xl shadow-amber-500/20" : "shadow-amber-500/5",
                        isFavorite && "ring-2 ring-amber-400/50"
                      )}
                      style={{ 
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* Gradient background */}
                      <div 
                        className="absolute inset-0 opacity-20 z-0" 
                        style={{ backgroundImage: generateGradient(nft) }}
                      />
                      
                      {/* NFT Image */}
                      <div 
                        className="relative aspect-square w-full overflow-hidden cursor-pointer"
                        onClick={() => {
                          setSelectedNft(nft);
                          setIsModalOpen(true);
                        }}
                      >
                        {imageErrors[nftId] || !nft.imageUrl ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-400 z-10">
                            <ImageIcon className="h-12 w-12 opacity-30 mb-2" />
                            <div className="text-center px-3">
                              <p className="font-medium text-amber-400 text-sm line-clamp-2">{nft.tokenName || "NFT"}</p>
                              <p className="text-xs mt-1 text-gray-400">#{truncatedTokenId}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium text-white text-sm truncate">{nft.tokenName || "Unnamed NFT"}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(nftId);
                                    }}
                                  >
                                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-white'}`} />
                                  </Button>
                                </div>
                                <div className="mt-1 flex justify-between">
                                  <Badge className="bg-black/40 text-gray-300 backdrop-blur-md text-xs">
                                    #{truncatedTokenId}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (nft.imageUrl) {
                                    setLightboxImage(nft.imageUrl);
                                    setImageScale(1);
                                    setImageRotation(0);
                                    setIsLightboxOpen(true);
                                  }
                                }}
                              >
                                <ZoomIn className="h-4 w-4 text-white" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (nft.imageUrl) {
                                    downloadNFTImage(nft.imageUrl, nft.tokenName || `nft-${nft.tokenID}`);
                                  }
                                }}
                              >
                                <DownloadIcon className="h-4 w-4 text-white" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shareNFT(nft);
                                }}
                              >
                                <Share2 className="h-4 w-4 text-white" />
                              </Button>
                            </div>

                            <Image
                              src={nft.imageUrl}
                              alt={nft.tokenName || `NFT #${formattedTokenId}`}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={() => markImageAsError(nftId)}
                              {...getDevImageProps()}
                            />
                            
                            {/* Shine effect overlay */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                              style={{
                                transform: 'translateX(-100%)',
                                animation: hoveredNFT === nftId ? 'shine 1.5s ease-in-out' : 'none',
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* NFT List View */}
          {displayedNFTs.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col space-y-3">
              {sortNFTs(displayedNFTs).map((nft, index) => {
                const nftId = `${nft.contractAddress}-${nft.tokenID}`;
                const formattedTokenId = formatTokenId(nft.tokenID);
                const isSpam = isPotentialSpam(nft);
                const isFavorite = isNftFavorite(nftId);

                return (
                  <motion.div
                    key={nftId}
                    layoutId={`nft-list-${nftId}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    whileHover={{ x: 5 }}
                  >
                    <div
                      className={cn(
                        "group bg-gray-900/60 border border-amber-500/10 rounded-lg overflow-hidden flex items-center transition-colors duration-300 hover:bg-gray-800/80 cursor-pointer",
                        isSpam && !hideSpamNFTs && "border-red-500/30",
                        isFavorite && "ring-1 ring-amber-400/30"
                      )}
                      onClick={() => {
                        setSelectedNft(nft);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 bg-gray-800 overflow-hidden">
                        {imageErrors[nftId] || !nft.imageUrl ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        ) : (
                          <Image
                            src={nft.imageUrl}
                            alt={nft.tokenName || `NFT #${formattedTokenId}`}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={() => markImageAsError(nftId)}
                            {...getDevImageProps()}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex-1 min-w-0 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                              {nft.tokenName || "Unnamed NFT"}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              #{formattedTokenId}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {isSpam && !hideSpamNFTs && (
                              <Badge className="bg-red-900/50 border border-red-500/30 text-red-300 text-xs">
                                Potential Spam
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(nftId);
                              }}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-center h-full pr-4 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://etherscan.io/token/${nft.contractAddress}?a=${nft.tokenID}`, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4 text-amber-400" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <motion.div 
              className="flex justify-between items-center mt-8" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex gap-1 items-center"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-md border border-amber-500/20">
                <span className="text-amber-300">Page</span>
                <span className="font-bold text-white mx-1">{currentPage}</span>
                <span className="text-gray-400">of</span>
                <span className="font-bold text-white mx-1">{totalPages}</span>
              </div>
              
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || !pageKeys[currentPage]}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex gap-1 items-center"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* NFT Image Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-5xl bg-black/95 border-0 p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
                      onClick={() => setImageScale(prev => prev + 0.2)}
                    >
                      <ZoomIn className="h-4 w-4 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom In</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
                      onClick={() => setImageScale(prev => Math.max(0.5, prev - 0.2))}
                    >
                      <ZoomOut className="h-4 w-4 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
                      onClick={() => setImageRotation(prev => prev + 90)}
                    >
                      <RotateCw className="h-4 w-4 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rotate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
                      onClick={() => {
                        if (lightboxImage) {
                          downloadNFTImage(lightboxImage, "nft-image");
                        }
                      }}
                    >
                      <DownloadIcon className="h-4 w-4 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
                      onClick={() => setIsLightboxOpen(false)}
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center justify-center h-[80vh] w-full overflow-hidden">
              {lightboxImage && (
                <div 
                  className="relative w-full h-full flex items-center justify-center cursor-move"
                  style={{
                    transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.3s ease-out'
                  }}
                >
                  <Image
                    src={lightboxImage}
                    alt="NFT Image"
                    width={800}
                    height={800}
                    className="max-h-full max-w-full object-contain"
                    {...getDevImageProps()}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* NFT Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-gradient-to-b from-gray-900/95 to-black/95 border border-amber-500/20 text-white p-0 overflow-hidden">
          {selectedNft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full relative"
            >
              {/* Animated top border */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/10 via-amber-500 to-amber-500/10"></div>
              
              {/* Modal header */}
              <DialogHeader className="p-6 pb-2 border-b border-amber-500/10 relative z-10">
                <motion.div 
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <DialogTitle className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                      {selectedNft.tokenName || "Unnamed NFT"}
                      {isPotentialSpam(selectedNft) && (
                        <Badge className="bg-red-600/20 border border-red-500/30 text-red-400 text-xs">
                          Potential Spam
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {selectedNft.tokenSymbol && (
                        <Badge variant="outline" className="mr-2 bg-amber-500/10 border-amber-500/30 text-amber-300">
                          {selectedNft.tokenSymbol}
                        </Badge>
                      )}
                      <span className="text-sm">#{formatTokenId(selectedNft.tokenID)}</span>
                    </DialogDescription>
                  </div>
                  
                  <Button 
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-full hover:bg-gray-800/50"
                    onClick={() => toggleFavorite(`${selectedNft.contractAddress}-${selectedNft.tokenID}`)}
                  >
                    <Heart className={`h-5 w-5 ${isNftFavorite(`${selectedNft.contractAddress}-${selectedNft.tokenID}`) ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                  </Button>
                </motion.div>
              </DialogHeader>
              
              {/* Spam warning */}
              <AnimatePresence>
                {isPotentialSpam(selectedNft) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="bg-red-950/30 border-y border-red-500/20 px-6 py-3 mb-2">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                        <p className="text-sm text-red-200">
                          This NFT contains patterns commonly associated with spam or phishing attempts. 
                          Be cautious with any links or claims for rewards.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <ScrollArea className="max-h-[75vh]">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NFT Image */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-amber-500/10"
                    >
                      {selectedNft.imageUrl && !imageErrors[`${selectedNft.contractAddress}-${selectedNft.tokenID}`] ? (
                        <div className="group relative w-full h-full">
                          <Image
                            src={selectedNft.imageUrl}
                            alt={selectedNft.tokenName || `NFT #${formatTokenId(selectedNft.tokenID)}`}
                            fill
                            className="object-contain transition-transform duration-700 group-hover:scale-105"
                            onError={() => markImageAsError(`${selectedNft.contractAddress}-${selectedNft.tokenID}`)}
                            {...getDevImageProps()}
                          />
                          
                          {/* Fullscreen button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              if (selectedNft.imageUrl) {
                                setLightboxImage(selectedNft.imageUrl);
                                setImageScale(1);
                                setImageRotation(0);
                                setIsLightboxOpen(true);
                              }
                            }}
                          >
                            <ZoomIn className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-gray-700 mb-2" />
                          <div className="text-center">
                            <p className="font-medium text-amber-400 text-lg">{selectedNft.tokenName || "NFT"}</p>
                            <p className="text-sm mt-2 text-gray-400">#{formatTokenId(selectedNft.tokenID)}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* NFT Details */}
                    <div className="space-y-4">
                      {/* Token ID */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <p className="text-sm font-medium text-amber-400 mb-1">Token ID</p>
                        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                          <p className="text-sm font-mono text-gray-300 truncate pr-2" title={selectedNft.tokenID}>
                            {formatTokenId(selectedNft.tokenID)}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 rounded-full hover:bg-gray-700/50" 
                            onClick={() => copyToClipboard(selectedNft.tokenID, `modal-tokenId`)}
                          >
                            {copiedText === `modal-tokenId` ? 
                              <Check className="h-4 w-4 text-green-500" /> : 
                              <Copy className="h-4 w-4 text-amber-400" />
                            }
                          </Button>
                        </div>
                      </motion.div>
                      
                      {/* Contract Address */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <p className="text-sm font-medium text-amber-400 mb-1">Contract Address</p>
                        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                          <p className="text-sm font-mono text-gray-300 truncate pr-2" title={selectedNft.contractAddress}>
                            {selectedNft.contractAddress}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 rounded-full hover:bg-gray-700/50" 
                            onClick={() => copyToClipboard(selectedNft.contractAddress, `modal-contract`)}
                          >
                            {copiedText === `modal-contract` ? 
                              <Check className="h-4 w-4 text-green-500" /> : 
                              <Copy className="h-4 w-4 text-amber-400" />
                            }
                          </Button>
                        </div>
                      </motion.div>
                      
                      {/* Metadata */}
                      {selectedNft.metadata?.attributes && selectedNft.metadata.attributes.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          className="mt-4"
                        >
                          <p className="text-sm font-medium text-amber-400 mb-2">Attributes</p>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedNft.metadata.attributes.map((attr, index) => (
                              <div 
                                key={`${attr.trait_type}-${index}`} 
                                className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50 backdrop-blur-sm"
                              >
                                <p className="text-xs text-gray-400">{attr.trait_type}</p>
                                <p className="text-sm font-medium text-white truncate">{attr.value}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              {/* Footer actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="p-6 border-t border-amber-500/10 bg-black/20 flex justify-between gap-3"
              >
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex gap-1"
                    onClick={() => window.open(`https://etherscan.io/token/${selectedNft.contractAddress}?a=${selectedNft.tokenID}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Etherscan
                  </Button>
                  {selectedNft.imageUrl && (
                    <Button 
                      variant="outline"
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex gap-1"
                      onClick={() => downloadNFTImage(selectedNft.imageUrl!, selectedNft.tokenName || `nft-${selectedNft.tokenID}`)}
                    >
                      <DownloadIcon className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
              </motion.div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add a global style for animations */}
      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          50%, 100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </>
  );
}