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
  const [validatingURI, setValidatingURI] = useState(false);
  const [uriError, setUriError] = useState<string | null>(null);

  // Validate Ethereum address
  const isValidAddress = (address: string) => utils.isAddress(address);

  // Validate metadata format
  const validateMetadata = async (uri: string): Promise<boolean> => {
    try {
      setValidatingURI(true);
      setUriError(null);

      if (!uri.startsWith('ipfs://') && !uri.startsWith('https://')) {
        setUriError('URI must start with ipfs:// or https://');
        return false;
      }

      // For IPFS URIs, only validate the format
      if (uri.startsWith('ipfs://')) {
        const cid = uri.replace('ipfs://', '').split('/')[0];
        if (!cid || cid.length < 32) {
          setUriError('Invalid IPFS CID format');
          return false;
        }
        return true;
      }

      // For HTTP URIs, validate the metadata format
      const response = await fetch(uri);
      if (!response.ok) {
        setUriError('Failed to fetch metadata');
        return false;
      }

      const metadata = await response.json();
      if (!metadata.name || typeof metadata.name !== 'string') {
        setUriError('Metadata must include a name property');
        return false;
      }
      if (!metadata.image || typeof metadata.image !== 'string') {
        setUriError('Metadata must include an image property');
        return false;
      }
      if (!metadata.image.startsWith('ipfs://') && !metadata.image.startsWith('https://')) {
        setUriError('Image URI must start with ipfs:// or https://');
        return false;
      }

      return true;
    } catch (error) {
      setUriError(error instanceof Error ? error.message : 'Invalid metadata format');
      return false;
    } finally {
      setValidatingURI(false);
    }
  };

  // Validate URI when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenURI) {
        validateMetadata(tokenURI);
      } else {
        setUriError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tokenURI]);

  // Check whitelist status when recipient changes
  useEffect(() => {
    const verifyWhitelist = async () => {
      if (isValidAddress(recipient)) {
        try {
          const status = await checkWhitelist(recipient);
          setIsWhitelisted(status);
        } catch (error) {
          console.error('Failed to check whitelist status:', error);
          setIsWhitelisted(false);
        }
      } else {
        setIsWhitelisted(false);
      }
    };

    if (recipient) {
      verifyWhitelist();
    }
  }, [recipient, checkWhitelist]);

  // Combined disable conditions
  const isDisabled = processing || 
                    !isValidAddress(recipient) || 
                    validatingURI ||
                    !!uriError ||
                    !tokenURI;

  const handleSubmit = async () => {
    if (await validateMetadata(tokenURI)) {
      onSubmit(recipient, tokenURI);
    }
  };

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
            className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-xl
                      transition-all placeholder-gray-500 text-white font-mono text-sm
                      ${!isValidAddress(recipient) && recipient 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-700 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20'
                      }`}
          />
          {!isValidAddress(recipient) && recipient && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              ⚠ Invalid BSC address
            </p>
          )}
          {isValidAddress(recipient) && !isWhitelisted && (
            <p className="text-yellow-400 text-sm flex items-center gap-1">
              ⚠ Address is not whitelisted
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
            className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-xl
                      transition-all placeholder-gray-500 text-white text-sm
                      ${uriError
                        ? 'border-red-500 focus:ring-red-500/20'
                        : 'border-gray-700 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20'
                      }`}
          />
          {validatingURI && (
            <p className="text-blue-400 text-sm flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Validating metadata...
            </p>
          )}
          {uriError && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              ⚠ {uriError}
            </p>
          )}
        </div>
      </div>

      {/* Mint Button */}
      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all
          ${
            isDisabled
              ? 'bg-gray-700 cursor-not-allowed text-gray-400'
              : 'bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-orange-400/20'
          }`}
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