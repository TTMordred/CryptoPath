import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchPaginatedNFTs } from '@/lib/api/nftService';
import AnimatedNFTCard from './AnimatedNFTCard';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  defaultPage?: number;
  onPageChange?: (page: number) => void;
}

const PaginatedNFTGrid: React.FC<PaginatedNFTGridProps> = ({
  contractAddress,
  chainId,
  searchQuery = '',
  sortBy = 'tokenId',
  sortDirection = 'asc',
  attributes = {},
  viewMode = 'grid',
  onNFTClick,
  itemsPerPage = 20,
  defaultPage = 1,
  onPageChange
}) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const [pageHistory, setPageHistory] = useState<{[key: number]: boolean}>({});
  
  const { toast } = useToast();
  
  // Get theme colors based on chain
  const chainTheme = getChainColorTheme(chainId);
  
  // Load NFTs when parameters change
  useEffect(() => {
    const loadNFTs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchPaginatedNFTs(
          contractAddress,
          chainId,
          currentPage,
          itemsPerPage,
          sortBy,
          sortDirection,
          searchQuery,
          attributes
        );
        
        // Check if this is the last page based on NFT count
        const isEmptyPage = result.nfts.length === 0;
        const isPartialPage = result.nfts.length < itemsPerPage;
        const calculatedLastPage = isEmptyPage || isPartialPage;
        
        setNfts(result.nfts);
        setTotalPages(result.totalPages || Math.ceil(result.totalCount / itemsPerPage));
        setTotalItems(result.totalCount);
        setIsLastPage(calculatedLastPage);
        
        // Record this page in history to optimize navigation
        setPageHistory(prev => ({...prev, [currentPage]: true}));
        
        // Log for debugging
        console.log(`Loaded page ${currentPage} with ${result.nfts.length} NFTs. Total: ${result.totalCount}`);
        console.log(`Is last page: ${calculatedLastPage}, Total pages: ${result.totalPages}`);
      } catch (err) {
        console.error('Error loading NFTs:', err);
        setError('Failed to load NFTs. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load NFTs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadNFTs();
  }, [
    contractAddress,
    chainId,
    currentPage,
    itemsPerPage,
    sortBy,
    sortDirection,
    searchQuery,
    JSON.stringify(attributes),
    toast
  ]);
  
  // Handle page change with improved boundary logic
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || (isLastPage && page > currentPage) || page === currentPage) return;
    
    // Allow going to next page even if we haven't calculated total pages yet
    // This handles collections where we don't know the exact total
    if (page > totalPages && !pageHistory[page] && !isLastPage) {
      // Allow exploration to continue
      console.log("Exploring beyond known pages:", page);
    } else if (page > totalPages) {
      console.log("Attempted to go beyond last page:", page);
      return;
    }
    
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
    
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, totalPages, isLastPage, pageHistory, onPageChange]);
  
  // Generate pagination items with enhanced logic
  const renderPaginationItems = useCallback(() => {
    const items = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Add first page if not included
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
            className={currentPage === i ? chainTheme.backgroundClass : ''}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add last page if not included
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  }, [currentPage, totalPages, chainTheme, handlePageChange]);
  
  // Handle NFT click
  const handleNFTClick = (nft: NFT) => {
    if (onNFTClick) {
      onNFTClick(nft);
    }
  };
  
  // Calculate item range for display
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className="space-y-6">
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: chainTheme.primary }} />
        </div>
      )}
      
      {/* Error message */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center p-8 border border-red-800 rounded-lg bg-red-900/20">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* NFT Grid */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            : "grid grid-cols-1 gap-4"
          }
        >
          {nfts.length > 0 ? (
            nfts.map((nft, index) => (
              <AnimatedNFTCard
                key={nft.id}
                nft={nft}
                onClick={() => handleNFTClick(nft)}
                index={index}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 border border-gray-800 rounded-lg bg-black/30">
              <p className="text-gray-400">No NFTs found for this collection.</p>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Enhanced Pagination Controls - Always visible when we have items */}
      {!loading && nfts.length > 0 && (
        <div className="space-y-4">
          {/* Items count info - Now above pagination for better visibility */}
          <div className="text-center text-sm text-gray-400 mb-4">
            {totalItems > 0 ? (
              <>Showing {startItem}-{endItem} of {totalItems.toLocaleString()} items</>
            ) : (
              <>No items to display</>
            )}
          </div>
        
          <div className="flex justify-center items-center">
            <Pagination>
              <PaginationContent className="flex gap-1">
                {/* Enhanced Previous Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`h-9 w-9 ${chainTheme.borderClass} ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {renderPaginationItems()}
                
                {/* Enhanced Next Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={isLastPage}
                  className={`h-9 w-9 ${chainTheme.borderClass} ${
                    isLastPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationContent>
            </Pagination>
          </div>
          
          {/* Page indicator for small screens */}
          <div className="text-center text-sm text-gray-500 md:hidden">
            Page {currentPage} of {totalPages}
            {isLastPage ? " (Last Page)" : ""}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedNFTGrid;