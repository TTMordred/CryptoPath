// context/WalletContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Contract Addresses và ABI
const WBNB_ADDRESS = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
const PATH_ADDRESS = '0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE';

const WBNB_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function deposit() payable',
  'function withdraw(uint256 wad)'
];

const PATH_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

interface WalletContextType {
  account: string | null;
  connectWallet: (options?: { force?: boolean }) => Promise<void>;
  disconnectWallet: () => void;
  tbnbBalance: string;
  wbnbBalance: string;
  pathBalance: string;
  stakedBalance: string;
  pendingRewards: string;
  updateStakingInfo: () => Promise<void>;
  updateBalances: () => Promise<void>;
  updateWbnbBalance: () => Promise<void>;
  updatePathBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [tbnbBalance, setTbnbBalance] = useState('0');
  const [wbnbBalance, setWbnbBalance] = useState('0');
  const [pathBalance, setPathBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');

  const getProvider = () => new ethers.providers.Web3Provider(window.ethereum);

  // Kết nối ví
  const connectWallet = async (options?: { force?: boolean }) => {
    try {
      if (!window.ethereum) throw new Error('Vui lòng cài đặt MetaMask!');

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
      
      await updateAllBalances();
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      throw error;
    }
  };

  // Ngắt kết nối ví
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setTbnbBalance('0');
    setWbnbBalance('0');
    setPathBalance('0');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
    
    if (window.ethereum?.disconnect) {
      window.ethereum.disconnect();
    }
    
    window.dispatchEvent(new Event('walletDisconnected'));
  }, []);

  // Cập nhật toàn bộ số dư
  const updateAllBalances = useCallback(async () => {
    if (!account) return;
    
    try {
      const provider = getProvider();
      
      // Cập nhật tBNB
      const nativeBalance = await provider.getBalance(account);
      setTbnbBalance(ethers.utils.formatEther(nativeBalance));

      // Cập nhật WBNB
      const wbnbContract = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);
      const wbnbBal = await wbnbContract.balanceOf(account);
      setWbnbBalance(ethers.utils.formatEther(wbnbBal));

      // Cập nhật PATH
      const pathContract = new ethers.Contract(PATH_ADDRESS, PATH_ABI, provider);
      const pathBal = await pathContract.balanceOf(account);
      setPathBalance(ethers.utils.formatUnits(pathBal, 18));
    } catch (error) {
      console.error('Lỗi cập nhật số dư:', error);
    }
  }, [account]);

  // Cập nhật riêng từng số dư
  const updateWbnbBalance = useCallback(async () => {
    if (!account) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, provider);
      const balance = await contract.balanceOf(account);
      setWbnbBalance(ethers.utils.formatEther(balance)); // WBNB có 18 decimals
    } catch (error) {
      console.error('Lỗi cập nhật WBNB:', error);
    }
  }, [account]);

  const updatePathBalance = useCallback(async () => {
    if (!account) return;
    const contract = new ethers.Contract(PATH_ADDRESS, PATH_ABI, getProvider());
    const balance = await contract.balanceOf(account);
    setPathBalance(ethers.utils.formatUnits(balance, 18));
  }, [account]);

  // Xử lý sự kiện thay đổi tài khoản/mạng
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
          
          if (Date.now() - lastConnected > 86400000) {
            disconnectWallet();
            return;
          }

          const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
          if (accounts[0] === walletAddress) {
            setAccount(walletAddress);
            await updateAllBalances();
          }
        }
      } catch (error) {
        console.error('Lỗi khởi tạo:', error);
        disconnectWallet();
      }
    };

    if (window.ethereum) {
      initWallet();
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.addEventListener('walletDisconnected', disconnectWallet);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
        window.removeEventListener('walletDisconnected', disconnectWallet);
      };
    }
  }, [disconnectWallet, updateAllBalances]);

  return (
    <WalletContext.Provider value={{ 
      account,
      connectWallet,
      disconnectWallet,
      tbnbBalance,
      wbnbBalance,
      pathBalance,
      stakedBalance,
      pendingRewards,
      updateBalances: updateAllBalances,
      updateWbnbBalance,
      updatePathBalance,
      updateStakingInfo: async () => {} // Add implementation as needed
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);