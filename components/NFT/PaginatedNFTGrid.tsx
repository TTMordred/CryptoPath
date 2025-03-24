import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import AnimatedNFTCard from './AnimatedNFTCard';
import { Button } from '@/components/ui/button';
import { fetchPaginatedNFTs, clearCollectionCache } from '@/lib/api/nftService';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
}

interface PaginatedNFTGridProps {
  contractAddress: string;
  chainId: string;
  searchQuery?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  attributes?: Record<string, string[]>;
  viewMode?: 'grid' | 'list';
  onNFTClick?: (nft: NFT) => void;
  itemsPerPage?: number;
  maxDisplayedPages?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
}

export default function PaginatedNFTGrid({
  contractAddress,
  chainId,
  searchQuery = '',
  sortBy = 'tokenId',
  sortDirection = 'asc',
  attributes = {},
  viewMode = 'grid',
  onNFTClick,
  itemsPerPage = 20,
  maxDisplayedPages = 5,
  defaultPage = 1,
  onPageChange
}: PaginatedNFTGridProps) {
  // State
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  
  // Chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  // Load NFTs for the current page
  const loadNFTs = useCallback(async (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages;
    
    setIsLoading(true);
    setError(null);
    
    try {
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
      
      setNfts(result.nfts);
      setTotalCount(result.totalCount);
      setIsLoading(false);
      
      // Call onPageChange callback if provided
      if (onPageChange) {
        onPageChange(page);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setError('Failed to load NFTs. Please try again.');
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load NFTs. Please try again.',
        variant: 'destructive',
      });
    }
  }, [
    contractAddress, 
    chainId, 
    itemsPerPage, 
    sortBy, 
    sortDirection, 
    searchQuery, 
    attributes, 
    totalPages,
    onPageChange,
    toast
  ]);
  
  // Initial load and when dependencies change
  useEffect(() => {
    loadNFTs(currentPage);
  }, [
    contractAddress,
    chainId,
    searchQuery,
    sortBy,
    sortDirection,
    JSON.stringify(attributes),
    itemsPerPage,
    currentPage,
    loadNFTs
  ]);
  
  // Handle page change
  const handlePageChange = async (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Handle NFT click
  const handleNFTClick = (nft: NFT) => {
    if (onNFTClick) onNFTClick(nft);
  };
  
  // Refresh data - useful if data is stale
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Clear collection cache and reload
    clearCollectionCache(contractAddress, chainId);
    
    await loadNFTs(currentPage);
    setIsRefreshing(false);
    
    toast({
      title: 'Refreshed',
      description: 'NFT data has been refreshed.',
    });
  };
  
  // Generate array of pages to display
  const getPageNumbers = () => {
    const totalPagesToShow = Math.min(maxDisplayedPages, totalPages);
    const halfPagesToShow = Math.floor(totalPagesToShow / 2);
    
    let startPage = Math.max(1, currentPage - halfPagesToShow);
    const endPage = Math.min(totalPages, startPage + totalPagesToShow - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  // Pagination pages to show
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="space-y-6">
      {/* NFT Grid */}
      <div>
        {isLoading ? (
          // Loading state with skeleton placeholders
          <div className={`grid ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
              : 'grid-cols-1 gap-4'
          }`}>
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-xl overflow-hidden">
                <Skeleton className={`aspect-square w-full ${viewMode === 'list' ? 'h-20' : ''}`} />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Loaded state with NFTs
          <>
            {nfts.length > 0 ? (
              <motion.div
                className={`grid ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                    : 'grid-cols-1 gap-4'
                }`}
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                <AnimatePresence>
                  {nfts.map((nft, index) => (
                    <motion.div key={nft.id || `nft-${index}`}>
                      <AnimatedNFTCard
                        nft={nft}
                        onClick={() => handleNFTClick(nft)}
                        index={index}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-400 text-center">
                  {searchQuery || Object.keys(attributes).length > 0
                    ? 'No NFTs match your current filters. Try adjusting your search or filters.'
                    : 'No NFTs found in this collection.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-md">
          <p className="text-red-300">{error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => loadNFTs(currentPage)}
          >
            Try Again
          </Button>
        </div>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-400">
            Showing page {currentPage} of {totalPages}
            {!isLoading && (
              <span className="ml-1">
                ({((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="h-9 w-9"
            ></Button>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      color: chainTheme.primary
                    }}
                  />
                </PaginationItem>
                
                {currentPage > 3 && totalPages > maxDisplayedPages && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(1)}
                        className="cursor-pointer"
                        style={{
                          color: 1 === currentPage ? chainTheme.primary : undefined,
                          borderColor: 1 === currentPage ? chainTheme.primary : undefined
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {pageNumbers.map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === currentPage}
                      className="cursor-pointer"
                      style={{
                        color: page === currentPage ? chainTheme.primary : undefined,
                        borderColor: page === currentPage ? chainTheme.primary : undefined,
                        backgroundColor: page === currentPage ? `${chainTheme.backgroundClass}` : undefined
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                {currentPage < totalPages - 2 && totalPages > maxDisplayedPages && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        className="cursor-pointer"
                        style={{
                          color: totalPages === currentPage ? chainTheme.primary : undefined,
                          borderColor: totalPages === currentPage ? chainTheme.primary : undefined
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      color: chainTheme.primary
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
