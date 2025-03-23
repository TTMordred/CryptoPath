'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from "next/legacy/image";
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  fetchCollectionInfo,
  fetchCollectionNFTs,
} from '@/lib/api/alchemyNFTApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Info,
  ExternalLink,
  Copy,
  CheckCircle,
  Grid,
  List,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  FilterX,
  Loader2,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import ParticlesBackground from '@/components/ParticlesBackground';
import NetworkSelector from '@/components/NFT/NetworkSelector';
import AnimatedNFTCard from '@/components/NFT/AnimatedNFTCard';
import { getExplorerUrl, getChainColorTheme, formatAddress } from '@/lib/api/chainProviders';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  chain: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default function CollectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const collectionId = params?.collectionId as string;
  
  // Get network from URL or use default
  const networkParam = searchParams?.get('network');
  const [chainId, setChainId] = useState<string>(networkParam || '0x1');
  
  const [collection, setCollection] = useState<any | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(32); // Increased for virtualization
  const [sortBy, setSortBy] = useState<string>('tokenId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string[]>
  >({});
  const [attributeFilters, setAttributeFilters] = useState<
    Record<string, string[]>
  >({});
  const [pageTransition, setPageTransition] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState(16);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Scroll and virtualization refs
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    rootMargin: '200px 0px',
  });
  
  // Chain theme colors
  const chainTheme = getChainColorTheme(chainId);
  
  // Load more items when scrolling
  useEffect(() => {
    if (inView && !loading && visibleItems < nfts.length) {
      setVisibleItems(prev => Math.min(prev + 16, nfts.length));
    }
  }, [inView, loading, nfts.length, visibleItems]);

  // Network change handler
  const handleNetworkChange = (networkId: string) => {
    setChainId(networkId);
    setLoading(true);
    setVisibleItems(16);
    setCurrentPage(1);
    setNfts([]);
    
    // Update URL with network parameter
    const url = new URL(window.location.href);
    url.searchParams.set('network', networkId);
    window.history.pushState({}, '', url.toString());
    
    // Scroll to top
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
    
    setTimeout(() => {
      loadCollectionData(networkId);
    }, 300);
  };

  // Load collection data
  const loadCollectionData = useCallback(async (networkId: string = chainId) => {
    if (!collectionId) return;

    setLoading(true);
    try {
      // For BNB Chain, show a loading toast to indicate it might take some time
      if (networkId === '0x38' || networkId === '0x61') {
        toast({
          title: 'Loading BNB Chain NFTs',
          description: 'This may take a moment as we fetch data from BSCScan...',
        });
      }
      
      const metadata = await fetchCollectionInfo(collectionId, networkId);
      setCollection({...metadata, chain: networkId});

      const nftData = await fetchCollectionNFTs(
        collectionId,
        networkId,
        currentPage,
        pageSize,
        sortBy,
        sortDir,
        searchQuery,
        selectedAttributes
      );
      
      // Add chain property to each NFT
      const nftsWithChain = nftData.nfts.map(nft => ({
        ...nft,
        chain: networkId
      }));
      
      setNfts(nftsWithChain);
      
      // Calculate total pages - may be different for BNB Chain
      const totalPagesCount = Math.max(1, Math.ceil(nftData.totalCount / pageSize));
      setTotalPages(totalPagesCount);

      // Extract attributes for filtering
      const attributeMap: Record<string, string[]> = {};
      nftData.nfts.forEach((nft) => {
        if (nft.attributes) {
          nft.attributes.forEach((attr) => {
            if (!attributeMap[attr.trait_type]) {
              attributeMap[attr.trait_type] = [];
            }
            if (!attributeMap[attr.trait_type].includes(attr.value)) {
              attributeMap[attr.trait_type].push(attr.value);
            }
          });
        }
      });
      
      // Add network as a filter attribute
      attributeMap['Network'] = [
        networkId === '0x1' ? 'Ethereum' : 
        networkId === '0xaa36a7' ? 'Sepolia' : 
        networkId === '0x38' ? 'BNB Chain' : 
        'BNB Testnet'
      ];
      
      setAttributeFilters(attributeMap);
    } catch (error) {
      console.error('Error loading collection data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collection data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [collectionId, currentPage, pageSize, sortBy, sortDir, searchQuery, selectedAttributes, toast, chainId]);

  // Initial load
  useEffect(() => {
    loadCollectionData(chainId);
  }, [chainId, currentPage, sortBy, sortDir]);
  
  // Handle search and filter changes
  useEffect(() => {
    if (currentPage === 1) {
      loadCollectionData(chainId);
    } else {
      // Reset to page 1 when filters change
      setCurrentPage(1);
    }
  }, [searchQuery, selectedAttributes, chainId]);

  // Handler for copying address to clipboard
  const handleCopyAddress = () => {
    if (!collectionId) return;
    navigator.clipboard.writeText(collectionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Address copied',
      description: 'The collection address has been copied to your clipboard.',
    });
  };

  // Search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Apply search when enter is pressed
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentPage === 1) {
        loadCollectionData(chainId);
      } else {
        setCurrentPage(1);
      }
    }
  };

  // Sort handler
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-');
    setSortBy(field);
    setSortDir(direction as 'asc' | 'desc');
    setCurrentPage(1);
    setVisibleItems(16);
  };

  // Attribute filter handler
  const handleAttributeFilter = (traitType: string, value: string) => {
    setSelectedAttributes((prev) => {
      const newFilters = { ...prev };
      if (!newFilters[traitType]) {
        newFilters[traitType] = [];
      }

      if (newFilters[traitType].includes(value)) {
        newFilters[traitType] = newFilters[traitType].filter(
          (v) => v !== value
        );
      } else {
        newFilters[traitType].push(value);
      }

      if (newFilters[traitType].length === 0) {
        delete newFilters[traitType];
      }

      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedAttributes({});
    setSearchQuery('');
    if (currentPage === 1) {
      loadCollectionData(chainId);
    } else {
      setCurrentPage(1);
    }
    setVisibleItems(16);
  };

  // Check if an attribute is selected
  const isAttributeSelected = (traitType: string, value: string) => {
    return selectedAttributes[traitType]?.includes(value) || false;
  };

  // Get explorer URL for the current chain
  const getExplorerLink = (address: string) => {
    const chainConfig = {
      '0x1': 'https://etherscan.io',
      '0xaa36a7': 'https://sepolia.etherscan.io',
      '0x38': 'https://bscscan.com',
      '0x61': 'https://testnet.bscscan.com',
    };
    
    const baseUrl = chainConfig[chainId as keyof typeof chainConfig] || 'https://etherscan.io';
    return `${baseUrl}/address/${address}`;
  };
  
  // Get network display name
  const getNetworkName = () => {
    const networks = {
      '0x1': 'Ethereum',
      '0xaa36a7': 'Sepolia',
      '0x38': 'BNB Chain',
      '0x61': 'BNB Testnet',
    };
    return networks[chainId as keyof typeof networks] || 'Ethereum';
  };
  
  // Loading skeletons
  const renderSkeleton = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-40 w-40 rounded-lg" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 0.5,
                delay: i * 0.05,
              }
            }}
          >
            <Skeleton className="h-72 w-full rounded-lg" />
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Helper to sort and filter attribute values
  const getSortedAttributeValues = (attributeType: string, values: string[]) => {
    // Keep numeric values together and sort them correctly
    const numericValues: string[] = [];
    const textValues: string[] = [];
    
    values.forEach(value => {
      if (!isNaN(Number(value))) {
        numericValues.push(value);
      } else {
        textValues.push(value);
      }
    });
    
    numericValues.sort((a, b) => Number(a) - Number(b));
    textValues.sort();
    
    return [...numericValues, ...textValues];
  };
  
  // Attribute filter count
  const getSelectedFilterCount = () => {
    return Object.values(selectedAttributes).reduce((count, values) => count + values.length, 0);
  };
  
  // Get attribute style for chain-specific colors
  const getAttributeStyles = (traitType: string, value: string) => {
    const isSelected = isAttributeSelected(traitType, value);
    
    let bgClass = isSelected ? `${chainTheme.backgroundClass}` : 'hover:bg-gray-800';
    let textColor = isSelected ? chainTheme.primary : undefined;
    let borderClass = isSelected ? `${chainTheme.borderClass}` : 'border-gray-700';
    
    // Special case for network trait
    if (traitType === 'Network') {
      if (value.includes('BNB')) {
        bgClass = isSelected ? 'bg-yellow-500/20' : 'hover:bg-yellow-900/20';
        textColor = isSelected ? '#F0B90B' : undefined;
        borderClass = isSelected ? 'border-yellow-500/50' : 'border-gray-700';
      } else {
        bgClass = isSelected ? 'bg-blue-500/20' : 'hover:bg-blue-900/20';
        textColor = isSelected ? '#6b8df7' : undefined;
        borderClass = isSelected ? 'border-blue-500/50' : 'border-gray-700';
      }
    }
    
    return { bgClass, textColor, borderClass };
  };
  
  // Handle NFT click to show detail modal
  const handleNFTClick = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="relative min-h-screen text-white font-exo2">
      <ParticlesBackground />
      
      <div 
        className="container mx-auto px-4 py-8 relative z-10 overflow-y-auto overflow-x-hidden"
        ref={scrollRef}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 mt-16">
            <Button
              variant="outline"
              className="flex items-center w-full md:w-auto"
              onClick={() => {
                setPageTransition(true);
                setTimeout(() => router.push('/NFT/collection'), 300);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collections
            </Button>
            
            <NetworkSelector
              selectedNetwork={chainId}
              onNetworkChange={handleNetworkChange}
            />
          </div>
        </motion.div>

        {loading ? (
          renderSkeleton()
        ) : collection ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={chainId + collection?.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header with collection info */}
              <motion.div 
                className="flex flex-col md:flex-row gap-6 mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {collection.imageUrl ? (
                  <div className={`h-40 w-40 rounded-xl relative overflow-hidden border-2 ${chainTheme.borderClass} shadow-lg`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40 z-10" />
                    <Image
                      src={collection.imageUrl}
                      alt={collection.name}
                      layout="fill"
                      objectFit="cover"
                      className="transform transition duration-700 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.classList.add('bg-gray-800', 'flex', 'items-center', 'justify-center');
                        const icon = document.createElement('div');
                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
                        target.parentElement!.appendChild(icon);
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className={`h-40 w-40 rounded-xl bg-gray-800 flex items-center justify-center border ${chainTheme.borderClass}`}
                  >
                    <Info className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold" style={{ color: chainTheme.primary }}>
                      {collection.name}
                    </h1>
                    <Badge 
                      variant="outline" 
                      className={`${chainTheme.backgroundClass} border ${chainTheme.borderClass} text-sm font-medium`}
                      style={{ color: chainTheme.primary }}
                    >
                      {getNetworkName()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-normal text-gray-400 hover:text-white"
                        onClick={handleCopyAddress}
                      >
                        {formatAddress(collectionId || '')}
                        {copied ? (
                          <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <a
                      href={getExplorerLink(collectionId || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-white"
                    >
                      {chainId === '0x38' || chainId === '0x61' ? 'BscScan' : 'Etherscan'} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>

                  <p className="text-gray-300 mb-4">{collection.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {collection.totalSupply && (
                      <Badge 
                        variant="outline" 
                        className={`border ${chainTheme.borderClass}`}
                        style={{ color: chainTheme.primary }}
                      >
                        Total Items: {collection.totalSupply}
                      </Badge>
                    )}
                    {collection.symbol && (
                      <Badge 
                        variant="outline"
                        className={`border ${chainTheme.borderClass}`}
                        style={{ color: chainTheme.primary }}
                      >
                        Symbol: {collection.symbol}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Main content - Filter sidebar and NFT grid */}
              <div className="flex flex-col lg:flex-row gap-6 mb-8">
                {/* Desktop Filter Sidebar */}
                <motion.div 
                  className="hidden lg:block lg:w-64 space-y-4 sticky top-24 self-start"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className={`p-4 rounded-lg ${chainTheme.backgroundClass} border ${chainTheme.borderClass}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                      </h2>
                      {getSelectedFilterCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={clearFilters}
                        >
                          <FilterX className="mr-1 h-3 w-3" />
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin">
                      {Object.entries(attributeFilters).map(([traitType, values]) => (
                        <motion.div 
                          key={traitType} 
                          className="space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                        >
                          <h3 className={`font-medium ${chainTheme.textClass}`}>{traitType}</h3>
                          {getSortedAttributeValues(traitType, values).map((value) => {
                            const styles = getAttributeStyles(traitType, value);
                            return (
                              <div key={value} className="flex items-center">
                                <div
                                  className={`flex text-xs h-auto py-1.5 px-2 justify-start w-full items-center rounded-md border ${styles.borderClass} ${styles.bgClass} cursor-pointer transition-colors hover:bg-gray-800/70`}
                                  style={{ color: styles.textColor }}
                                  onClick={() => handleAttributeFilter(traitType, value)}
                                >
                                  <Checkbox
                                    checked={isAttributeSelected(traitType, value)}
                                    className="mr-2 h-3 w-3"
                                    style={{ 
                                      accentColor: chainTheme.primary,
                                      borderColor: styles.textColor
                                    }}
                                    onCheckedChange={() => handleAttributeFilter(traitType, value)}
                                  />
                                  {value}
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Mobile Filter Button */}
                <div className="lg:hidden sticky top-4 z-20 mb-4">
                  <Sheet open={isFilterMobileOpen} onOpenChange={setIsFilterMobileOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-between"
                        style={{ borderColor: chainTheme.primary, color: chainTheme.primary }}
                      >
                        <div className="flex items-center">
                          <Filter className="mr-2 h-4 w-4" />
                          Filters
                        </div>
                        {getSelectedFilterCount() > 0 && (
                          <Badge className={chainTheme.backgroundClass}>
                            {getSelectedFilterCount()}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-md border-r border-gray-800 bg-black/95 backdrop-blur-xl p-0">
                      <SheetHeader className={`px-6 py-4 border-b ${chainTheme.borderClass}`}>
                        <SheetTitle className="text-white">Filters</SheetTitle>
                      </SheetHeader>
                      
                      <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-10rem)]">
                        {getSelectedFilterCount() > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mb-4"
                            onClick={() => {
                              clearFilters();
                              setIsFilterMobileOpen(false);
                            }}
                          >
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear all filters
                          </Button>
                        )}
                        
                        <div className="space-y-6">
                          {Object.entries(attributeFilters).map(([traitType, values]) => (
                            <div key={traitType} className="space-y-3">
                              <h3 className={`font-medium ${chainTheme.textClass}`}>{traitType}</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {getSortedAttributeValues(traitType, values).map((value) => {
                                  const styles = getAttributeStyles(traitType, value);
                                  return (
                                    <div
                                      key={value}
                                      className={`flex text-xs justify-start items-center gap-2 py-1.5 px-2 rounded-md border ${styles.borderClass} ${styles.bgClass} cursor-pointer transition-colors hover:bg-gray-800/70`}
                                      style={{ color: styles.textColor }}
                                      onClick={() => handleAttributeFilter(traitType, value)}
                                    >
                                      <div className="flex-shrink-0">
                                        <Checkbox
                                          checked={isAttributeSelected(traitType, value)}
                                          className="h-3 w-3"
                                          id={`mobile-${traitType}-${value}`}
                                          onCheckedChange={() => handleAttributeFilter(traitType, value)}
                                        />
                                      </div>
                                      <label 
                                        htmlFor={`mobile-${traitType}-${value}`}
                                        className="truncate cursor-pointer"
                                      >
                                        {value}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <SheetFooter className="px-6 py-4 border-t border-gray-800">
                        <SheetClose asChild>
                          <Button className="w-full" onClick={() => loadCollectionData()}>
                            Apply Filters
                          </Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* NFT Display Area */}
                <div className="flex-1">
                  <motion.div 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {/* Search/Sort Controls */}
                    <div className="w-full sm:w-auto flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or ID..."
                        className="pl-10 bg-gray-800/50 border-gray-700"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Select
                        value={`${sortBy}-${sortDir}`}
                        onValueChange={handleSortChange}
                      >
                        <SelectTrigger className="w-full sm:w-[180px] bg-gray-800/50 border-gray-700">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tokenId-asc">
                            ID (Ascending)
                          </SelectItem>
                          <SelectItem value="tokenId-desc">
                            ID (Descending)
                          </SelectItem>
                          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex bg-gray-800/50 rounded-md p-1">
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="px-2"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="px-2"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Active Filter Pills */}
                  {getSelectedFilterCount() > 0 && (
                    <motion.div 
                      className="flex flex-wrap gap-2 mb-4"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {Object.entries(selectedAttributes).map(([traitType, values]) => (
                        values.map(value => {
                          const styles = getAttributeStyles(traitType, value);
                          return (
                            <Badge 
                              key={`${traitType}-${value}`}
                              className={`${styles.bgClass} border ${styles.borderClass} px-2 py-1`}
                              style={{ color: styles.textColor }}
                            >
                              {traitType}: {value}
                              <X 
                                className="ml-1 h-3 w-3 cursor-pointer" 
                                onClick={() => handleAttributeFilter(traitType, value)}
                              />
                            </Badge>
                          );
                        })
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={clearFilters}
                      >
                        Clear all
                      </Button>
                    </motion.div>
                  )}

                  {/* No Results Message */}
                  {nfts.length === 0 ? (
                    <motion.div 
                      className="text-center py-12 border border-gray-800 rounded-lg bg-black/30"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-gray-400">
                        No NFTs found for this collection.
                      </p>
                      {(searchQuery ||
                        Object.keys(selectedAttributes).length > 0) && (
                        <Button
                          variant="link"
                          onClick={clearFilters}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <>
                      {/* NFT Grid with Virtualization */}
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.05
                            }
                          }
                        }}
                        layout
                        className={
                          viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
                            : 'space-y-4'
                        }
                      >
                        <AnimatePresence mode="wait">
                          {nfts.slice(0, visibleItems).map((nft, index) => (
                            <AnimatedNFTCard
                              key={`${nft.id}-${chainId}`}
                              nft={nft}
                              index={index}
                              onClick={() => handleNFTClick(nft)}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>

                      {/* Load More Indicator */}
                      {visibleItems < nfts.length && (
                        <div 
                          ref={loadMoreRef}
                          className="flex justify-center my-8"
                        >
                          <div className={`h-10 w-10 rounded-full border-2 border-t-transparent animate-spin`} 
                            style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
                        </div>
                      )}

                      {/* Pagination for pages */}
                      {totalPages > 1 && (
                        <Pagination className="mt-8">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                    setVisibleItems(16);
                                    // Scroll to top
                                    scrollRef.current?.scrollTo({
                                      top: 0,
                                      behavior: 'smooth'
                                    });
                                  }
                                }}
                                className={
                                  currentPage === 1
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }
                              />
                            </PaginationItem>

                            {[...Array(totalPages)].map((_, i) => {
                              const pageNumber = i + 1;
                              // Show first page, last page, and pages around current page
                              if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 &&
                                  pageNumber <= currentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={pageNumber}>
                                    <PaginationLink
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentPage(pageNumber);
                                        setVisibleItems(16);
                                        // Scroll to top
                                        scrollRef.current?.scrollTo({
                                          top: 0,
                                          behavior: 'smooth'
                                        });
                                      }}
                                      isActive={pageNumber === currentPage}
                                      style={
                                        pageNumber === currentPage 
                                          ? { backgroundColor: chainTheme.primary, color: 'black' }
                                          : undefined
                                      }
                                    >
                                      {pageNumber}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }

                              // Show ellipsis for gaps
                              if (
                                (pageNumber === 2 && currentPage > 3) ||
                                (pageNumber === totalPages - 1 &&
                                  currentPage < totalPages - 2)
                              ) {
                                return (
                                  <PaginationItem key={pageNumber}>
                                    <span className="px-2">...</span>
                                  </PaginationItem>
                                );
                              }

                              return null;
                            })}

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage < totalPages) {
                                    setCurrentPage(currentPage + 1);
                                    setVisibleItems(16);
                                    // Scroll to top
                                    scrollRef.current?.scrollTo({
                                      top: 0,
                                      behavior: 'smooth'
                                    });
                                  }
                                }}
                                className={
                                  currentPage === totalPages
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div 
            className="text-center py-12 border border-gray-800 rounded-lg bg-black/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Info className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium">Collection not found</h3>
            <p className="text-gray-400 mb-4">
              The collection you're looking for doesn't exist or couldn't be loaded.
            </p>
            <Link href="/NFT/collection">
              <Button>Browse Collections</Button>
            </Link>
          </motion.div>
        )}
        
        {/* NFT Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="bg-black/95 border border-gray-800 backdrop-blur-xl max-w-3xl">
            {selectedNFT && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center justify-between">
                    <span>{selectedNFT.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`${chainTheme.backgroundClass} border ${chainTheme.borderClass}`}
                      style={{ color: chainTheme.primary }}
                    >
                      {getNetworkName()}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-800">
                    {selectedNFT.imageUrl ? (
                      <Image
                        src={selectedNFT.imageUrl.startsWith('ipfs://') 
                          ? `https://ipfs.io/ipfs/${selectedNFT.imageUrl.slice(7)}`
                          : selectedNFT.imageUrl
                        }
                        alt={selectedNFT.name}
                        layout="fill"
                        objectFit="cover"
                        className="transform transition duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Info className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-1">
                      <h3 className="text-sm text-gray-400">Token ID</h3>
                      <p className="text-lg font-mono">{selectedNFT.tokenId}</p>
                    </div>
                    
                    {selectedNFT.description && (
                      <div className="bg-gray-900/50 rounded-lg p-4 space-y-1">
                        <h3 className="text-sm text-gray-400">Description</h3>
                        <p className="text-sm">{selectedNFT.description}</p>
                      </div>
                    )}
                    
                    {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                      <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
                        <h3 className="text-sm text-gray-400">Attributes</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedNFT.attributes.map((attr, idx) => {
                            const styles = getAttributeStyles(attr.trait_type, attr.value);
                            return (
                              <div 
                                key={idx} 
                                className={`p-2 rounded-lg ${styles.bgClass} border ${styles.borderClass}`}
                              >
                                <h4 className="text-xs text-gray-400">{attr.trait_type}</h4>
                                <p className="text-sm font-medium" style={{ color: styles.textColor }}>
                                  {attr.value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <a
                      href={getExplorerLink(collectionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View on {chainId === '0x38' || chainId === '0x61' ? 'BscScan' : 'Etherscan'}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
