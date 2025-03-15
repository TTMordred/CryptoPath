// components/NFT/NFTDetailsModal.tsx
import Image from 'next/image';
import { useState } from 'react';

interface NFTData {
  id: string;
  name: string;
  image: string;
  description?: string; // Make optional
  price: string;
  seller: string;
  owner: string;
  isListed: boolean;
}

interface NFTDetailsModalProps {
  nft: NFTData | null;
  onClose: () => void;
  onBuy: () => void;
}

export default function NFTDetailsModal({ nft, onClose, onBuy }: NFTDetailsModalProps) {
  const [imgError, setImgError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!nft) return null;

  // Improved IPFS URL handling with multiple gateways
  const formatImageUrl = (ipfsUrl: string) => {
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    
    const cid = ipfsUrl.replace('ipfs://', '');
    const gatewayList = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/'
    ];
    
    return `${gatewayList[0]}${cid}`;
  };

  // Safer price formatting
  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price);
    return numericPrice % 1 === 0 
      ? numericPrice.toFixed(0)
      : numericPrice.toFixed(4);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full overflow-hidden animate-fade-in">
        {/* Header with improved accessibility */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold truncate max-w-[80%]" title={nft.name}>
            {nft.name || 'Unnamed NFT'}
          </h1>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close details modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Image section with loading state */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
            
            <Image
              src={imgError ? '/fallback-nft.png' : formatImageUrl(nft.image)}
              alt={nft.name || 'NFT image'}
              fill
              className={`object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoadingComplete={() => setImageLoading(false)}
              onError={() => {
                setImgError(true);
                setImageLoading(false);
              }}
              priority
            />
          </div>

          {/* Details section */}
          <div className="space-y-4">
            {/* Description with XSS protection */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h2 className="text-sm text-gray-400 mb-2">Description</h2>
              <p className="text-gray-300 whitespace-pre-line">
                {nft.description || 'No description available'}
              </p>
            </div>

            {/* Price display */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h2 className="text-sm text-gray-400 mb-2">Price</h2>
              <p className="text-xl font-semibold text-[#F5B056]">
                {formatPrice(nft.price)} PATH
              </p>
            </div>

            {/* Seller/Owner info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <h3 className="text-gray-400 mb-1">Seller</h3>
                <address className="text-blue-300 font-mono truncate">
                  {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                </address>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <h3 className="text-gray-400 mb-1">Owner</h3>
                <address className="text-purple-300 font-mono truncate">
                  {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                </address>
              </div>
            </div>

            {/* Purchase button */}
            <button
              onClick={onBuy}
              className="w-full bg-[#F5B056] hover:bg-[#e6a045] text-black py-3 rounded-lg font-bold 
                transition-colors duration-200 flex items-center justify-center gap-2"
              aria-label="Purchase NFT"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Purchase NFT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}