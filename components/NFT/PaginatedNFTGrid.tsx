import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedNFTCard from './AnimatedNFTCard';
import { 
  fetchCollectionNFTs,
  estimateCollectionMemoryUsage,
  getNFTIndexingStatus,
  fetchPaginatedNFTs
} from '@/lib/api/nftService';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatedNFTGridProps {
  contractAddress: string;
  chainId: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  attributes?: Record<string, string[]>;
  viewMode?: 'grid' | 'list';
  onNFTClick?: (nft: any) => void;
  itemsPerPage?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
}

export default function PaginatedNFTGrid({
  contractAddress,
  chainId,
  sortBy = 'tokenId',
  sortDirection = 'asc',
  searchQuery = '',
  attributes = {},
  viewMode = 'grid',
  onNFTClick,
  itemsPerPage = 20, // Reduced to exactly 20 for optimal API usage
  defaultPage = 1,
  onPageChange
}: PaginatedNFTGridProps) {
  // State for pagination and data
  const [nfts, setNfts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexingStatus, setIndexingStatus] = useState<{
    status: 'completed' | 'in_progress' | 'not_started';
    progress: number;
  }>({ status: 'completed', progress: 100 });
  
  // For better UX when loading new pages
  const [fadeState, setFadeState] = useState("in");
  
  // Get chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  // Fetch NFTs for the current page
  const fetchNFTsForPage = useCallback(async (page: number) => {
    if (!contractAddress) return;
    
    setLoading(true);
    setFadeState("out");
    
    try {
      // Check indexing status
      const indexing = await getNFTIndexingStatus(contractAddress, chainId);
      setIndexingStatus(indexing);
      
      // Use our optimized paginated fetch function
      const result = await fetchPaginatedNFTs(
        contractAddress,
        chainId,
        page,
        itemsPerPage,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      );
      
      // Calculate total pages
      const pages = Math.ceil(result.totalCount / itemsPerPage);
      console.log(`DEBUG: Total count ${result.totalCount}, items per page ${itemsPerPage}, total pages: ${pages}`);
      
      setNfts(result.nfts);
      setTotalCount(result.totalCount);
      setTotalPages(pages > 0 ? pages : 1);
      setError(null);
      
      // Fade in the new content
      setTimeout(() => {
        setFadeState("in");
      }, 100);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to load NFTs. Please try again.');
      setFadeState("in");
    } finally {
      setLoading(false);
    }
  }, [contractAddress, chainId, itemsPerPage, sortBy, sortDirection, searchQuery, attributes]);
  
  // Load initial data
  useEffect(() => {
    fetchNFTsForPage(currentPage);
  }, [currentPage, fetchNFTsForPage]);
  
  // Update current page if default page changes from parent
  useEffect(() => {
    if (defaultPage !== currentPage) {
      setCurrentPage(defaultPage);
    }
  }, [defaultPage]);
  
  // Handle explicit page navigation
  const handlePageChange = (page: number) => {
    // Validate page range
    if (page < 1 || page > totalPages) return;
    
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Change page
    setCurrentPage(page);
    
    // Notify parent if callback provided
    if (onPageChange) {
      onPageChange(page);
    }
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Middle pages
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push(-1); // -1 represents ellipsis
    }
    
    // Add middle pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push(-2); // -2 represents ellipsis
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  // Empty state
  if (!loading && nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50">
        <Search className="h-10 w-10 text-gray-500 mb-4" />
        <p className="text-gray-400 mb-2">No NFTs found for this collection.</p>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }
  
  // Loading state for initial load
  if (loading && nfts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Loading NFTs...
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Estimated size:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 cursor-help">
                    {estimateCollectionMemoryUsage(totalCount || 1000)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated memory usage for full collection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div key={index} className="aspect-square bg-gray-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-red-700 rounded-xl bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-red-400 mb-2">{error}</p>
        <Button onClick={() => fetchNFTsForPage(currentPage)} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collection indexing status */}
      {indexingStatus.status !== 'completed' && (
        <div className="mb-4 bg-gray-800/30 p-4 rounded-lg border border-gray-700">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-amber-400">Collection indexing in progress</span>
            <span>{Math.round(indexingStatus.progress)}% complete</span>
          </div>
          <Progress value={indexingStatus.progress} className="h-1" />
          <p className="text-xs text-gray-400 mt-2">
            This collection is still being indexed. More NFTs will appear as indexing completes.
          </p>
        </div>
      )}
      
      {/* Stats bar with debug info */}
      <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-800/30 rounded-md">
        <div className="text-sm text-gray-300">
          Showing page {currentPage} of {totalPages} ({nfts.length} of {totalCount.toLocaleString()} total items)
        </div>
        
        {/* Memory usage estimate */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 cursor-help">
                {estimateCollectionMemoryUsage(totalCount)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Estimated memory usage for full collection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Loading overlay for page changes */}
      {loading && nfts.length > 0 && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
        </div>
      )}

      {/* NFT Grid with fade transition */}
      <div className={`relative transition-opacity duration-300 ${fadeState === "out" ? "opacity-30" : "opacity-100"}`}>
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'grid grid-cols-1 gap-4'
        }>
          <AnimatePresence mode="wait">
            {nfts.map((nft, index) => (
              <motion.div
                key={`${nft.id}-${currentPage}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: Math.min(0.05 * (index % 12), 0.5) }}
              >
                <AnimatedNFTCard
                  nft={nft}
                  index={index}
                  onClick={() => onNFTClick && onNFTClick(nft)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Enhanced Navigation Controls - Always Visible */}
      <div className="mt-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="bg-gray-800/80 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-gray-300">
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                {/* Previous button - always visible */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="h-10 w-10 bg-gray-700 hover:bg-gray-600"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                {/* Page numbers - enhanced visibility */}
                {totalPages > 1 && getPageNumbers().map((pageNum, i) => (
                  pageNum < 0 ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`h-10 w-10 ${
                        pageNum === currentPage 
                          ? chainTheme.backgroundClass
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      style={
                        pageNum === currentPage 
                          ? { color: chainTheme.primary === '#F0B90B' ? 'black' : 'white' }
                          : undefined
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                ))}
                
                {/* Next button - always visible */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="h-10 w-10 bg-gray-700 hover:bg-gray-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Optimized loading note */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Optimized pagination with 20 items per page to minimize API usage
      </div>
    </div>
  );
}
