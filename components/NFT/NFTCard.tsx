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
  onAction: (tokenId: string, price?: string) => void;
  processing?: boolean;
}

export default function NFTCard({ nft, mode, onAction, processing }: NFTCardProps) {
  const { account } = useWallet();
  const [showListForm, setShowListForm] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  // Helper to format the price (removes trailing zeros like 23.0000 -> 23)
  const formatPrice = (price: string) => parseFloat(price).toString();

  // Check if the current wallet address is the seller
  useEffect(() => {
    const sellerMatch = nft.seller?.toLowerCase() === account?.toLowerCase();
    setIsSeller(!!sellerMatch);
  }, [account, nft.seller]);

  // Convert ipfs:// URL to a gateway URL
  const formatImageUrl = (ipfsUrl?: string) => {
    if (!ipfsUrl) return '/fallback-nft.png';
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    const cid = ipfsUrl.replace('ipfs://', '').split('/')[0];
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  // Render the appropriate action button with solid color styling
  const getActionButton = () => {
    if (processing) {
      return (
        <button
          disabled
          className="w-full bg-gray-600 text-gray-300 py-2.5 rounded-xl flex items-center justify-center gap-2 focus:outline-none"
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
                : 'bg-green-600 hover:bg-green-700'
            } text-white py-2.5 rounded-xl transition-all focus:outline-none`}
            disabled={isSeller}
          >
            {isSeller ? 'Your Listing' : `Buy for ${formatPrice(nft.price || '0')} PATH`}
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-all focus:outline-none"
          >
            List for Sale
          </button>
        );

      case 'listing':
        return isSeller ? (
          <button
            onClick={() => onAction(nft.id)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition-all focus:outline-none"
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
    <div
      className="
        group relative
        bg-white/5 
        rounded-[10px]
        border border-gray-800
        backdrop-blur-[4px]
        overflow-hidden
        shadow-md
        hover:shadow-xl
        transition-all
        duration-300
        w-full
      "
    >
      {/* Image section */}
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

      {/* Info section */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white truncate mb-2">
          {nft.name || 'Unnamed NFT'}
        </h3>

        <div className="mb-3">
          <p className="text-gray-300 text-sm">
            Price:{' '}
            <span className="text-green-400 font-semibold">
              {mode === 'owned' && !nft.isListed ? (
                'Not Listed'
              ) : (
                <>
                  {formatPrice(nft.price || '0')}
                  <span className="text-xs ml-1">PATH</span>
                </>
              )}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {nft.seller && (
            <div>
              <span className="text-gray-400">Seller: </span>
              <span
                className="text-blue-300 font-mono text-xs truncate"
                title={nft.seller}
              >
                {`${nft.seller.slice(0, 6)}...${nft.seller.slice(-4)}`}
              </span>
            </div>
          )}

          {nft.owner && (
            <div className="col-span-2">
              <span className="text-gray-400">Owner: </span>
              <span
                className="text-purple-400 font-mono text-xs truncate"
                title={nft.owner}
              >
                {`${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`}
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="mb-2">{getActionButton()}</div>

        {/* Badge if listed */}
        {mode === 'owned' && nft.isListed && (
          <div className="text-center text-yellow-400 py-1 text-sm border border-yellow-400/20 rounded-md animate-pulse">
            Currently Listed
          </div>
        )}
      </div>
    </div>
  );
}
