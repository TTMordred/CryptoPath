"use client";
import React, { useState } from "react";
import { Image, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface NFT {
  name: string;
  collectionName: string;
  description: string;
  tokenId: string;
  contract: string;
  imageUrl?: string;
}

interface NFTsCardProps {
  nfts: NFT[];
  isLoading: boolean;
}

const NFTsCard: React.FC<NFTsCardProps> = ({ nfts, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const nftsPerPage = 2;

  const indexOfLastNFT = currentPage * nftsPerPage;
  const indexOfFirstNFT = indexOfLastNFT - nftsPerPage;
  const currentNFTs = nfts.slice(indexOfFirstNFT, indexOfLastNFT);
  const totalPages = Math.ceil(nfts.length / nftsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNFTClick = (nft: NFT) => {
    setSelectedNFT(nft);
  };

  const closeModal = () => {
    setSelectedNFT(null);
  };

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="h-5 w-5 text-amber" aria-hidden="true" />
          </div>
          <h3 className="text-gray-300 font-medium">NFT Collection</h3>
        </div>
        {nfts.length > 0 && (
          <div className="text-xs text-gray-400">
            {indexOfFirstNFT + 1}-{Math.min(indexOfLastNFT, nfts.length)} of{" "}
            {nfts.length}
          </div>
        )}
      </div>

      <div className="space-y-4 min-h-[300px]">
        {isLoading ? (
          [...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-shark-600/50" />
          ))
        ) : nfts.length > 0 ? (
          currentNFTs.map((nft, index) => (
            <div
              key={index}
              className="flex p-3 border border-[#f6b355] rounded-[20px] hover:border-amber/30 transition-all duration-300 bg-shark-800/30 items-center cursor-pointer"
              onClick={() => handleNFTClick(nft)}
            >
              <div className="h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-shark-600 relative">
                {nft.imageUrl ? (
                  <img
                    src={nft.imageUrl}
                    alt={nft.name || `NFT ${nft.tokenId}`}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const placeholder = target.nextSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = "flex";
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-shark-700 text-shark-400">
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{ animation: "shimmer 2s infinite" }}
                />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h4 className="text-gray-200 font-medium text-sm truncate">
                  {nft.name || `#${nft.tokenId}`}
                </h4>
                <p className="text-amber text-xs mb-1 truncate">
                  {nft.collectionName || "Unknown Collection"}
                </p>
                <p className="text-gray-400 text-xs line-clamp-2">
                  {nft.description || "No description available"}
                </p>
                <p className="text-gray-500 text-xs mt-1 truncate">
                  Token ID: {nft.tokenId}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="h-12 w-12 text-shark-400 mb-4" aria-hidden="true" />
            <p className="text-shark-300 text-center">
              No NFTs found for this wallet
            </p>
          </div>
        )}
      </div>

      {nfts.length > nftsPerPage && (
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="text-gray-400 border-[#f6b355] rounded-[20px] hover:text-amber hover:border-amber/40 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="text-gray-400 border-[#f6b355] rounded-[20px] hover:text-amber hover:border-amber/40 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {selectedNFT && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
          <div className="backdrop-blur-md bg-white/10 p-6 max-w-md w-full h-[calc(100%-40px)] border border-shark-600 shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent scrollbar-thumb-rounded-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-200 text-lg font-medium">NFT Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="text-gray-400 hover:text-amber"
              >
                <X className="h-6 w-6" strokeWidth={3} />
              </Button>
            </div>
            <div className="flex flex-col items-center">
              {selectedNFT.imageUrl ? (
                <img
                  src={selectedNFT.imageUrl}
                  alt={selectedNFT.name || `NFT ${selectedNFT.tokenId}`}
                  className="w-full max-h-64 object-contain rounded-md mb-4"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const placeholder = target.nextSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = "flex";
                  }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-shark-700 text-shark-400 rounded-md mb-4">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-12 w-12" aria-hidden="true" />
                </div>
              )}
              <div className="w-full text-left">
                <h4 className="text-gray-200 font-medium text-lg">
                  {selectedNFT.name || `#${selectedNFT.tokenId}`}
                </h4>
                <p className="text-amber text-sm mb-2">
                  {selectedNFT.collectionName || "Unknown Collection"}
                </p>
                <p className="text-gray-400 text-sm mb-2">
                  {selectedNFT.description || "No description available"}
                </p>
                <p className="text-gray-500 text-sm">
                  <span className="font-medium">Token ID:</span>{" "}
                  {selectedNFT.tokenId}
                </p>
                <p className="text-gray-500 text-sm truncate">
                  <span className="font-medium">Contract:</span>{" "}
                  {selectedNFT.contract}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTsCard;