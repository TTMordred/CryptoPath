"use client";
import React, { useState } from "react";
import { Image, ChevronRight, ChevronLeft } from "lucide-react";
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

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            <Image className="h-5 w-5 text-amber" aria-label="NFT icon" />
          </div>
          <h3 className="text-gray-300 font-medium">NFT Collection</h3>
        </div>
        {nfts.length > 0 && (
          <div className="text-xs text-gray-400">
            {indexOfFirstNFT + 1}-{Math.min(indexOfLastNFT, nfts.length)} of {nfts.length}
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
              className="flex p-3 border border-shark-600 rounded-lg hover:border-amber/30 transition-all duration-300 bg-shark-800/30"
            >
              <div className="h-24 w-24 rounded-md overflow-hidden bg-shark-600 relative">
                {nft.imageUrl ? (
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement | null;
                      if (target) {
                        target.style.display = "none";
                        const nextSibling = target.nextSibling as HTMLElement | null;
                        if (nextSibling) {
                          nextSibling.style.display = "block";
                        }
                      }
                    }}
                    
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-shark-700 text-shark-400">
                    <Image className="h-8 w-8" aria-label="NFT placeholder" />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{ animation: "shimmer 2s infinite" }}
                />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-gray-200 font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                  {nft.name || `#${nft.tokenId}`}
                </h4>
                <p className="text-amber text-xs mb-2">{nft.collectionName || "Unknown Collection"}</p>
                <p
                  className="text-gray-400 text-xs overflow-hidden"
                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                >
                  {nft.description || "No description available"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Token ID: {nft.tokenId.length > 8 ? `${nft.tokenId.substring(0, 8)}...` : nft.tokenId}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <Image className="h-12 w-12 text-shark-400 mb-4" aria-label="No NFTs found" />
            <p className="text-shark-300 text-center">No NFTs found for this wallet</p>
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
            className="text-gray-400 border-shark-600 hover:text-amber hover:border-amber/40 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="text-gray-400 border-shark-600 hover:text-amber hover:border-amber/40 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NFTsCard;