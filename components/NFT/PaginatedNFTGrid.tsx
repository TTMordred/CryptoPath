import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { fetchCollectionNFTs } from '@/lib/api/alchemyNFTApi';
import { fetchPaginatedNFTs } from '@/lib/api/nftService';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import { CollectionNFT } from '@/lib/api/alchemyNFTApi';
import AnimatedNFTCard from './AnimatedNFTCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatedNFTGridProps {
  contractAddress: string;
  chainId: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  attributes: Record<string, string[]>;
  viewMode: 'grid' | 'list';
  onNFTClick: (nft: CollectionNFT) => void;
  itemsPerPage?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
}

export default function PaginatedNFTGrid({
  contractAddress,
  chainId,
  sortBy,
  sortDirection,
  searchQuery,
  attributes,
  viewMode,
  onNFTClick,
  itemsPerPage = 20,
  defaultPage = 1,
  onPageChange
}: PaginatedNFTGridProps) {
  const [nfts, setNfts] = useState<CollectionNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(0);
  
  // Chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  useEffect(() => {
    loadNFTs();
  }, [contractAddress, chainId, currentPage, sortBy, sortDirection, searchQuery, JSON.stringify(attributes)]);
  
  async function loadNFTs() {
    setLoading(true);
    setProgress(10);
    
    try {
      // Use the cached and optimized fetching function
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
      setTotalCount(result.totalCount);
      
      // Calculate total pages
      const pages = Math.max(1, Math.ceil(result.totalCount / itemsPerPage));
      setTotalPages(pages);
      
      setProgress(100);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setNfts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };
  
  // Simple pagination controls helper
  const getPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(1);
    
    // Calculate range around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      items.push('ellipsis1');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      items.push('ellipsis2');
    }
    
    // Add last page if more than one page
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  };
  
  return (
    <div className="space-y-6">
      {/* Loading indicator or NFT grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: chainTheme.primary }} />
          <div className="text-sm text-gray-400">Loading NFTs...</div>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mt-4 bg-gray-700 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                background: chainTheme.primary
              }}
            />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${contractAddress}-${chainId}-${currentPage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {nfts.length === 0 ? (
              <div className="text-center py-12 border border-gray-800 rounded-lg bg-black/30">
                <p className="text-gray-400 mb-2">No NFTs found for this collection.</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
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
                  {nfts.map((nft, index) => (
                    <AnimatedNFTCard
                      key={`${nft.id}-${chainId}`}
                      nft={nft}
                      index={index}
                      onClick={() => onNFTClick(nft)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    handlePageChange(currentPage - 1);
                  }
                }}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
            
            {getPaginationItems().map((page, i) => {
              if (typeof page === 'string') {
                // Render ellipsis
                return (
                  <PaginationItem key={page}>
                    <span className="px-2">...</span>
                  </PaginationItem>
                );
              }
              
              // Render page number
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                    isActive={page === currentPage}
                    style={
                      page === currentPage 
                        ? { backgroundColor: chainTheme.primary, color: 'black' }
                        : undefined
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    handlePageChange(currentPage + 1);
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
      
      {/* Total count indicator */}
      {totalCount > 0 && (
        <div className="text-center text-sm text-gray-400 mt-2">
          Showing page {currentPage} of {totalPages} ({totalCount} total NFTs)
        </div>
      )}
    </div>
  );
}
