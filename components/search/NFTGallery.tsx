"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Copy, Check, ExternalLink, AlertTriangle, EyeOff } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { handleImageError, getDevImageProps } from "@/utils/imageUtils"

interface NFT {
  tokenID: string
  tokenName: string
  tokenSymbol: string
  contractAddress: string
  imageUrl?: string
}

interface NFTResponse {
  nfts: NFT[]
  totalCount: number
  pageKey?: string | null
  error?: string
}

// Utility to truncate long strings
const truncateString = (str: string, startChars = 6, endChars = 4) => {
  if (!str) return "";
  if (str.length <= startChars + endChars) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
};

// Enhanced utility to handle and format token IDs correctly
const formatTokenId = (tokenId: string) => {
  if (!tokenId) return "Unknown ID";
  
  // Remove leading zeros for display if the ID is in hex format
  if (tokenId.startsWith('0x')) {
    // Convert to BigInt to handle large numbers correctly
    try {
      const bigIntValue = BigInt(tokenId);
      // If the value is actually zero, return 0x0
      if (bigIntValue === BigInt(0)) return "0x0";
      // Otherwise return the hex representation without extra leading zeros
      return '0x' + bigIntValue.toString(16);
    } catch (e) {
      // If conversion fails, return the original
      return tokenId;
    }
  }
  
  return tokenId;
};

// Detect potential spam NFTs
const isPotentialSpam = (nft: NFT): boolean => {
  // Common patterns in spam NFT names
  const spamPatterns = [
    /visit.*website/i,
    /claim.*rewards/i,
    /.+\.org/i,
    /.+\.net/i,
    /airdrop/i,
    /^get.+/i,
    /free/i
  ];
  
  // Check name against spam patterns
  if (nft.tokenName && spamPatterns.some(pattern => pattern.test(nft.tokenName))) {
    return true;
  }
  
  // Check if token ID is suspiciously simple like "0x00"
  if (nft.tokenID === "0x00" || nft.tokenID === "0x0" || nft.tokenID === "0") {
    return true;
  }
  
  return false;
};

export default function NFTGallery() {
  const searchParams = useSearchParams()
  const address = (searchParams as ReturnType<typeof useSearchParams>)?.get("address") ?? null
  const [nfts, setNFTs] = useState<NFT[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [pageKeys, setPageKeys] = useState<(string | null)[]>([null])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const nftsPerPage = 15  // Changed from 20 to 15 NFTs per page
  
  // Modal state
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Copy feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Copy to clipboard function with visual feedback
  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(identifier);
      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    });
  };

  const fetchNFTs = async (page: number, pageKey?: string | null) => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/nfts?address=${address}&limit=${nftsPerPage}${pageKey ? `&pageKey=${pageKey}` : ''}`)
      const data: NFTResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setNFTs(data.nfts)
      setTotalCount(data.totalCount)

      setPageKeys(prev => {
        const newPageKeys = [...prev]
        newPageKeys[page] = data.pageKey || null
        return newPageKeys
      })
    } catch (err) {
      console.error("Error fetching NFTs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch NFTs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    setPageKeys([null])
    fetchNFTs(1, null)
  }, [address])

  const markImageAsError = (nftId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [nftId]: true
    }))
  }

  const totalPages = Math.ceil(totalCount / nftsPerPage)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      fetchNFTs(newPage, pageKeys[newPage - 1])
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && pageKeys[currentPage]) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      fetchNFTs(newPage, pageKeys[currentPage])
    }
  }
  
  // Handler for opening the detail modal
  const openNftDetails = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  // Add filter for spam NFTs
  const [hideSpamNFTs, setHideSpamNFTs] = useState<boolean>(true);
  const [filteredNFTs, setFilteredNFTs] = useState<NFT[]>([]);

  useEffect(() => {
    // Filter NFTs when the spam filter changes or when nfts array changes
    if (hideSpamNFTs) {
      setFilteredNFTs(nfts.filter(nft => !isPotentialSpam(nft)));
    } else {
      setFilteredNFTs(nfts);
    }
  }, [nfts, hideSpamNFTs]);

  if (!address) {
    return null
  }

  if (loading) {
    return (
      <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-8 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-amber-500/20">
        <CardContent>
          <p className="text-center text-red-400 font-medium">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (nfts.length === 0) {
    return (
      <Card className="mt-8 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-400">NFT Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-400">No NFTs found for this address.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold text-amber-400">NFT Gallery</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="hide-spam" className="text-sm text-gray-400">Hide Potential Spam</Label>
            <Switch
              id="hide-spam"
              checked={hideSpamNFTs}
              onCheckedChange={setHideSpamNFTs}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          {hideSpamNFTs && nfts.length > filteredNFTs.length && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <p className="text-sm text-amber-100">
                {nfts.length - filteredNFTs.length} potential spam NFTs are hidden. 
                <Button variant="link" className="px-1 h-auto text-amber-400" onClick={() => setHideSpamNFTs(false)}>
                  Show all
                </Button>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredNFTs.map((nft) => {
              const nftId = `${nft.contractAddress}-${nft.tokenID}`;
              const formattedTokenId = formatTokenId(nft.tokenID);
              const truncatedTokenId = truncateString(formattedTokenId, 6, 4);
              const isSpam = isPotentialSpam(nft);

              return (
                <Card 
                  key={nftId} 
                  className={cn(
                    "group bg-gray-900/80 border border-amber-500/30 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 ease-out transform hover:-translate-y-2 cursor-pointer",
                    isSpam && !hideSpamNFTs && "border-red-500/30 bg-gray-900/90"
                  )}
                  onClick={() => openNftDetails(nft)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-gray-800 mb-3">
                      {imageErrors[nftId] || !nft.imageUrl ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-400">
                          <div className="text-center p-4">
                            <p className="font-medium text-amber-400 text-sm line-clamp-2">{nft.tokenName || "NFT"}</p>
                            <p className="text-xs mt-1 text-gray-400">#{truncatedTokenId}</p>
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={nft.imageUrl || "/images/nft-placeholder.png"}
                          alt={nft.tokenName || `NFT #${formattedTokenId}`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(event) => {
                            markImageAsError(nftId);
                            handleImageError(event);
                          }}
                          {...getDevImageProps()} // Add development mode props
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {isSpam && !hideSpamNFTs && (
                        <Badge className="absolute top-2 right-2 bg-red-600/90 text-white text-xs">
                          Potential Spam
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-white truncate line-clamp-1 flex-1">{nft.tokenName || "Unnamed NFT"}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="truncate">#{truncatedTokenId}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-1" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(nft.tokenID, `tokenId-${nft.tokenID}`);
                                }}
                              >
                                {copiedText === `tokenId-${nft.tokenID}` ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <Copy className="h-3 w-3 text-amber-400" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedText === `tokenId-${nft.tokenID}` ? "Copied!" : "Copy token ID"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredNFTs.length === 0 && (
            <div className="text-center py-10">
              {hideSpamNFTs && nfts.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <EyeOff className="h-12 w-12 text-amber-500/50 mb-2" />
                  <p className="text-gray-400">All NFTs were filtered as potential spam</p>
                  <Button 
                    variant="outline"
                    className="mt-2 border-amber-500 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => setHideSpamNFTs(false)}
                  >
                    Show All NFTs
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400">No NFTs found for this address.</p>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:shadow-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 ease-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || !pageKeys[currentPage]}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:shadow-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 ease-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-gray-800 border border-amber-500/20 text-white">
          {selectedNft && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-amber-400">
                  {selectedNft.tokenName || "Unnamed NFT"}
                  {isPotentialSpam(selectedNft) && (
                    <Badge className="ml-2 bg-red-600/90 text-white text-xs">Potential Spam</Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedNft.tokenSymbol && (
                    <span className="mr-2">{selectedNft.tokenSymbol}</span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {isPotentialSpam(selectedNft) && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 mb-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200">
                      This NFT contains patterns commonly associated with spam or phishing attempts. 
                      Be cautious with any links or claims for rewards.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid gap-4">
                <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-gray-700 mb-3">
                  {selectedNft.imageUrl && !imageErrors[`${selectedNft.contractAddress}-${selectedNft.tokenID}`] ? (
                    <Image
                      src={selectedNft.imageUrl}
                      alt={selectedNft.tokenName || `NFT #${formatTokenId(selectedNft.tokenID)}`}
                      fill
                      className="object-contain"
                      onError={(event) => {
                        markImageAsError(`${selectedNft.contractAddress}-${selectedNft.tokenID}`);
                        handleImageError(event);
                      }}
                      {...getDevImageProps()} // Add development mode props
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-300">
                      <div className="text-center">
                        <p className="font-medium text-amber-400">{selectedNft.tokenName || "NFT"}</p>
                        <p className="text-xs mt-2 text-gray-400">#{formatTokenId(selectedNft.tokenID)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-amber-400 mb-1">Token ID</p>
                    <div className="flex items-center justify-between bg-gray-900 p-2 rounded overflow-hidden">
                      <p className="text-sm text-gray-300 truncate pr-2" title={selectedNft.tokenID}>
                        {formatTokenId(selectedNft.tokenID)}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8" 
                        onClick={() => copyToClipboard(selectedNft.tokenID, `modal-tokenId`)}
                      >
                        {copiedText === `modal-tokenId` ? 
                          <Check className="h-4 w-4 text-green-500" /> : 
                          <Copy className="h-4 w-4 text-amber-400" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-amber-400 mb-1">Contract Address</p>
                    <div className="flex items-center justify-between bg-gray-900 p-2 rounded overflow-hidden">
                      <p className="text-sm text-gray-300 truncate pr-2" title={selectedNft.contractAddress}>
                        {selectedNft.contractAddress}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8" 
                        onClick={() => copyToClipboard(selectedNft.contractAddress, `modal-contract`)}
                      >
                        {copiedText === `modal-contract` ? 
                          <Check className="h-4 w-4 text-green-500" /> : 
                          <Copy className="h-4 w-4 text-amber-400" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-center">
                    <Button 
                      variant="outline"
                      className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => window.open(`https://etherscan.io/token/${selectedNft.contractAddress}?a=${selectedNft.tokenID}`, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Etherscan
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}