// components/NFT/NFTDetailsModal.tsx
import Image from 'next/image';

interface NFTData {
  id: string;
  name: string;
  image: string;
  description: string;
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
  if (!nft) return null;

  // Xử lý URL ảnh IPFS
  const formatImageUrl = (ipfsUrl: string) => {
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    const cid = ipfsUrl.replace('ipfs://', '').split('/')[0];
    return `https://ipfs.io/ipfs/${cid}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold truncate max-w-[80%]" title={nft.name}>
            {nft.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Image Container */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
            <Image
              src={formatImageUrl(nft.image)}
              alt={nft.name}
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/fallback-nft.png';
              }}
            />
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Description */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Description</h3>
              <p className="text-gray-300 whitespace-pre-line">
                {nft.description || 'No description available'}
              </p>
            </div>

            {/* Price */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Price</h3>
              <p className="text-xl font-semibold text-[#F5B056]">
                {parseFloat(nft.price).toFixed(4)} PATH
              </p>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <h3 className="text-gray-400 mb-1">Seller</h3>
                <p className="text-blue-300 font-mono truncate" title={nft.seller}>
                  {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                </p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <h3 className="text-gray-400 mb-1">Owner</h3>
                <p className="text-purple-300 font-mono truncate" title={nft.owner}>
                  {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                </p>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={onBuy}
              className="w-full bg-[#F5B056] hover:bg-[#e6a045] text-black py-3 rounded-lg font-bold 
                transition-colors duration-200 flex items-center justify-center gap-2"
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