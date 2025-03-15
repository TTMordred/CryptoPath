import { useState } from 'react';
import { Loader2, CloudUpload } from 'lucide-react';

interface MintFormProps {
  onSubmit: (tokenURI: string) => void;
  processing?: boolean;
}

export default function MintForm({ onSubmit, processing }: MintFormProps) {
  const [tokenURI, setTokenURI] = useState('');

  return (
    <div className="space-y-4 p-6 bg-gray-900/50 rounded-xl border border-orange-400/20">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
          <CloudUpload className="w-5 h-5" />
          Mint New NFT
        </h3>
        
        <div className="text-sm text-gray-400 space-y-2">
          <p>1. Upload your metadata to IPFS using:</p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://pinata.cloud/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors text-orange-300"
            >
              Pinata Cloud
            </a>
            <a
              href="https://nft.storage/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors text-purple-300"
            >
              NFT.Storage
            </a>
          </div>
          <p>2. Paste the IPFS CID or full URI below</p>
        </div>
      </div>

      <input
        type="text"
        value={tokenURI}
        onChange={(e) => setTokenURI(e.target.value)}
        placeholder="ipfs://Qm... or https://ipfs.io/ipfs/Qm..."
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
                 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 
                 transition-all placeholder-gray-500 text-white"
      />

      <button
        onClick={() => onSubmit(tokenURI)}
        disabled={processing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all
          ${processing 
            ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
            : 'bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white'
          }`}
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Minting...
          </>
        ) : (
          'Mint NFT'
        )}
      </button>

      <p className="text-xs text-gray-400 mt-4">
        Example metadata format: 
        <pre className="mt-2 p-3 bg-gray-800 rounded-md overflow-x-auto text-sm">
    <code className="text-orange-200">
      {`{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "ipfs://Qm...",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Common/Rare/Unique/.."
    },
    {
      "trait_type": "Collection",
      "value": "CryptoPath Genesis"
    },
    {
      "trait_type": "Artist", 
      "value": "Your Name"
    }
  ]
}`}
    </code>
  </pre>
</p>
    </div>
  );
}