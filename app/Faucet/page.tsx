'use client';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaCoins } from 'react-icons/fa';
import ParticlesBackground from '@/components/ParticlesBackground';
import ConnectWallet from '@/components/Faucet/connectWallet';
import TokenInfo from '@/components/Faucet/TokenInfo';
import FaucetRequest from '@/components/Faucet/FaucetRequest';
import WalletInfo from '@/components/WalletInfo';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/components/Faucet/constants';
import { useWallet } from '@/components/Faucet/walletcontext';

const FaucetPage = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [faucetBalance, setFaucetBalance] = useState('0');
  const [faucetData, setFaucetData] = useState({ lastRequest: 0, dailyCount: 0 });
  const [loading, setLoading] = useState(false);
  const [faucetEmpty, setFaucetEmpty] = useState(false);
  const { account, connectWallet, disconnectWallet, balance } = useWallet();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    const initContract = async () => {
      if (account && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
        
        // Load initial data
        const balance = await contract.balanceOf(account);
        const faucetBalance = await contract.faucetBalance();
        const faucetRecords = await contract.faucetRecords(account);

        setTokenBalance(ethers.utils.formatEther(balance));
        setFaucetBalance(ethers.utils.formatEther(faucetBalance));
        setFaucetData({
          lastRequest: faucetRecords.lastRequest.toNumber(),
          dailyCount: faucetRecords.dailyCount.toNumber()
        });
      }
    };

    initContract();
  }, [account]);

  return (
    <div className="relative min-h-screen font-sans">
      <ParticlesBackground />
      
      <div className="relative z-10 bg-transparent">
        <header className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#F5B056]">PATH Faucet V3</h1>
            <ConnectWallet />
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto" data-aos="fade-up">
            <WalletInfo />

            <div className="bg-black/30 rounded-xl p-8 border border-gray-800 shadow-xl mt-8">
              {account ? (
                <>
                  <TokenInfo
                    tokenBalance={tokenBalance}
                    faucetBalance={faucetBalance}
                    faucetEmpty={faucetEmpty}
                    isBlacklisted={false}
                    loading={loading}
                  />

                  <div className="mt-8">
                    <FaucetRequest
                      requestTokens={async () => {
                        if (!contract) return;
                        setLoading(true);
                        try {
                          const tx = await contract.requestTokens();
                          await tx.wait();
                          const newBalance = await contract.balanceOf(account);
                          setTokenBalance(ethers.utils.formatEther(newBalance));
                          toast.success('Claim successful!');
                        } catch (error) {
                          toast.error('Claim failed!');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      faucetData={faucetData}
                      loading={loading}
                      faucetEmpty={faucetEmpty}
                      isBlacklisted={false}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-block bg-[#F5B056]/20 p-4 rounded-full mb-4">
                    <FaCoins className="text-4xl text-[#F5B056]" />
                  </div>
                  <p className="text-gray-400 mb-6">
                    Connect your wallet to claim test tokens
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FaucetPage;