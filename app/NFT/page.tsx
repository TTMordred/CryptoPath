'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import NFTCard from '@/components/NFT/NFTCard';
import NFTTabs from '@/components/NFT/NFTTabs';
import Pagination from '@/components/NFT/Pagination';
import { useWallet } from '@/components/Faucet/walletcontext';

// Contract addresses
const NFT_CONTRACT_ADDRESS = "0x279Bd9304152E0349427c4B7F35FffFD439edcFa";
const PATH_TOKEN_ADDRESS = "0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE";
const ITEMS_PER_PAGE = 8;

// ABI definitions
const NFT_ABI = [
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function getAllListings() external view returns (uint256[] memory)",
  "function listings(uint256) view returns (uint256 price, address seller, bool isListed)",
  "function buyNFT(uint256 tokenId) external",
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function unlistNFT(uint256 tokenId) external"
];

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

// Ethereum provider type declaration
declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider & {
      isMetaMask?: boolean;
      providers?: any[];
      request?: (request: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export default function NFTMarketplace() {
  const { account, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'market' | 'owned' | 'listings'>('market');
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pathBalance, setPathBalance] = useState<string>('0.0000');
  const [nftData, setNftData] = useState<{
    market: any[];
    owned: any[];
    listings: any[];
  }>({ market: [], owned: [], listings: [] });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Ethereum provider handler
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    throw new Error('Ethereum provider not found');
  };

  // Fetch PATH balance
  const fetchPathBalance = useCallback(async (account: string) => {
    try {
      const provider = getProvider();
      const tokenContract = new ethers.Contract(PATH_TOKEN_ADDRESS, TOKEN_ABI, provider);
      const balance = await tokenContract.balanceOf(account);
      setPathBalance(parseFloat(ethers.utils.formatUnits(balance, 18)).toFixed(4));
    } catch (error) {
      console.error("Error fetching PATH balance:", error);
    }
  }, []);

  // Fetch NFT data
  const fetchNFTs = useCallback(async () => {
    if (!account) return;

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);

      // Get listed NFTs
      const listedIds = await contract.getAllListings().catch(() => []);

      // Process market NFTs
      const marketNFTs = await Promise.all(
        listedIds.map(async (id: ethers.BigNumber) => {
          try {
            const [uri, listing, owner] = await Promise.all([
              contract.tokenURI(id),
              contract.listings(id),
              contract.ownerOf(id).catch(() => '0x0')
            ]);

            const metadata = await fetch(uri.toString()).then(res => res.json());
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

      // Get owned NFTs
      const totalSupply = await contract.totalSupply().catch(() => ethers.BigNumber.from(0));
      const allIds = Array.from({ length: totalSupply.toNumber() }, (_, i) => i);

      const ownedNFTs = await Promise.all(
        allIds.map(async (id) => {
          try {
            const [owner, listing] = await Promise.all([
              contract.ownerOf(id).catch(() => '0x0'),
              contract.listings(id)
            ]);

            if (owner.toLowerCase() === account.toLowerCase() && !listing.isListed) {
              const uri = await contract.tokenURI(id);
              const metadata = await fetch(uri.toString()).then(res => res.json());
              return {
                id: id.toString(),
                ...metadata,
                owner: owner,
                isListed: false
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        })
      );

      // Update state
      setNftData({
        market: marketNFTs.filter(nft => nft !== null),
        owned: ownedNFTs.filter(nft => nft !== null),
        listings: marketNFTs.filter(nft => 
          nft !== null && 
          nft.isListed &&
          nft.seller?.toLowerCase() === account.toLowerCase()
        )
      });

      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    }
  }, [account]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return nftData[activeTab].slice(start, end);
  }, [nftData, activeTab, currentPage]);

  const totalPages = useMemo(() => 
    Math.ceil(nftData[activeTab].length / ITEMS_PER_PAGE), 
    [nftData, activeTab]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Refresh data after transactions
  const refreshData = async () => {
    await fetchNFTs();
    if (account) await fetchPathBalance(account);
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
      alert("Please connect wallet first!");
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
    } catch (error) {
      console.error("Listing failed:", error);
      alert(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle unlist NFT
  const handleUnlistNFT = async (tokenId: string) => {
    if (!account) {
      alert("Please connect wallet first!");
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
    } catch (error: unknown) {
      console.error("Unlisting failed:", error);
      alert(
        error instanceof Error 
          ? error.message 
          : "Unknown error occurred during unlisting"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Effects
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

  return (
    <div className="min-h-screen bg-gray-900 p-6 lg:p-8 relative overflow-hidden">
      {/* Background effects */}

      <header className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          NFT Marketplace
        </h1>
        <div className="flex items-center gap-4">
          {account && (
            <div className="hidden sm:flex items-center px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 backdrop-blur-xs">
              <span className="text-orange-400 font-mono font-medium tracking-tight">
                {pathBalance}
              </span>
              <span className="text-gray-300 ml-2 font-medium">PATH</span>
            </div>
          )}
          <button
            onClick={() => {
              if (!account) {
                if (!window.ethereum) {
                  alert('Please install MetaMask!');
                  return;
                }
                connectWallet();
              }
            }}
            className="px-6 py-2 bg-orange-500/90 hover:bg-orange-600 rounded-xl transition-all text-sm lg:text-base 
              shadow-lg hover:shadow-orange-500/20"
          >
            {account ? 
              `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 
              'Connect Wallet'
            }
          </button>
        </div>
      </header>

      <NFTTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        balances={{
          market: nftData.market.length,
          owned: nftData.owned.length,
          listings: nftData.listings.length
        }}
      />

      {!account ? (
        <div className="text-center py-20 text-gray-400 animate-fade-in">
          Please connect your wallet to view NFTs
        </div>
      ) : (
        <>
          {isInitialLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="animate-pulse bg-gray-800 rounded-xl h-[500px] shadow-lg"
                />
              ))}
            </div>
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
                        activeTab === 'market' ? (tokenId, price) => handleBuyNFT(tokenId, price || '0') :
                        activeTab === 'owned' ? (tokenId, price) => handleListNFT(tokenId, price || '0') :
                        handleUnlistNFT
                      }
                      processing={processing}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 animate-scale-up">
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

      {processing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-800/90 p-8 rounded-2xl text-center border border-orange-400/20 shadow-xl">
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