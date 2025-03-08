// components/ConnectWallet.tsx
'use client';
import React from 'react';
import { useWallet } from '@/components/Faucet/walletcontext';
import WalletInfo from '@/components/WalletInfo';

const ConnectWallet = () => {
  const { account, connectWallet, disconnectWallet } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet({ force: true });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleFullDisconnect = () => {
    disconnectWallet();
    
    // Force MetaMask UI reset
    if (window.ethereum?.selectedAddress) {
      window.ethereum.selectedAddress = null;
    }
    
    // Clear MetaMask internal cache
    if (window.ethereum?._metamask) {
      window.ethereum._metamask.isUnlocked().then((unlocked: boolean) => {
        if (!unlocked) {
          window.location.reload();
        }
      });
    }
  };

  return (
    <div className="wallet-connector">
      {account ? (
        <div className="connected-wallet">
          <WalletInfo />
          <button
            onClick={handleFullDisconnect}
            className="disconnect-button"
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="connect-button"
          aria-label="Connect wallet"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;