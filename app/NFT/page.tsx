'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import NFTCard from '@/components/NFT/NFTCard';
import NFTTabs from '@/components/NFT/NFTTabs';
import Pagination from '@/components/NFT/Pagination';
import MintForm from '@/components/NFT/MintForm';
import WhitelistForm from '@/components/NFT/WhitelistForm';
import { useWallet } from '@/components/Faucet/walletcontext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NFTMarketStats from '@/components/NFT/NFTMarketStats';
import PriceChart from '@/components/NFT/PriceChart';
import { toast } from '@/hooks/use-toast';

// Contract addresses
const NFT_CONTRACT_ADDRESS = "0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551";
const PATH_TOKEN_ADDRESS = "0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE";
const ITEMS_PER_PAGE = 8;

// Updated ABI with whitelist functions
const NFT_ABI = [
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function getAllListings() external view returns (uint256[] memory)",
  "function listings(uint256) view returns (uint256 price, address seller, bool isListed)",
  "function buyNFT(uint256 tokenId) external",
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function unlistNFT(uint256 tokenId) external",
  "function mintNFT(address to, string memory tokenURI) external",
  "function owner() view returns (address)",
  "function updateWhitelist(address _account, bool _status) external",
  "function whitelist(address) view returns (bool)"
];

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider & {
      isMetaMask?: boolean;
      providers?: any[];
      request?: (request: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

interface NFTData {
  market: any[];
  owned: any[];
  listings: any[];
}

interface NFTMetadata {
  name: string;
  image: string;
  description?: string;
  [key: string]: any;
}

export default function NFTMarketplace() {
  const { account, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'market' | 'owned' | 'listings' | 'mint' | 'whitelist'>('market');
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pathBalance, setPathBalance] = useState<string>('0.0000');
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [nftData, setNftData] = useState<NFTData>({ 
    market: [], 
    owned: [], 
    listings: [] 
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Market statistics
  const [marketStats, setMarketStats] = useState({
    totalVolume: '12,450.35',
    dailyVolume: '1,245.62',
    avgPrice: '125.75',
    listedCount: 48,
    soldCount: 152,
    priceChange: 8.5
  });

  const isOwner = useMemo(() => 
    account?.toLowerCase() === ownerAddress.toLowerCase(),
    [account, ownerAddress]
  );

  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    throw new Error('Ethereum provider not found');
  };

  // Fetch contract owner
  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const provider = getProvider();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
        const owner = await contract.owner();
        setOwnerAddress(owner.toLowerCase());
      } catch (error) {
        console.error("Error fetching contract owner:", error);
      }
    };
    fetchOwner();
  }, []);

  // Check whitelist status
  const checkWhitelistStatus = useCallback(async (address: string) => {
    try {
      const provider = getProvider();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      return await contract.whitelist(address);
    } catch (error) {
      console.error("Error checking whitelist:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const checkUserWhitelist = async () => {
      if (account) {
        const status = await checkWhitelistStatus(account);
        setIsWhitelisted(status);
      }
    };
    checkUserWhitelist();
  }, [account, checkWhitelistStatus]);

  // Fetch PATH balance
  const fetchPathBalance = useCallback(async (address: string) => {
    try {
      const provider = getProvider();
      const tokenContract = new ethers.Contract(PATH_TOKEN_ADDRESS, TOKEN_ABI, provider);
      const balance = await tokenContract.balanceOf(address);
      setPathBalance(parseFloat(ethers.utils.formatUnits(balance, 18)).toFixed(4));
    } catch (error) {
      console.error("Error fetching PATH balance:", error);
    }
  }, []);

  // Fetch metadata with timeout and retry
  const fetchMetadata = async (uri: string, retries = 3): Promise<NFTMetadata> => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Metadata fetch timeout')), 5000)
    );

    for (let i = 0; i < retries; i++) {
      try {
        const response = await Promise.race([
          fetch(uri),
          timeout
        ]) as Response;

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.name || !data.image) {
          throw new Error('Invalid metadata format');
        }

        return data as NFTMetadata;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Failed to fetch metadata after retries');
  };

  // Fetch NFT data with improved error handling
  const fetchNFTs = useCallback(async () => {
    if (!account) return;

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);

      const listedIds = await contract.getAllListings().catch(() => []);
      
      // Market NFTs with improved error handling
      const marketNFTs = await Promise.allSettled(
        listedIds.map(async (id: ethers.BigNumber) => {
          try {
            const [uri, listing, owner] = await Promise.all([
              contract.tokenURI(id),
              contract.listings(id),
              contract.ownerOf(id).catch(() => '0x0')
            ]);

            const metadata = await fetchMetadata(uri);

            return {
              id: id.toString(),
              ...metadata,
              price: ethers.utils.formatUnits(listing.price, 18),
              seller: listing.seller,
              owner: owner,
              isListed: listing.isListed
            };
          } catch (error) {
            console.error(`Error processing NFT ${id}:`, error);
            return null;
          }
        })
      );

      // Owned NFTs with improved pagination
      const totalSupply = await contract.totalSupply().catch(() => ethers.BigNumber.from(0));
      const pageSize = 20; // Process in smaller chunks
      const allIds = Array.from({ length: totalSupply.toNumber() }, (_, i) => i);
      const ownedNFTs = [];

      for (let i = 0; i < allIds.length; i += pageSize) {
        const pageIds = allIds.slice(i, i + pageSize);
        const pageResults = await Promise.allSettled(
          pageIds.map(async (id) => {
            try {
              const [owner, listing] = await Promise.all([
                contract.ownerOf(id).catch(() => '0x0'),
                contract.listings(id)
              ]);
              
              if (owner.toLowerCase() === account.toLowerCase() && !listing.isListed) {
                const uri = await contract.tokenURI(id);
                const metadata = await fetchMetadata(uri);

                return {
                  id: id.toString(),
                  ...metadata,
                  owner: owner,
                  isListed: false
                };
              }
              return null;
            } catch (error) {
              console.error(`Error processing owned NFT ${id}:`, error);
              return null;
            }
          })
        );

        ownedNFTs.push(...pageResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => (result as PromiseFulfilledResult<any>).value)
        );
      }

      const validMarketNFTs = marketNFTs
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      setNftData({
        market: validMarketNFTs,
        owned: ownedNFTs,
        listings: validMarketNFTs.filter(nft => 
          nft.isListed && 
          nft.seller?.toLowerCase() === account.toLowerCase()
        )
      });
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch NFTs. Please try again later.",
        variant: "destructive"
      });
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      fetchNFTs();
      const interval = setInterval(fetchNFTs, 15000);
      return () => clearInterval(interval);
    }
  }, [account, fetchNFTs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (account) {
      fetchPathBalance(account);
    }
  }, [account, fetchPathBalance]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (activeTab === 'mint' || activeTab === 'whitelist') return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return nftData[activeTab].slice(start, end);
  }, [nftData, activeTab, currentPage]);
  
  const totalPages = useMemo(() => {
    if (activeTab === 'mint' || activeTab === 'whitelist') return 0;
    return Math.ceil(nftData[activeTab].length / ITEMS_PER_PAGE);
  }, [nftData, activeTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Refresh data
  const refreshData = async () => {
    await fetchNFTs();
    if (account) await fetchPathBalance(account);
  };

  // Handle mint NFT
  const handleMintNFT = async (recipient: string, tokenURI: string) => {
    if (!account) return; // Nếu không có tài khoản, thoát
    if (!isOwner && !isWhitelisted) { // Nếu không phải owner và không whitelist, báo lỗi
        toast({
            title: "Error",
            description: "You are not authorized to mint NFTs",
            variant: "destructive"
        });
        return;
    }
    setProcessing(true);
    try {
        const provider = getProvider();
        const signer = provider.getSigner();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
        
        await fetchMetadata(tokenURI); // Xác thực URI trước khi mint
        const tx = await contract.mintNFT(recipient, tokenURI);
        await tx.wait();
        await refreshData();
        toast({
            title: "Success",
            description: "NFT minted successfully!",
            variant: "default"
        });
    } catch (error) {
        console.error("Minting failed:", error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Mint failed",
            variant: "destructive"
        });
    } finally {
        setProcessing(false);
    }
  };

  // Handle buy NFT
  const handleBuyNFT = async (tokenId: string, price: string) => {
    if (!account) {
      alert("Please connect wallet!");
      return;
    }

    setProcessing(true);
    try {
      const provider = getProvider();
      const signer = provider.getSigner();
      
      // Approve token
      const tokenContract = new ethers.Contract(PATH_TOKEN_ADDRESS, TOKEN_ABI, signer);
      const requiredAllowance = ethers.utils.parseUnits(price, 18);
      const currentAllowance = await tokenContract.allowance(account, NFT_CONTRACT_ADDRESS);

      if (currentAllowance.lt(requiredAllowance)) {
        const tx = await tokenContract.approve(NFT_CONTRACT_ADDRESS, ethers.constants.MaxUint256);
        await tx.wait();
      }

      // Execute buy
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const tx = await nftContract.buyNFT(tokenId, { gasLimit: 500000 });
      await tx.wait();
      
      await refreshData();
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Transaction failed! Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle list NFT
  const handleListNFT = async (tokenId: string, price: string) => {
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect wallet first!",
        variant: "destructive"
      });
      return;
    }
  
    setProcessing(true);
    try {
      const provider = getProvider();
      const signer = provider.getSigner();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
    
      // Validate ownership
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error("You are not the owner");
      }
    
      const tx = await contract.listNFT(
        tokenId, 
        ethers.utils.parseUnits(price, 18)
      );
      await tx.wait();
      await refreshData();
      toast({
        title: "Success",
        description: "NFT listed successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error("Listing failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle unlist NFT
  const handleUnlistNFT = async (tokenId: string) => {
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect wallet first!",
        variant: "destructive"
      });
      return;
    }
  
    setProcessing(true);
    try {
      const provider = getProvider();
      const signer = provider.getSigner();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
    
      // Validate seller
      const listing = await contract.listings(tokenId);
      if (listing.seller.toLowerCase() !== account.toLowerCase()) {
        throw new Error("You are not the seller");
      }
    
      // Execute unlist
      const tx = await contract.unlistNFT(tokenId);
      await tx.wait();
      await refreshData();
      toast({
        title: "Success",
        description: "NFT unlisted successfully!",
        variant: "default"
      });
    } catch (error: unknown) {
      console.error("Unlisting failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred during unlisting",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle update whitelist
  const handleUpdateWhitelist = async (address: string, status: boolean) => {
    if (!account || !isOwner) return;

    try {
      setProcessing(true);
      const provider = getProvider();
      const signer = provider.getSigner();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      
      const tx = await contract.updateWhitelist(address, status);
      await tx.wait();
      toast({
        title: "Success",
        description: "Whitelist updated successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error("Whitelist update failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Update failed",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative text-white font-exo2">
      <div className="mb-6">
        <p className="text-gray-400">Trade exclusive NFTs in the PATH ecosystem using PATH tokens</p>
      </div>
      
      {/* Market Statistics */}
      <NFTMarketStats {...marketStats} />
      
      {/* Price Chart */}
      <div className="mb-8">
        <PriceChart data={[]} />
      </div>
      
      {/* Tabs Navigation */}
      <NFTTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        balances={{
          market: nftData.market.length,
          owned: nftData.owned.length,
          listings: nftData.listings.length
        }}
        showMintTab={isWhitelisted || isOwner}
        showWhitelistTab={isOwner}
      />

      {!account ? (
        <div className="text-center py-20 text-gray-400">
          Please connect your wallet to view NFTs
        </div>
      ) : (
        <>
          {isInitialLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="animate-pulse bg-black rounded-xl h-[500px] shadow-lg"
                />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'mint' ? (
                <Card className="bg-black/50 border border-orange-400/20 mt-6">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Mint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MintForm 
                      onSubmit={handleMintNFT}
                      processing={processing}
                      checkWhitelist={checkWhitelistStatus}
                    />
                  </CardContent>
                </Card>
              ) : activeTab === 'whitelist' ? (
                <Card className="bg-black/50 border border-orange-400/20 mt-6">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Whitelist Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WhitelistForm 
                      onSubmit={handleUpdateWhitelist} 
                      isOwner={isOwner}
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {paginatedData.map((nft, index) => (
                      <div 
                        key={nft.id}
                        className="animate-fade-in-right"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <NFTCard
                          nft={nft}
                          mode={activeTab === 'listings' ? 'listing' : activeTab}
                          onAction={ 
                            activeTab === 'market' 
                              ? (tokenId, price) => handleBuyNFT(tokenId, price || '0') 
                              : activeTab === 'owned' 
                              ? (tokenId, price) => handleListNFT(tokenId, price || '0') 
                              : handleUnlistNFT
                          }
                          processing={processing}
                        />
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {processing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-black/90 p-8 rounded-2xl text-center border border-orange-400/20 shadow-xl">
            <div className="animate-spin h-12 w-12 border-4 border-orange-400 border-t-transparent rounded-full mb-4 mx-auto" />
            <h3 className="text-xl text-white mb-2 font-semibold">Processing Transaction</h3>
            <div className="flex items-center justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="animate-float h-3 w-3 bg-orange-400 rounded-full"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
