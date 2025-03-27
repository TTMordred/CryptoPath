// components/Staking/StakingCard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/components/Faucet/walletcontext';
import { FaLock, FaUnlock, FaGift, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const STAKING_CONTRACT_ADDRESS = '0xF7b094A4340734911492c1a030eE98EA1be0805E';
const PATH_ADDRESS = '0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE';
const BSC_TESTNET_CHAIN_ID = '0x61';

const STAKING_ABI = [
  "function stake(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function claimRewards()",
  "function getPendingRewards(address user) view returns (uint256)",
  "function getStakedAmount(address user) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function calculateAPR() view returns (uint256)",
  "function paused() view returns (bool)"
];

const PATH_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4
});

const safeFormat = (value: ethers.BigNumberish, decimals = 18) => {
  try {
    const formatted = ethers.utils.formatUnits(value, decimals);
    return numberFormatter.format(parseFloat(formatted));
  } catch {
    return '0.0000';
  }
};

export default function StakingCard() {
  const { account, pathBalance, updateBalances } = useWallet();
  const [amount, setAmount] = useState('');
  const [stakingData, setStakingData] = useState({
    staked: '0.0000',
    rewards: '0.0000',
    total: '0.0000',
    apr: '0.0000'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    isPaused: false,
    wrongNetwork: false,
    initialized: false
  });
  const [rawStaked, setRawStaked] = useState(ethers.BigNumber.from(0));


  const getStakingContract = (signer?: ethers.Signer) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer || provider);
  };

  const getPathTokenContract = (signer?: ethers.Signer) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return new ethers.Contract(PATH_ADDRESS, PATH_ABI, signer || provider);
  };

  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = chainId === BSC_TESTNET_CHAIN_ID;
      setStatus(prev => ({ ...prev, wrongNetwork: !isCorrect }));
      return isCorrect;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  const loadStakingData = async () => {
    try {
      const isCorrectNetwork = await checkNetwork();
      
      if (!account || !isCorrectNetwork) {
        setRawStaked(ethers.BigNumber.from(0));
        setStakingData({
          staked: '0.0000',
          rewards: '0.0000',
          total: '0.0000',
          apr: '0.0000'
        });
        setStatus(prev => ({ ...prev, initialized: true }));
        return;
      }
      
      const contract = getStakingContract();
      const [paused, staked, rewards, total, apr] = await Promise.all([
        contract.paused().catch(() => false),
        contract.getStakedAmount(account).catch(() => ethers.BigNumber.from(0)),
        contract.getPendingRewards(account).catch(() => ethers.BigNumber.from(0)),
        contract.totalStaked().catch(() => ethers.BigNumber.from(0)),
        contract.calculateAPR().catch(() => ethers.BigNumber.from(0))
      ]);

      setRawStaked(staked);

      setStatus(prev => ({ ...prev, isPaused: paused, initialized: true }));
      
      const aprValue = parseFloat(ethers.utils.formatUnits(apr, 2));

      setStakingData({
        staked: safeFormat(staked),
        rewards: safeFormat(rewards),
        total: safeFormat(total),
        apr: `${aprValue.toFixed(2)}`
      });

    } catch (error) {
      console.error('Staking data load error:', error);
      toast.error('Failed to load staking data');
    }
  };

  useEffect(() => {
    if (account) {
      loadStakingData();
      const interval = setInterval(loadStakingData, 15000);
      return () => clearInterval(interval);
    }
  }, [account]);

  const handleTransaction = async (
    action: () => Promise<void>,
    loadingMessage: string,
    successMessage: string
  ) => {
    if (!account || !(await checkNetwork())) return;
    
    const toastId = toast.loading(loadingMessage);
    try {
      setLoading(true);
      await action();
      toast.success(successMessage, { 
        id: toastId,
        style: { background: '#4CAF50', color: 'white' }
      });
      await loadStakingData();
      await updateBalances();
    } catch (error: any) {
      const message = error.reason || error.message.split('(')[0];
      toast.error(message || 'Transaction failed', { 
        id: toastId,
        style: { background: '#EF5350', color: 'white' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    await handleTransaction(
      async () => {
        const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
        const pathContract = getPathTokenContract(signer);
        const tx = await pathContract.approve(STAKING_CONTRACT_ADDRESS, ethers.constants.MaxUint256);
        await tx.wait();
      },
      'Approving PATH tokens...',
      'Approval successful!'
    );
  };

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    await handleTransaction(
      async () => {
        const amountWei = ethers.utils.parseUnits(amount, 18);
        const pathContract = getPathTokenContract();
        const balance = await pathContract.balanceOf(account);

        if (balance.lt(amountWei)) {
          throw new Error(`Insufficient balance: ${safeFormat(balance)} PATH available`);
        }

        const contract = getStakingContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
        const tx = await contract.stake(amountWei);
        await tx.wait();
        setAmount('');
      },
      'Processing stake...',
      `${amount} PATH staked successfully!`
    );
  };

  const handleUnstake = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    await handleTransaction(
      async () => {
        const amountWei = ethers.utils.parseUnits(amount, 18);
        const contract = getStakingContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
        const tx = await contract.withdraw(amountWei);
        await tx.wait();
        setAmount('');
      },
      'Processing unstake...',
      `${amount} PATH unstaked successfully!`
    );
  };

  const handleClaim = async () => {
    await handleTransaction(
      async () => {
        const contract = getStakingContract(new ethers.providers.Web3Provider(window.ethereum).getSigner());
        const tx = await contract.claimRewards();
        await tx.wait();
      },
      'Claiming rewards...',
      `${stakingData.rewards} PATH claimed!`
    );
  };

  if (!status.initialized) {
    return (
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-6 shadow-xl w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Initializing staking...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-4 md:p-6 shadow-xl w-full max-w-md relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Phần thông báo mạng và trạng thái */}
      {status.wrongNetwork && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4 flex items-center animate-fade-in">
          <FaExclamationTriangle className="mr-2 animate-pulse" />
          Please connect to BSC Testnet
        </div>
      )}
      
      {status.isPaused && (
        <div className="bg-yellow-500 text-black p-3 rounded-lg mb-4 flex items-center animate-fade-in">
          <FaExclamationTriangle className="mr-2 animate-pulse" />
          Staking is currently paused
        </div>
      )}

      {/* Phần header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 text-shadow">PATH Staking</h2>
        <div className="flex justify-between text-sm text-purple-100">
          <span>Total Staked: <span className="text-purple-300">{stakingData.total}</span></span>
          <span>APR: <span className="text-purple-300">{parseFloat(stakingData.apr).toFixed(2)}%</span></span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Thông tin staking */}
        <div className="bg-gray-800 rounded-lg p-4 animate-pop-in">
          <div className="flex justify-between mb-3">
            <span className="text-gray-400">Your Staked</span>
            <span className="text-white text-shadow">
              {stakingData.staked} <span className="text-purple-300">PATH</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Pending Rewards</span>
            <span className="text-green-400 text-shadow">
              {stakingData.rewards} <span className="text-purple-300">PATH</span>
            </span>
          </div>
        </div>

        {/* Input field với validation */}
        <div className="relative animate-slide-up">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder= "0.0000"
            className="w-full bg-gray-800 text-white rounded-lg p-3 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all"
            inputMode="decimal"
            disabled={loading || status.isPaused}
          />
          <span className="absolute right-3 top-3 text-gray-400">PATH</span>
          {parseFloat(amount) > parseFloat(pathBalance) && (
            <p className="text-red-400 text-sm mt-1 animate-fade-in">Exceeds available balance</p>
          )}
        </div>

        {/* Nhóm nút tương tác */}
        <div className="space-y-3">
          {/* Nút Approve full width */}
          <button
            onClick={handleApprove}
            disabled={loading || status.isPaused}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
            aria-label="Approve PATH token"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FaCheckCircle className="mr-2" /> Approve
              </>
            )}
          </button>

          {/* Nhóm Stake/Unstake */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStake}
              disabled={loading || !amount || parseFloat(amount) <= 0 || status.isPaused}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
              aria-label="Stake PATH token"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaLock className="mr-2" /> Stake
                </>
              )}
            </button>

            <button
              onClick={handleUnstake}
              disabled={loading || !amount || parseFloat(amount) <= 0 || rawStaked.lt(ethers.utils.parseUnits(amount, 18)) || status.isPaused}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
              aria-label="Unstake PATH token"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaUnlock className="mr-2" /> Unstake
                </>
              )}
            </button>
          </div>

          {/* Nút Claim Rewards */}
          <button
            onClick={handleClaim}
            disabled={loading || parseFloat(stakingData.rewards) <= 0 || status.isPaused}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
            aria-label="Claim rewards"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FaGift className="mr-2" /> Claim Rewards
              </>
            )}
          </button>
        </div>

        {/* Số dư ví */}
        <div className="text-center text-sm text-gray-400 animate-fade-in">
          Available in Wallet: <span className="text-purple-300">{pathBalance}</span> PATH
        </div>
      </div>
    </div>
  );
}