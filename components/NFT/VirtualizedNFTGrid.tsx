import { useRef, useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AnimatedNFTCard from './AnimatedNFTCard';
import { fetchNFTsWithCursor } from '@/lib/api/nftService';
import { getChainColorTheme } from '@/lib/api/chainProviders';

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
  itemsPerPage = 24
}: VirtualizedNFTGridProps) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [visibleItemCount, setVisibleItemCount] = useState(itemsPerPage);
  const loadingMoreRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const chainTheme = getChainColorTheme(chainId);
  
  // Intersection observer for infinite loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '400px 0px', // Load more before user reaches bottom
  });
  
  // Load initial data
  const loadInitialData = useCallback(async () => {
    setInitialLoading(true);
    setLoading(true);
    setNfts([]);
    setNextCursor(undefined);
    setHasMore(true);
    setVisibleItemCount(itemsPerPage);
    
    try {
      const result = await fetchNFTsWithCursor(
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
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      setError(null);
    } catch (err) {
      setError('Failed to load NFTs. Please try again.');
      console.error('Error loading NFTs:', err);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [contractAddress, chainId, itemsPerPage, sortBy, sortDirection, searchQuery, attributes]);
  
  // Load more data when user scrolls
  const loadMoreData = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current || !hasMore) return;
    
    loadingMoreRef.current = true;
    setLoading(true);
    
    try {
      const result = await fetchNFTsWithCursor(
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
      setVisibleItemCount(prev => prev + itemsPerPage);
    } catch (err) {
      console.error('Error loading more NFTs:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoading(false);
    }
  }, [nextCursor, hasMore, contractAddress, chainId, itemsPerPage, sortBy, sortDirection, searchQuery, attributes]);
  
  // Load initial data on mount and when dependencies change
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Trigger load more when in view
  useEffect(() => {
    if (inView && !initialLoading && hasMore) {
      loadMoreData();
    }
  }, [inView, initialLoading, hasMore, loadMoreData]);
  
  // Handle window resize to recalculate visible items
  useEffect(() => {
    const handleResize = () => {
      // Recalculate visible items based on viewport
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const visibleRows = Math.ceil(viewportHeight / 300); // Estimate row height
        const itemsPerRow = viewMode === 'grid' ? 
          (window.innerWidth >= 1280 ? 4 : window.innerWidth >= 768 ? 3 : window.innerWidth >= 640 ? 2 : 1) : 1;
        
        const optimalVisibleItems = visibleRows * itemsPerRow * 2; // Double for buffer
        setVisibleItemCount(Math.max(optimalVisibleItems, itemsPerPage));
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, itemsPerPage]);
  
  // Empty state
  if (!initialLoading && nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50">
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
  
  return (
    <div ref={gridRef}>
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'grid grid-cols-1 gap-4'
      }>
        <AnimatePresence mode="popLayout">
          {nfts.slice(0, visibleItemCount).map((nft, index) => (
            <motion.div
              key={nft.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: Math.min(0.05 * (index % 12), 0.5) }}
            >
              <AnimatedNFTCard
                nft={{
                  ...nft,
                  chain: chainId
                }}
                index={index}
                onClick={() => onNFTClick && onNFTClick(nft)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Load more trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center items-center py-8"
        >
          <div className={`h-10 w-10 rounded-full border-2 border-t-transparent animate-spin`} 
            style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
        </div>
      )}
      
      {/* Collection stats */}
      <div className="text-center text-sm text-gray-400 mt-4">
        Showing {nfts.length} of {totalCount.toLocaleString()} items
      </div>
    </div>
  );
}
