'use client';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/Faucet/walletcontext';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { FaLock, FaClock, FaChartLine, FaCheckCircle, FaCoins, FaInfoCircle } from 'react-icons/fa';
import { BsCurrencyExchange } from 'react-icons/bs';
import { MdHourglassFull } from 'react-icons/md';

// ABI and contract address for staking
const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function stakedBalance(address account) external view returns (uint256)",
  "function pendingRewards(address account) external view returns (uint256)",
  "function totalStaked() external view returns (uint256)",
  "function calculateAPR() external view returns (uint256)",
  "function isPaused() external view returns (bool)"
];

const STAKING_ADDRESS = "0x0DEC17Aad4D0332C8D75E851Ee06400a9e18Cd01";

// ABI and contract address for token
const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const TOKEN_ADDRESS = "0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE";

// Function to format amount with 4 decimal places
const formatAmount = (amount: ethers.BigNumberish) => {
  return parseFloat(ethers.utils.formatEther(amount)).toFixed(4);
};

export default function StakingCard() {
  // Wallet and account state
  const { account, connectWallet } = useWallet();
  const [pathBalance, setPathBalance] = useState('0.0000');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    isPaused: false,
    wrongNetwork: false,
    initialized: false
  });

  // Staking data
  const [stakingData, setStakingData] = useState({
    staked: '0.0000',
    rewards: '0.0000',
    apr: '0.00',
    totalStaked: '0.0000'
  });

  // For approval check
  const [needsApproval, setNeedsApproval] = useState(true);
  const [rawStaked, setRawStaked] = useState(ethers.BigNumber.from(0));
  
  // UI state
  const [activeTab, setActiveTab] = useState('stake'); // 'stake' or 'unstake'

  const getStakingContract = (signer: ethers.Signer) => {
    return new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
  };

  const getTokenContract = (signer: ethers.Signer) => {
    return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  };

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x61') { // BSC Testnet
        setStatus(prev => ({ ...prev, wrongNetwork: true }));
        toast.error('Please connect to the BSC Testnet');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x61' }],
          });
          return true;
        } catch (error) {
          console.error('Failed to switch network:', error);
          return false;
        }
      } else {
        setStatus(prev => ({ ...prev, wrongNetwork: false }));
        return true;
      }
    }
    toast.error('Please install MetaMask');
    return false;
  };

  const loadStakingData = async () => {
    if (!account || !window.ethereum) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const stakingContract = getStakingContract(signer);
      const tokenContract = getTokenContract(signer);
      
      // Check if the contract is paused
      const isPaused = await stakingContract.isPaused();
      
      // Get token balance, staked balance and pending rewards
      const [balance, staked, rewards, totalStaked, apr, allowance] = await Promise.all([
        tokenContract.balanceOf(account),
        stakingContract.stakedBalance(account),
        stakingContract.pendingRewards(account),
        stakingContract.totalStaked(),
        stakingContract.calculateAPR().catch(() => ethers.BigNumber.from(0)),
        tokenContract.allowance(account, STAKING_ADDRESS)
      ]);
      
      setRawStaked(staked);
      setStatus(prev => ({ 
        ...prev, 
        isPaused: isPaused,
        initialized: true
      }));
      
      setPathBalance(formatAmount(balance));
      setStakingData({
        staked: formatAmount(staked),
        rewards: formatAmount(rewards),
        apr: (parseFloat(ethers.utils.formatEther(apr)) * 100).toFixed(2),
        totalStaked: formatAmount(totalStaked)
      });
      
      // Check if approval is needed
      setNeedsApproval(allowance.lt(ethers.utils.parseEther('1000000')));
      
    } catch (error) {
      console.error('Error loading staking data:', error);
    }
  };
  
  // Load staking data on component mount and periodically update
  useEffect(() => {
    checkNetwork();
    
    if (account) {
      loadStakingData();
      const interval = setInterval(loadStakingData, 15000);
      return () => clearInterval(interval);
    }
  }, [account]);

  const handleTransaction = async (action: () => Promise<void>, loadingMessage: string, successMessage: string) => {
    if (!account || !await checkNetwork()) return;
    
    const toastId = toast.loading(loadingMessage);
    try {
      setLoading(true);
      await action();
      loadStakingData();
      toast.success(successMessage, {
        id: toastId,
        style: {
          background: '#10B981',
          color: 'white'
        }
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      const message = error.reason?.replace('execution reverted: ', '') || error.message;
      toast.error(message || 'Transaction failed', {
        id: toastId,
        style: {
          background: '#EF5350',
          color: 'white'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    await handleTransaction(async () => {
      const contract = getTokenContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
      const tx = await contract.approve(STAKING_ADDRESS, ethers.constants.MaxUint256);
      await tx.wait();
    }, 'Approving tokens...', 'Tokens approved for staking');
  };

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    await handleTransaction(async () => {
      const amountWei = ethers.utils.parseEther(amount);
      const contract = getStakingContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
      const tx = await contract.stake(amountWei);
      await tx.wait();
      setAmount('');
    }, 'Processing stake...', `${amount} PATH staked successfully!`);
  };

  const handleUnstake = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    await handleTransaction(async () => {
      const amountWei = ethers.utils.parseEther(amount);
      const contract = getStakingContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
      const tx = await contract.unstake(amountWei);
      await tx.wait();
      setAmount('');
    }, 'Processing unstake...', `${amount} PATH unstaked successfully!`);
  };

  const handleClaim = async () => {
    await handleTransaction(async () => {
      const contract = getStakingContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
      const tx = await contract.claimRewards();
      await tx.wait();
    }, 'Claiming rewards...', 'Rewards claimed successfully!');
  };

  const setMax = () => {
    if (activeTab === 'stake') {
      setAmount(pathBalance);
    } else {
      setAmount(stakingData.staked);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-3xl p-6 shadow-2xl w-full max-w-md relative border border-[#333] transition-all duration-300 animate-fade-in">
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10 animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B056]"></div>
            <p className="mt-4 text-white">Processing transaction...</p>
          </div>
        </div>
      )}

      {status.wrongNetwork && (
        <div className="bg-[#332b22] text-[#F5B056] p-4 rounded-xl mb-6 flex items-center">
          <FaInfoCircle className="mr-3 text-xl" />
          <span className="font-medium">Please connect to BSC Testnet</span>
        </div>
      )}

      {status.isPaused && status.initialized && (
        <div className="bg-[#332b22] text-[#F5B056] p-4 rounded-xl mb-6 flex items-center">
          <FaLock className="mr-3 text-xl" />
          <span className="font-medium">Staking is currently paused</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#252525] rounded-xl p-4 border border-[#333] shadow-inner">
          <div className="flex justify-between mb-3">
            <div className="text-gray-400 font-medium text-sm">Available</div>
            <div className="text-[#F5B056] font-medium text-sm">{pathBalance} PATH</div>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <FaCoins className="text-[#F5B056] mr-2" />
              <span className="text-white text-lg font-medium">Balance</span>
            </div>
          </div>
        </div>

        <div className="bg-[#252525] rounded-xl p-4 border border-[#333] shadow-inner">
          <div className="flex justify-between mb-3">
            <div className="text-gray-400 font-medium text-sm">APR</div>
            <div className="text-[#F5B056] font-medium text-sm">{stakingData.apr}%</div>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <FaChartLine className="text-[#F5B056] mr-2" />
              <span className="text-white text-lg font-medium">Return</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#252525] rounded-xl p-4 border border-[#333] shadow-inner">
          <div className="flex justify-between mb-3">
            <div className="text-gray-400 font-medium text-sm">Your Stake</div>
            <div className="text-[#F5B056] font-medium text-sm">{stakingData.staked} PATH</div>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <MdHourglassFull className="text-[#F5B056] mr-2" />
              <span className="text-white text-lg font-medium">Locked</span>
            </div>
          </div>
        </div>

        <div className="bg-[#252525] rounded-xl p-4 border border-[#333] shadow-inner">
          <div className="flex justify-between mb-3">
            <div className="text-gray-400 font-medium text-sm">Pending Rewards</div>
            <div className="text-[#F5B056] font-medium text-sm">{stakingData.rewards} PATH</div>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <FaClock className="text-[#F5B056] mr-2" />
              <span className="text-white text-lg font-medium">Earnings</span>
            </div>
            <button
              onClick={handleClaim}
              disabled={loading || parseFloat(stakingData.rewards) <= 0 || status.isPaused}
              className="bg-[#F5B056] hover:bg-[#d48f3f] text-black py-1 px-3 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Claim
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center rounded-xl bg-[#252525] p-1 mb-4">
          <button
            onClick={() => setActiveTab('stake')}
            className={`flex-1 py-2 rounded-lg transition-all font-medium text-sm
            ${activeTab === 'stake' ? 'bg-[#F5B056] text-black' : 'bg-transparent text-gray-300 hover:bg-[#333]'}`}
          >
            <BsCurrencyExchange className="inline mr-1" /> Stake
          </button>
          <button
            onClick={() => setActiveTab('unstake')}
            className={`flex-1 py-2 rounded-lg transition-all font-medium text-sm
            ${activeTab === 'unstake' ? 'bg-[#F5B056] text-black' : 'bg-transparent text-gray-300 hover:bg-[#333]'}`}
          >
            <FaCoins className="inline mr-1" /> Unstake
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-gray-400 text-sm">Amount</label>
            <button
              onClick={setMax}
              className="text-[#F5B056] text-xs hover:underline"
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-3 bg-[#252525] border border-[#333] rounded-xl text-white"
              disabled={loading || status.isPaused}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              PATH
            </span>
          </div>
        </div>

        {needsApproval && activeTab === 'stake' ? (
          <button
            onClick={handleApprove}
            disabled={loading || status.isPaused}
            className="w-full bg-[#F5B056] hover:bg-[#d48f3f] text-black p-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 font-medium shadow-lg"
            aria-label="Approve PATH token"
          >
            <FaCheckCircle className="mr-2" /> Approve PATH Tokens
          </button>
        ) : (
          activeTab === 'stake' ? (
            <button
              onClick={handleStake}
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(pathBalance) || status.isPaused}
              className="w-full bg-[#F5B056] hover:bg-[#d48f3f] text-black p-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 font-medium shadow-lg"
            >
              <FaCoins className="mr-2" /> Stake PATH
            </button>
          ) : (
            <button
              onClick={handleUnstake}
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(stakingData.staked) || status.isPaused}
              className="w-full bg-[#F5B056] hover:bg-[#d48f3f] text-black p-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 font-medium shadow-lg"
            >
              <FaCoins className="mr-2" /> Unstake PATH
            </button>
          )
        )}
      </div>
    </div>
  );
}
