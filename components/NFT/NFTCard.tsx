// components/NFT/NFTCard.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ListForm from './ListForm';
import { useWallet } from '@/components/Faucet/walletcontext';

interface NFTCardProps {
  nft: {
    id: string;
    name?: string;
    image?: string;
    price?: string;
    seller?: string;
    owner?: string;
    isListed?: boolean;
  };
  mode: 'market' | 'owned' | 'listing';
  onAction: (tokenId: string, price?: string) => void; // Thêm optional param
  processing?: boolean;
}

export default function NFTCard({ nft, mode, onAction, processing }: NFTCardProps) {
  const { account } = useWallet();
  const [showListForm, setShowListForm] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  // Theo dõi thay đổi account và seller
  useEffect(() => {
    const checkSeller = () => {
      const sellerMatch = nft.seller?.toLowerCase() === account?.toLowerCase();
      setIsSeller(!!sellerMatch); // Thêm ép kiểu boolean
    };
    checkSeller();
  }, [account, nft.seller]);

  // Xử lý URL ảnh từ IPFS
  const formatImageUrl = (ipfsUrl?: string) => {
    if (!ipfsUrl) return '/fallback-nft.png';
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    const cid = ipfsUrl.replace('ipfs://', '').split('/')[0];
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  // Hiển thị nút hành động
  const getActionButton = () => {
    if (processing) {
      return (
        <button
          disabled
          className="w-full bg-gray-600 text-gray-400 py-2.5 rounded-lg flex items-center justify-center gap-2"
        >
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          Processing...
        </button>
      );
    }

    switch (mode) {
      case 'market':
        return (
          <button
            onClick={() => onAction(nft.id, nft.price)}
            className={`w-full ${
              isSeller 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            } text-white py-2.5 rounded-lg transition-all`}
            disabled={isSeller}
          >
            {isSeller ? 'Your Listing' : `Buy for ${parseFloat(nft.price || '0').toFixed(4)} PATH`}
          </button>
        );

      case 'owned':
        if (showListForm) {
          return (
            <ListForm
              onSubmit={(price) => {
                onAction(nft.id, price);
                setShowListForm(false);
              }}
              onCancel={() => setShowListForm(false)}
            />
          );
        }
        return (
          <button
            onClick={() => setShowListForm(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-lg transition-all"
          >
            List for Sale
          </button>
        );

      case 'listing':
        return isSeller ? (
          <button
            onClick={() => onAction(nft.id)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 rounded-lg transition-all"
            data-testid="cancel-listing-button"
          >
            Cancel Listing
          </button>
        ) : (
          <div className="text-center text-gray-400 py-2">
            Listed by another seller
          </div>
        );
    }
  };

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 w-full">
      {/* Phần hình ảnh */}
      <div className="relative aspect-square">
        <Image
          src={imgError ? '/fallback-nft.png' : formatImageUrl(nft.image)}
          alt={nft.name || 'Unnamed NFT'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
          quality={85}
          priority
        />
      </div>

      {/* Phần thông tin */}
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white truncate">
          {nft.name || 'Unnamed NFT'}
        </h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <span className="text-gray-400">Price</span>
            <div className="text-green-400 font-medium">
              {mode === 'owned' && !nft.isListed ? (
                'Not Listed'
              ) : (
                <>
                  {parseFloat(nft.price || '0').toFixed(4)}
                  <span className="text-xs ml-1">PATH</span>
                </>
              )}
            </div>
          </div>

          {nft.seller && (
            <div className="space-y-1">
              <span className="text-gray-400">Seller</span>
              <span 
                className="text-blue-300 font-mono text-xs truncate"
                title={nft.seller}
              >
                {`${nft.seller.slice(0, 6)}...${nft.seller.slice(-4)}`}
              </span>
            </div>
          )}

          {nft.owner && (
            <div className="col-span-2 space-y-1">
              <span className="text-gray-400">Owner</span>
              <span 
                className="text-purple-300 font-mono text-xs truncate"
                title={nft.owner}
              >
                {`${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`}
              </span>
            </div>
          )}
        </div>

        {/* Nút hành động */}
        {getActionButton()}

        {/* Badge trạng thái */}
        {mode === 'owned' && nft.isListed && (
          <div className="text-center text-yellow-400 py-1.5 text-sm border border-yellow-400/20 rounded-md animate-pulse">
            Currently Listed
          </div>
        )}
      </div>
    </div>
  );
}
