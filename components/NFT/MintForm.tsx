import { useState, useEffect } from 'react';
import { utils } from 'ethers';
import { Loader2, CloudUpload, Wallet } from 'lucide-react';

interface MintFormProps {
  onSubmit: (recipient: string, tokenURI: string) => void;
  processing?: boolean;
  checkWhitelist: (address: string) => Promise<boolean>;
}

export default function MintForm({ 
  onSubmit, 
  processing,
  checkWhitelist 
}: MintFormProps) {
  const [tokenURI, setTokenURI] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  // Validate Ethereum address
  const isValidAddress = (address: string) => utils.isAddress(address);

  // Validate IPFS/HTTP URI
  const isValidURI = (uri: string) => uri.startsWith('ipfs://') || uri.startsWith('https://');

  // Check whitelist status when recipient changes
  useEffect(() => {
    const verifyWhitelist = async () => {
      if (isValidAddress(recipient)) {
        const status = await checkWhitelist(recipient);
        setIsWhitelisted(status);
      } else {
        setIsWhitelisted(false);
      }
    };
    verifyWhitelist();
  }, [recipient, checkWhitelist]);

  // Combined disable conditions - remove !isWhitelisted since tab is already hidden for non-whitelisted users
  const isDisabled = processing || 
                    !isValidAddress(recipient) || 
                    !isValidURI(tokenURI);

  // Get button state - remove whitelist check since user must be whitelisted to see this form
  const getButtonState = () => {
    if (processing) return {
      disabled: true,
      className: 'bg-gray-700 cursor-not-allowed text-gray-400'
    };
    if (!isValidAddress(recipient) || !isValidURI(tokenURI)) return {
      disabled: true,
      className: 'bg-gray-700 cursor-not-allowed text-gray-400'
    };
    return {
      disabled: false,
      className: 'bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-orange-400/20'
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="space-y-6 p-8 bg-gray-900/80 rounded-xl border-2 border-orange-400/30 shadow-xl">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-orange-400">
          <CloudUpload className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Mint</h2>
        </div>
        <p className="text-sm text-gray-400">
          Only whitelisted addresses can mint NFTs
        </p>
      </div>

      {/* IPFS Guidance Section */}
      <div className="space-y-3">
        <div className="text-sm text-gray-400 space-y-2">
          <p>1. Upload your metadata to IPFS using:</p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://pinata.cloud/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-orange-300 flex items-center gap-2"
            >
              <img 
                src="/pinata-logo.svg" 
                className="w-4 h-4" 
                alt="Pinata Cloud Logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              Pinata Cloud
            </a>
            <a
              href="https://nft.storage/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-purple-300 flex items-center gap-2"
            >
              <img
                src="/nft-storage-logo.svg"
                className="w-4 h-4"
                alt="NFT.Storage Logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              NFT.Storage
            </a>
          </div>
          <p>2. Paste the IPFS CID or full URI below</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        {/* Recipient Address Input */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <Wallet className="w-4 h-4" />
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl
                     focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 
                     transition-all placeholder-gray-500 text-white font-mono text-sm"
          />
          {!isValidAddress(recipient) && recipient !== '' && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              ⚠ Invalid BSC address
            </p>
            )}  
        </div>

        {/* Metadata URI Input */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Metadata URI</label>
          <input
            type="text"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://Qm... or https://"
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl
                     focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 
                     transition-all placeholder-gray-500 text-white text-sm"
          />
          {!isValidURI(tokenURI) && tokenURI !== '' && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              ⚠ URI must start with ipfs:// or https://
            </p>
          )}
        </div>
      </div>

      {/* Mint Button */}
      <button
        onClick={() => onSubmit(recipient, tokenURI)}
        disabled={buttonState.disabled}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${buttonState.className}`}
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Minting...
          </>
        ) : (
          <>
            <CloudUpload className="w-5 h-5" />
            Mint NFT
          </>
        )}
      </button>

      {/* Metadata Example */}
      <div className="text-xs text-gray-500 mt-4">
        <p>Example metadata format:</p>
        <pre className="mt-2 p-3 bg-gray-800 rounded-lg overflow-x-auto text-sm">
          <code className="text-orange-200">
            {`{
  "name": "CryptoPunk #9999",
  "description": "A rare digital artifact",
  "image": "ipfs://Qm...",
  "attributes": [
    {"trait_type": "Rarity", "value": "Legendary"},
    {"trait_type": "Collection", "value": "CryptoPath Genesis"}
  ]
}`}
          </code>
        </pre>
      </div>
    </div>
  );
}
