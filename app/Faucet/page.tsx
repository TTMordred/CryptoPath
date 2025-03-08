'use client';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaCoins } from 'react-icons/fa';
import ParticlesBackground from '@/components/ParticlesBackground';
import TokenInfo from '@/components/Faucet/TokenInfo';
import FaucetRequest from '@/components/Faucet/FaucetRequest';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/components/Faucet/constants';

const FaucetPage = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [faucetBalance, setFaucetBalance] = useState('0');
  const [faucetData, setFaucetData] = useState({ lastRequest: 0, dailyCount: 0 });
  const [loading, setLoading] = useState(false);
  const [faucetEmpty, setFaucetEmpty] = useState(false);
  const [tbnbBalance, setTbnbBalance] = useState('0');

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    
    const checkNetwork = async () => {
      try {
        if (window.ethereum?.networkVersion !== '97') {
          await window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x61' }] // BSC Testnet Chain ID
          });
        }
      } catch (error) {
        toast.error('Please connect to BSC Testnet');
      }
    };

    const initContract = async () => {
      if (window.ethereum) {
        await checkNetwork();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Lấy số dư tBNB
        const balance = await provider.getBalance(await signer.getAddress());
        setTbnbBalance(ethers.utils.formatEther(balance));

        // Các thông tin khác
        const tokenBal = await contract.balanceOf(await signer.getAddress());
        const faucetBal = await contract.faucetBalance();

        setContract(contract);
        setTokenBalance(ethers.utils.formatEther(tokenBal));
        setFaucetBalance(ethers.utils.formatEther(faucetBal));
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', initContract);
      initContract();
    }
  }, []);

  return (
    <div className="relative min-h-screen font-sans">
      <ParticlesBackground />
      
      <div className="relative z-10 bg-transparent">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto" data-aos="fade-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Get Free <span className="text-[#F5B056]">PATH Tokens</span>
              </h1>
              <p className="text-gray-300 text-lg">
                Claim test tokens on BSC Testnet
              </p>
            </div>

            <div className="bg-black/30 rounded-xl p-8 border border-gray-800 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* TBNB Balance Section */}
                <div className="bg-gray-800/50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-[#F5B056] mb-4">
                    Your tBNB Balance
                  </h3>
                  <div className="text-3xl font-mono">
                    {parseFloat(tbnbBalance).toFixed(4)} tBNB
                  </div>
                </div>

                {/* Faucet Controls */}
                <div>
                  <TokenInfo
                    tokenBalance={tokenBalance}
                    faucetBalance={faucetBalance}
                    faucetEmpty={faucetEmpty}
                    isBlacklisted={false}
                    loading={loading}
                  />

                  <div className="mt-6">
                    <FaucetRequest
                      requestTokens={async () => {
                        if (!contract) return;
                        setLoading(true);
                        try {
                          const tx = await contract.requestTokens();
                          await tx.wait();
                          const newBalance = await contract.balanceOf(await contract.signer.getAddress());
                          setTokenBalance(ethers.utils.formatEther(newBalance));
                          toast.success('Tokens claimed successfully!');
                        } catch (error: any) {
                          toast.error(error.reason?.replace('execution reverted: ', '') || 'Claim failed');
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
                </div>
              </div>

              <div className="mt-8 text-sm text-gray-400 space-y-2">
                <p>• Maximum 1 claim per 6 hours</p>
                <p>• Maximum 3 claims per day</p>
                <p>• Test tokens have no real value</p>
                <p>• Connected to BSC Testnet</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FaucetPage;