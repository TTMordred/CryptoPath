import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowUpToLine, Info, AlertTriangle } from 'lucide-react';
import AnimatedNFTCard from './AnimatedNFTCard';
import {
  fetchNFTsWithOptimizedCursor,
  fetchNFTsWithProgressiveLoading,
  estimateCollectionMemoryUsage,
  clearSpecificCollectionCache
} from '@/lib/api/nftService';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  imageUrl: string;
  chain: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  isPlaceholder?: boolean;
}

interface VirtualizedNFTGridProps {
  contractAddress: string;
  chainId: string;
  searchQuery?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  attributes?: Record<string, string[]>;
  viewMode?: 'grid' | 'list';
  onNFTClick?: (nft: NFT) => void;
  progressiveLoading?: boolean;
  batchSize?: number;
  estimatedRowHeight?: number;
  onLoadingComplete?: () => void;
}

export default function VirtualizedNFTGrid({
  contractAddress,
  chainId,
  searchQuery = '',
  sortBy = 'tokenId',
  sortDirection = 'asc',
  attributes = {},
  viewMode = 'grid',
  onNFTClick,
  progressiveLoading = true,
  batchSize = 50,
  estimatedRowHeight = 300,
  onLoadingComplete
}: VirtualizedNFTGridProps) {
  // State for grid
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [placeholderCount, setPlaceholderCount] = useState(20);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Refs
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const scrollUpTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  // Calculate columns based on view mode and window width
  const getColumnCount = useCallback(() => {
    if (!windowWidth) return viewMode === 'grid' ? 4 : 2;
    
    if (viewMode === 'list') return 1;
    if (windowWidth < 640) return 1;
    if (windowWidth < 768) return 2;
    if (windowWidth < 1024) return 3;
    return 4;
  }, [viewMode, windowWidth]);

  // Calculate window width on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate rows for virtualizer based on items and columns
  const columnCount = getColumnCount();
  const rowCount = Math.ceil(nfts.length / columnCount);
  
  // Set up virtualizer
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rowCount + 1 : rowCount, // +1 for loading more row
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 5,
    scrollMargin: 200, // Add margin for smoother scrolling
  });

  // Handle scroll events for showing "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      if (!parentRef.current) return;
      
      const { scrollTop } = parentRef.current;
      
      // Show scroll-to-top when scrolled down 500px
      setShowScrollTop(scrollTop > 500);
      
      // Set scrolling state with debounce
      setIsScrolling(true);
      
      if (scrollUpTimer.current) {
        clearTimeout(scrollUpTimer.current);
      }
      
      scrollUpTimer.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Load NFTs using the appropriate loading strategy
  useEffect(() => {
    setIsLoading(true);
    setLoadingError(null);
    setLoadingProgress(0);
    
    // Show placeholder layout during loading
    if (isInitialLoad) {
      // Create placeholder NFTs
      const placeholders = Array.from({ length: placeholderCount }, (_, i) => ({
        id: `placeholder-${i}`,
        tokenId: `${i}`,
        name: 'Loading...',
        imageUrl: '',
        chain: chainId,
        isPlaceholder: true
      }));
      
      setNfts(placeholders);
    }
    
    // Either use progressive loading or cursor-based loading
    const loadNFTs = async () => {
      try {
        if (progressiveLoading) {
          // Progressive loading loads all NFTs in batches
          const result = await fetchNFTsWithProgressiveLoading(
            contractAddress,
            chainId,
            {
              batchSize,
              initialPageSize: batchSize,
              sortBy,
              sortDirection,
              searchQuery,
              attributes,
              onProgress: (loaded: number, total: number) => {
                setLoadingProgress(Math.round((loaded / total) * 100));
              }
            }
          );
          
          setNfts(result.nfts);
          setTotalCount(result.totalCount);
          setHasNextPage(!!result.hasMoreBatches);
          setLoadingProgress(result.progress);
        } else {
          // First load with cursor-based pagination
          const result = await fetchNFTsWithOptimizedCursor(
            contractAddress,
            chainId,
            '1', // Start with first page
            batchSize,
            sortBy,
            sortDirection,
            searchQuery,
            attributes
          );
          
          setNfts(result.nfts);
          setTotalCount(result.totalCount);
          setCursor(result.nextCursor);
          setHasNextPage(!!result.nextCursor);
          setLoadingProgress(result.progress);
        }
        
        setIsLoading(false);
        setIsInitialLoad(false);
        if (onLoadingComplete) onLoadingComplete();
      } catch (error) {
        console.error('Error loading NFTs:', error);
        setLoadingError('Failed to load NFTs. Please try again.');
        setIsLoading(false);
        
        // Auto-retry up to 3 times with increasing delay
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          
          toast({
            title: 'Loading error',
            description: `Retrying in ${delay/1000} seconds...`,
            variant: 'destructive',
          });
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            
            // Try again
            setIsLoading(true);
            setLoadingError(null);
          }, delay);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load NFTs after multiple attempts. Please try again later.',
            variant: 'destructive',
          });
        }
      }
    };
    
    loadNFTs();
    
    // Cleanup function to abort any in-progress loads when filters change
    return () => {
      // Could implement an abort controller here if needed
    };
  }, [
    contractAddress, 
    chainId, 
    searchQuery, 
    sortBy, 
    sortDirection, 
    JSON.stringify(attributes), 
    retryCount,
    progressiveLoading,
    batchSize,
    isInitialLoad
  ]);
  
  // Load more NFTs when scrolling to the end (for cursor-based pagination)
  const loadMoreNFTs = useCallback(async () => {
    if (!hasNextPage || isLoading || progressiveLoading || !cursor) return;
    
    try {
      setIsLoading(true);
      
      const result = await fetchNFTsWithOptimizedCursor(
        contractAddress,
        chainId,
        cursor,
        batchSize,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      );
      
      setNfts(prev => [...prev, ...result.nfts]);
      setCursor(result.nextCursor);
      setHasNextPage(!!result.nextCursor);
      setLoadingProgress(result.progress);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading more NFTs:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load more NFTs. Please try again.',
        variant: 'destructive',
      });
    }
  }, [
    hasNextPage, 
    isLoading, 
    cursor, 
    contractAddress, 
    chainId, 
    batchSize, 
    sortBy, 
    sortDirection, 
    searchQuery, 
    attributes,
    progressiveLoading,
    toast
  ]);
  
  // Load more when the virtualized rows include the loading row
  useEffect(() => {
    const range = rowVirtualizer.range;
    if (!range) return;
    
    const lastRow = range.endIndex;
    const totalRows = rowCount;
    
    // If we're within 3 rows of the end and there are more items to load, load more
    if (!progressiveLoading && !isLoading && hasNextPage && lastRow >= totalRows - 3) {
      loadMoreNFTs();
    }
  }, [
    rowVirtualizer.range?.endIndex, 
    rowCount, 
    isLoading, 
    hasNextPage, 
    loadMoreNFTs, 
    progressiveLoading
  ]);
  
  // Clear cache for this collection (useful for admin or debug)
  const handleClearCache = useCallback(() => {
    clearSpecificCollectionCache(contractAddress, chainId);
    toast({
      title: 'Cache Cleared',
      description: 'The cache for this collection has been cleared.',
    });
  }, [contractAddress, chainId, toast]);
  
  // Choose the right item height based on view mode
  const getItemHeight = () => {
    if (viewMode === 'list') return 120;
    return windowWidth < 640 ? 280 : 320;
  };
  
  // Check if NFTs are being filtered
  const isFiltered = !!searchQuery || Object.keys(attributes).length > 0;
  
  // Handle NFT click
  const handleNFTClick = (nft: NFT) => {
    if (onNFTClick && !nft.isPlaceholder) onNFTClick(nft);
  };
  
  // Handle scroll to top
  const handleScrollToTop = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Get memory usage estimate for debugging
  const memoryEstimate = estimateCollectionMemoryUsage(totalCount);

  return (
    <div className="relative">
      {/* Progress indicator for progressive loading */}
      {progressiveLoading && loadingProgress < 100 && (
        <div className="sticky top-0 z-30 mb-4 bg-black/70 py-2 px-4 rounded-md backdrop-blur-md border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-400">
              Loading NFTs: {loadingProgress}% ({nfts.length} of {totalCount})
            </div>
            <div className="text-xs text-gray-500">
              Est. memory: {memoryEstimate}
            </div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${loadingProgress}%`,
                backgroundColor: chainTheme.primary
              }}
            />
          </div>
        </div>
      )}
      
      {/* Main virtualized grid container */}
      <div
        ref={parentRef}
        className="relative h-[calc(100vh-280px)] w-full overflow-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700"
        style={{ contain: 'strict' }}
        aria-label="NFT Collection Grid"
      >
        {/* Scroll to top button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-black/80 backdrop-blur-sm border border-gray-700 text-white shadow-lg hover:bg-gray-800 transition-colors"
              onClick={handleScrollToTop}
              aria-label="Scroll to top"
            >
              <ArrowUpToLine className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Virtualizer inner container */}
        <div
          ref={gridContentRef}
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowIsLoaderRow = hasNextPage && virtualRow.index === rowCount;
            
            // If this is the loading indicator row
            if (rowIsLoaderRow) {
              return (
                <div
                  key="loader"
                  ref={loadMoreRef}
                  className="absolute left-0 w-full flex justify-center py-6"
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 
                        className="h-6 w-6 animate-spin" 
                        style={{ color: chainTheme.primary }} 
                      />
                      <span className="text-gray-400">Loading more NFTs...</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      {hasNextPage ? 'Scroll to load more' : 'No more NFTs to load'}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular row of NFTs
            const rowStartIndex = virtualRow.index * columnCount;
            const rowEndIndex = Math.min(rowStartIndex + columnCount, nfts.length);
            const rowNFTs = nfts.slice(rowStartIndex, rowEndIndex);
            
            return (
              <div
                key={virtualRow.key}
                className={`absolute left-0 w-full grid ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
                    : 'grid-cols-1 gap-3'
                }`}
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowNFTs.map((nft, idx) => (
                  <div key={nft.id || `nft-${rowStartIndex + idx}`}>
                    <AnimatedNFTCard 
                      nft={nft} 
                      onClick={() => handleNFTClick(nft)} 
                      index={rowStartIndex + idx}
                      isVirtualized={true}
                    />
                  </div>
                ))}
                
                {/* Fill empty cells in last row */}
                {rowNFTs.length < columnCount && !isFiltered && (
                  Array.from({ length: columnCount - rowNFTs.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="invisible"></div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Error message with retry ability */}
      {loadingError && retryCount >= 3 && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-md">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-red-300 font-medium">{loadingError}</p>
          </div>
          <p className="text-gray-400 mb-4 pl-8">
            We encountered an issue loading this collection. This could be due to rate limits or an issue with the collection contract.
          </p>
          <div className="flex flex-wrap gap-3 pl-8">
            <Button
              variant="destructive"
              onClick={() => {
                setRetryCount(0);
                setIsLoading(true);
                setLoadingError(null);
              }}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={handleClearCache}
            >
              Clear Cache
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && nfts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-gray-700 rounded-lg mt-6">
          <Info className="h-12 w-12 text-gray-500 mb-4" />
          <div className="text-gray-400 text-center">
            <h3 className="text-xl mb-2">No NFTs Found</h3>
            <p className="mb-4">
              {isFiltered 
                ? 'No NFTs match your current filters. Try adjusting your search or filters.'
                : 'This collection appears to be empty or still loading.'}
            </p>
            {isFiltered && (
              <Button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
