import { useState, useEffect } from 'react';
import { utils } from 'ethers';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhitelistFormProps {
  onSubmit: (address: string, status: boolean) => Promise<void>;
  isOwner: boolean;
}

interface Transaction {
  address: string;
  status: boolean;
  timestamp: number;
}

export default function WhitelistForm({ onSubmit, isOwner }: WhitelistFormProps) {
  const [address, setAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previousTransactions, setPreviousTransactions] = useState<Transaction[]>([]);

  // Load previous transactions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whitelistTransactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreviousTransactions(parsed);
      } catch (error) {
        console.error('Failed to parse saved transactions:', error);
      }
    }
  }, []);

  // Save transactions to localStorage
  const saveTransaction = (address: string, status: boolean) => {
    const transaction = {
      address,
      status,
      timestamp: Date.now()
    };
    const newTransactions = [transaction, ...previousTransactions].slice(0, 10); // Keep last 10
    setPreviousTransactions(newTransactions);
    localStorage.setItem('whitelistTransactions', JSON.stringify(newTransactions));
  };

  const isValidAddress = (addr: string) => utils.isAddress(addr);

  const handleSubmit = async (newStatus: boolean) => {
    if (!isValidAddress(address)) {
      setErrorMessage('Invalid address format');
      return;
    }
    
    setProcessing(true);
    setStatus(null);
    setErrorMessage('');

    try {
      await onSubmit(address, newStatus);
      setStatus('success');
      saveTransaction(address, newStatus);
      toast({
        title: 'Success',
        description: `Address ${newStatus ? 'added to' : 'removed from'} whitelist`,
        variant: 'default'
      });
      setAddress('');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Operation failed');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Operation failed',
        variant: 'destructive'
      });
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
            className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-xl
                     transition-all placeholder-gray-500 text-white font-mono text-sm
                     ${
                       errorMessage
                         ? 'border-red-500 focus:ring-red-500/20'
                         : 'border-gray-700 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20'
                     }`}
          />
          {!isValidAddress(address) && address !== '' && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Invalid address format
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleSubmit(true)}
            disabled={processing || !isValidAddress(address)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold
                      ${
                        processing || !isValidAddress(address)
                          ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Add to Whitelist
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={processing || !isValidAddress(address)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold
                      ${
                        processing || !isValidAddress(address)
                          ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                          : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white'
                      }`}
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            Remove from Whitelist
          </button>
        </div>

        {status === 'success' && (
          <p className="text-green-400 text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Operation successful!
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </p>
        )}

        {/* Recent Transactions */}
        {previousTransactions.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-lg font-semibold text-gray-300">Recent Transactions</h3>
            <div className="space-y-2">
              {previousTransactions.map((tx, index) => (
                <div
                  key={`${tx.address}-${tx.timestamp}`}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    {tx.status ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="font-mono text-gray-300">
                      {tx.address.slice(0, 6)}...{tx.address.slice(-4)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}