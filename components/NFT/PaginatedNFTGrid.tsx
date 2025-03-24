import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
        
        setNfts(result.nfts);
        // Fix: Use totalCount consistently instead of totalItems
        setTotalPages(result.totalPages || Math.ceil(result.totalCount / itemsPerPage));
        setTotalItems(result.totalCount);
        
        // Log for debugging
        console.log(`Loaded page ${currentPage} with ${result.nfts.length} NFTs. Total: ${result.totalCount}`);
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
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
    
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
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
  };
  
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
                {/* Custom Previous Button with better visibility */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`h-9 w-9 ${chainTheme.borderClass} ${
                    currentPage === 1 ? 'opacity-50' : 'hover:bg-gray-800'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {renderPaginationItems()}
                
                {/* Custom Next Button with better visibility */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`h-9 w-9 ${chainTheme.borderClass} ${
                    currentPage === totalPages ? 'opacity-50' : 'hover:bg-gray-800'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationContent>
            </Pagination>
          </div>
          
          {/* Page indicator for small screens */}
          <div className="text-center text-sm text-gray-500 md:hidden">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedNFTGrid;