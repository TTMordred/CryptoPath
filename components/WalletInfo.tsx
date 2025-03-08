// components/WalletInfo.tsx
'use client';
import React, { useEffect } from 'react';
import { useWallet } from '@/components/Faucet/walletcontext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Coins, ListOrdered } from 'lucide-react';

const WalletInfo = () => {
  const { account, balance, updateBalance } = useWallet();

  useEffect(() => {
    const interval = setInterval(() => {
      updateBalance();
    }, 30000); // Cập nhật số dư mỗi 30s
    
    return () => clearInterval(interval);
  }, [account]);

  if (!account) return null;

  return (
    <Card className="wallet-info-card">
      <CardHeader>
        <CardTitle className="wallet-title">
          <Wallet className="wallet-icon" />
          Wallet Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="wallet-details">
          <div className="balance-info">
            <Coins className="balance-icon" />
            <span>Balance: {balance}</span>
          </div>
          <div className="address-info">
            <ListOrdered className="address-icon" />
            <span>Address: {`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletInfo;