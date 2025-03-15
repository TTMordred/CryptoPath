// components/NFT/WhitelistForm.tsx
import { useState } from 'react';
import { utils } from 'ethers';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface WhitelistFormProps {
  onSubmit: (address: string, status: boolean) => Promise<void>;
  isOwner: boolean;
}

export default function WhitelistForm({ onSubmit, isOwner }: WhitelistFormProps) {
  const [address, setAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);

  const isValidAddress = (addr: string) => utils.isAddress(addr);

  const handleSubmit = async (status: boolean) => {
    if (!isValidAddress(address)) return;
    
    setProcessing(true);
    setStatus(null);
    try {
      await onSubmit(address, status);
      setStatus('success');
      setAddress('');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="space-y-6 p-8 bg-gray-900/80 rounded-xl border-2 border-orange-400/30 shadow-xl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-orange-400">Whitelist Management</h2>
        <p className="text-sm text-gray-400">Owner only: Add/remove addresses from whitelist</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Wallet Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl
                     focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 
                     transition-all placeholder-gray-500 text-white font-mono text-sm"
          />
          {!isValidAddress(address) && address !== '' && (
            <p className="text-red-400 text-sm">⚠ Invalid address format</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleSubmit(true)}
            disabled={processing || !isValidAddress(address)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold
                      bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            {processing ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            Add to Whitelist
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={processing || !isValidAddress(address)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold
                      bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            {processing ? <Loader2 className="animate-spin" /> : <XCircle />}
            Remove from Whitelist
          </button>
        </div>

        {status === 'success' && (
          <p className="text-green-400 text-center">✓ Operation successful!</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-center">⚠ Operation failed</p>
        )}
      </div>
    </div>
  );
}