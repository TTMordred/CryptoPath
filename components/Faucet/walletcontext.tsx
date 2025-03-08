// context/WalletContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  account: string | null;
  connectWallet: (options?: { force?: boolean }) => Promise<void>;
  disconnectWallet: () => void;
  balance: string;
  updateBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');

  const connectWallet = async (options?: { force?: boolean }) => {
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask!');

      // Reset cache nếu force connection
      if (options?.force) {
        localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
        if (window.ethereum.providers) {
          window.ethereum.providers = [];
        }
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
        params: options?.force ? [{ force: true }] : undefined
      });

      setAccount(accounts[0]);
      localStorage.setItem('currentUser', JSON.stringify({
        walletAddress: accounts[0],
        lastConnected: Date.now()
      }));
      await updateBalance();
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    // Reset tất cả state
    setAccount(null);
    setBalance('0');

    // Xóa localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');

    // Ngắt kết nối provider
    if (window.ethereum?.disconnect) {
      window.ethereum.disconnect();
    }

    // Reset MetaMask provider cache
    if (window.ethereum?.providers) {
      window.ethereum.providers = [];
    }

    // Kích hoạt sự kiện toàn cục
    window.dispatchEvent(new Event('walletDisconnected'));
  };

  const updateBalance = async () => {
    if (!account) return;
    
    try {
      const response = await fetch(`/api/wallet?address=${account}`);
      const data = await response.json();
      setBalance(data.balance || '0');
    } catch (error) {
      console.error('Balance update error:', error);
      setBalance('0');
    }
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnectWallet();
      else setAccount(accounts[0]);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    const initWallet = async () => {
      try {
        const storedAccount = localStorage.getItem('currentUser');
        if (storedAccount) {
          const { walletAddress, lastConnected } = JSON.parse(storedAccount);
          
          // Tự động disconnect sau 24h
          if (Date.now() - lastConnected > 86400000) {
            disconnectWallet();
            return;
          }

          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts[0] === walletAddress) {
            setAccount(walletAddress);
            await updateBalance();
          }
        }
      } catch (error) {
        console.error('Init error:', error);
        disconnectWallet();
      }
    };

    if (window.ethereum) {
      initWallet();
      
      // Thêm event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.addEventListener('walletDisconnected', disconnectWallet);

      // Cleanup
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
        window.removeEventListener('walletDisconnected', disconnectWallet);
      };
    }
  }, []);

  return (
    <WalletContext.Provider value={{ 
      account,
      connectWallet,
      disconnectWallet,
      balance,
      updateBalance
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);