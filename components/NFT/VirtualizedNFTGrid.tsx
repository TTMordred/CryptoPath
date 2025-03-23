import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AnimatedNFTCard from './AnimatedNFTCard';
import { 
  fetchNFTsWithOptimizedCursor, 
  fetchNFTsWithProgressiveLoading,
  estimateCollectionMemoryUsage
} from '@/lib/api/nftService';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface VirtualizedNFTGridProps {
  contractAddress: string;
  chainId: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  attributes?: Record<string, string[]>;
  viewMode?: 'grid' | 'list';
  onNFTClick?: (nft: any) => void;
  itemsPerPage?: number;
  maxItems?: number; // Optional limit to total items
}

export default function VirtualizedNFTGrid({
  contractAddress,
  chainId,
  sortBy = 'tokenId',
  sortDirection = 'asc',
  searchQuery = '',
  attributes = {},
  viewMode = 'grid',
  onNFTClick,
  itemsPerPage = 24,
  maxItems
}: VirtualizedNFTGridProps) {
  // State for different loading approaches
  const [nfts, setNfts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [useProgressiveLoading, setUseProgressiveLoading] = useState(false);
  const [progressiveLoadingStarted, setProgressiveLoadingStarted] = useState(false);
  
  // Refs for optimization
  const loadingMoreRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const containerSize = useRef({ width: 0, height: 0 });
  
  // Get chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  // Intersection observer for infinite loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '400px 0px', // Load more before user reaches bottom
  });
  
  // Calculate grid dimensions
  const calculateGridDimensions = useCallback(() => {
    if (!parentRef.current) return;
    
    const container = parentRef.current;
    const containerWidth = container.clientWidth;
    
    let columns: number;
    if (viewMode === 'list') {
      columns = 1;
    } else {
      // Responsive column count
      if (containerWidth >= 1280) columns = 4;
      else if (containerWidth >= 768) columns = 3;
      else if (containerWidth >= 640) columns = 2;
      else columns = 1;
    }
    
    // Estimate item width and height
    const itemWidth = Math.floor(containerWidth / columns);
    const itemHeight = viewMode === 'list' ? 120 : itemWidth; // List items are shorter
    
    return { columns, itemWidth, itemHeight };
  }, [viewMode]);
  
  // Virtualization setup for grid layout
  const dimensions = useMemo(() => calculateGridDimensions(), [calculateGridDimensions]);
  
  // Grid virtualizer
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(nfts.length / (dimensions?.columns || 1)),
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => dimensions?.itemHeight || 300, [dimensions]),
    overscan: 5,
  });

  // Decide whether to use progressive loading based on collection size
  useEffect(() => {
    if (totalCount > 500 && !progressiveLoadingStarted && !useProgressiveLoading) {
      // For large collections, suggest progressive loading
      const shouldUseProgressive = totalCount > 2000;
      setUseProgressiveLoading(shouldUseProgressive);
    }
  }, [totalCount, progressiveLoadingStarted, useProgressiveLoading]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (parentRef.current) {
        containerSize.current = {
          width: parentRef.current.clientWidth,
          height: parentRef.current.clientHeight
        };
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load initial data with optimized cursor approach
  const loadInitialData = useCallback(async () => {
    setInitialLoading(true);
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchNFTsWithOptimizedCursor(
        contractAddress,
        chainId,
        undefined, // No cursor for initial load
        itemsPerPage,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      );
      
      setNfts(result.nfts);
      setTotalCount(result.totalCount);
      setLoadedCount(result.loadedCount);
      setProgress(result.progress);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      setError('Failed to load NFTs. Please try again.');
      console.error('Error loading NFTs:', err);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [contractAddress, chainId, itemsPerPage, sortBy, sortDirection, searchQuery, attributes]);
  
  // Load more data using the cursor-based approach
  const loadMoreData = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current || !hasMore) return;
    
    loadingMoreRef.current = true;
    setLoading(true);
    
    try {
      const result = await fetchNFTsWithOptimizedCursor(
        contractAddress,
        chainId,
        nextCursor,
        itemsPerPage,
        sortBy,
        sortDirection,
        searchQuery,
        attributes
      );
      
      setNfts(prev => [...prev, ...result.nfts]);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      setLoadedCount(result.loadedCount);
      setProgress(result.progress);
    } catch (err) {
      console.error('Error loading more NFTs:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoading(false);
    }
  }, [nextCursor, hasMore, contractAddress, chainId, itemsPerPage, sortBy, sortDirection, searchQuery, attributes]);
  
  // Start progressive loading to load entire collection
  const startProgressiveLoading = useCallback(async () => {
    setProgressiveLoadingStarted(true);
    
    try {
      // Start the progressive loading process
      const onProgressUpdate = (loaded: number, total: number) => {
        setLoadedCount(loaded);
        setProgress(Math.min(100, (loaded / total) * 100));
      };
      
      const result = await fetchNFTsWithProgressiveLoading(
        contractAddress,
        chainId,
        {
          batchSize: 100,
          maxBatches: maxItems ? Math.ceil(maxItems / 100) : 100,
          initialPage: 1,
          initialPageSize: nfts.length > 0 ? nfts.length : itemsPerPage,
          sortBy,
          sortDirection,
          searchQuery,
          attributes,
          onProgress: onProgressUpdate
        }
      );
      
      setNfts(result.nfts);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMoreBatches);
      setProgress(result.progress);
    } catch (err) {
      console.error('Error in progressive loading:', err);
    }
  }, [contractAddress, chainId, itemsPerPage, maxItems, nfts.length, sortBy, sortDirection, searchQuery, attributes]);
  
  // Load initial data on mount and when dependencies change
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Trigger load more when in view
  useEffect(() => {
    if (inView && !initialLoading && hasMore && !loading && !progressiveLoadingStarted) {
      loadMoreData();
    }
  }, [inView, initialLoading, hasMore, loadMoreData, loading, progressiveLoadingStarted]);
  
  // Apply maximum items limit if specified
  useEffect(() => {
    if (maxItems && nfts.length > maxItems) {
      setNfts(prev => prev.slice(0, maxItems));
      setHasMore(false);
    }
  }, [nfts, maxItems]);
  
  // Render virtualized grid items
  const renderVirtualizedItems = () => {
    const { columns = 1 } = dimensions || {};
    
    return (
      <div
        ref={parentRef}
        className="h-[800px] overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ 
          height: 'calc(100vh - 200px)', 
          minHeight: '500px',
          maxHeight: '1000px'
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowStartIndex = virtualRow.index * columns;
            
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: dimensions?.itemHeight,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: '1rem'
                }}
                className="grid gap-4"
              >
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const nftIndex = rowStartIndex + colIndex;
                  const nft = nfts[nftIndex];
                  
                  if (!nft) return <div key={colIndex} />;
                  
                  return (
                    <div key={`${virtualRow.index}-${colIndex}`}>
                      <AnimatedNFTCard
                        nft={nft}
                        index={nftIndex}
                        onClick={() => onNFTClick && onNFTClick(nft)}
                        isVirtualized={true}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Empty state
  if (!initialLoading && nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50">
        <Search className="h-10 w-10 text-gray-500 mb-4" />
        <p className="text-gray-400 mb-2">No NFTs found for this collection.</p>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }
  
  // Loading state for initial load
  if (initialLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <div key={index} className="aspect-square bg-gray-800/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-red-700 rounded-xl bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-red-400 mb-2">{error}</p>
        <Button onClick={loadInitialData} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="space-y-4">
      {/* Progress indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            Showing {nfts.length} of {totalCount.toLocaleString()} items
          </span>
          
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
        
        {/* Progressive loading button for large collections */}
        {totalCount > 500 && !progressiveLoadingStarted && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={startProgressiveLoading}
            className={`text-xs border ${chainTheme.borderClass}`}
            style={{ color: chainTheme.primary }}
          >
            <Loader2 className="mr-1 h-3 w-3" />
            Load Entire Collection
          </Button>
        )}
      </div>
      
      {/* Loading progress bar */}
      {(loading || progress > 0 && progress < 100) && (
        <div className="mb-4">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{loadedCount.toLocaleString()} loaded</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* NFT Grid with virtualization for large collections */}
      {nfts.length > 100 ? (
        renderVirtualizedItems()
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'grid grid-cols-1 gap-4'
        }>
          <AnimatePresence mode="popLayout">
            {nfts.map((nft, index) => (
              <motion.div
                key={nft.id}
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
      )}
      
      {/* Load more trigger */}
      {hasMore && !progressiveLoadingStarted && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center items-center py-8"
        >
          <div className={`h-10 w-10 rounded-full border-2 border-t-transparent animate-spin`} 
            style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
        </div>
      )}
    </div>
  );
}
