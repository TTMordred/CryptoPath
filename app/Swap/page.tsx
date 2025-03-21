// app/swap/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/components/Faucet/walletcontext';
import SwapCard from '@/components/Swap/SwapCard';
import SwapTabs from '@/components/Swap/SwapTabs';
import ParticlesBackground from '@/components/ParticlesBackground';

// Contract ABIs
const ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  }
];

const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      { internalType: "uint32", name: "initializedTicksCrossed", type: "uint32" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const WBNB_ABI = [
  { "constant": false, "inputs": [], "name": "deposit", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" },
  { "constant": false, "inputs": [{"name": "wad","type": "uint256"}], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }
];

const PATH_ABI = [
  { "constant": false, "inputs": [{"name": "spender","type": "address"},{"name": "amount","type": "uint256"}], "name": "approve", "outputs": [{ "name": "","type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }
];

// Contract Addresses
const PATH_ADDRESS = '0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE';
const WBNB_ADDRESS = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
const ROUTER_ADDRESS = '0x1b81D678ffb9C0263b24A97847620C99d213eB14';
const QUOTER_ADDRESS = '0xbC203d7f83677c7ed3F7acEc959963E7F4ECC5C2';

const SwapPage = () => {
  const { 
    account, 
    tbnbBalance, 
    wbnbBalance,
    pathBalance,
    connectWallet, 
    updateBalances,
    updateWbnbBalance
  } = useWallet();

  const [currentTab, setCurrentTab] = useState<'wrap' | 'swap'>('wrap');
  const [fromToken, setFromToken] = useState<'tBNB' | 'WBNB' | 'PATH'>('tBNB');
  const [toToken, setToToken] = useState<'tBNB' | 'WBNB' | 'PATH'>('WBNB');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState('');
  const [fee] = useState('0.000005 tBNB');

  // Tự động kết nối ví
  useEffect(() => {
    const initConnection = async () => {
      if (!account && window.ethereum) {
        try {
          await connectWallet();
        } catch (error) {
          toast.error('Failed to connect wallet');
        }
      }
    };
    initConnection();
  }, [account, connectWallet]);

  // Kiểm tra và chuyển đổi mạng
  const checkNetwork = async () => {
    try {
      if (window.ethereum?.networkVersion !== '97') {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x61' }]
        });
      }
    } catch (error) {
      toast.error('Please connect to BSC Testnet');
      throw error;
    }
  };

  // Xử lý Wrap/Unwrap
  const handleWrapUnwrap = async () => {
    try {
      await checkNetwork();
      if (!account) throw new Error('Wallet not connected');
      if (!amountIn || parseFloat(amountIn) <= 0) throw new Error('Invalid amount');

      setLoading(true);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const wbnbContract = new ethers.Contract(WBNB_ADDRESS, WBNB_ABI, signer);

      if (fromToken === 'tBNB') {
        // Wrap tBNB -> WBNB
        const tx = await wbnbContract.deposit({
          value: ethers.utils.parseEther(amountIn)
        });
        await tx.wait();
      } else {
        // Unwrap WBNB -> tBNB
        const tx = await wbnbContract.withdraw(
          ethers.utils.parseEther(amountIn)
        );
        await tx.wait();
      }

      await updateBalances();
      await updateWbnbBalance();
      toast.success('Transaction successful!');
      setAmountIn('');
    } catch (error: any) {
      toast.error(error.reason?.replace('execution reverted: ', '') || error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lấy tỷ giá swap
  const fetchSwapQuote = useCallback(async (amount: string) => {
    if (!account || !amount || parseFloat(amount) <= 0) {
      setAmountOut('');
      setRate('');
      return;
    }

    try {
      const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, new ethers.providers.Web3Provider(window.ethereum));
      const amountInWei = fromToken === 'WBNB' 
        ? ethers.utils.parseEther(amount)
        : ethers.utils.parseUnits(amount, 18);

      const params = {
        tokenIn: fromToken === 'WBNB' ? WBNB_ADDRESS : PATH_ADDRESS,
        tokenOut: toToken === 'PATH' ? PATH_ADDRESS : WBNB_ADDRESS,
        amountIn: amountInWei,
        fee: 500,
        sqrtPriceLimitX96: 0
      };

      const quote = await quoter.callStatic.quoteExactInputSingle(params, { gasLimit: 1_000_000 });
      const [amountOut] = quote;
      const formattedAmount = ethers.utils.formatUnits(amountOut, 18);
      
      setAmountOut(formattedAmount);
      setRate(`1 ${fromToken} ≈ ${(parseFloat(formattedAmount)/parseFloat(amount)).toFixed(6)} ${toToken}`);
    } catch (error) {
      console.error('Quote error:', error);
      setAmountOut('');
      setRate('Price unavailable - Check liquidity');
    }
  }, [account, fromToken, toToken]);

  // Xử lý swap
  const handleSwap = async () => {
    try {
      await checkNetwork();
      if (!account) throw new Error('Wallet not connected');
      if (!amountIn || parseFloat(amountIn) <= 0) throw new Error('Invalid amount');

      setLoading(true);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);

      if (fromToken === 'WBNB') {
        // Swap WBNB -> PATH
        const swapTx = await router.exactInputSingle({
          tokenIn: WBNB_ADDRESS,
          tokenOut: PATH_ADDRESS,
          fee: 500,
          recipient: account,
          deadline: Math.floor(Date.now() / 1000) + 600,
          amountIn: ethers.utils.parseEther(amountIn),
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0
        }, { gasLimit: 500_000 });
        
        await swapTx.wait();
      } else {
        // Swap PATH -> WBNB
        const pathContract = new ethers.Contract(PATH_ADDRESS, PATH_ABI, signer);
        const approveTx = await pathContract.approve(ROUTER_ADDRESS, ethers.constants.MaxUint256);
        await approveTx.wait();

        const swapTx = await router.exactInputSingle({
          tokenIn: PATH_ADDRESS,
          tokenOut: WBNB_ADDRESS,
          fee: 500,
          recipient: account,
          deadline: Math.floor(Date.now() / 1000) + 600,
          amountIn: ethers.utils.parseUnits(amountIn, 18),
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0
        }, { gasLimit: 500_000 });
        
        await swapTx.wait();
      }

      await updateBalances();
      await updateWbnbBalance();
      toast.success('Swap successful!');
      setAmountIn('');
      setAmountOut('');
    } catch (error: any) {
      toast.error(error.reason?.replace('execution reverted: ', '') || error.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi tab
  useEffect(() => {
    if (currentTab === 'wrap') {
      setFromToken('tBNB');
      setToToken('WBNB');
    } else {
      setFromToken('WBNB');
      setToToken('PATH');
    }
    setAmountIn('');
    setAmountOut('');
  }, [currentTab]);

  // Xử lý thay đổi số lượng
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentTab === 'swap' && amountIn) {
        fetchSwapQuote(amountIn);
      } else if (currentTab === 'wrap') {
        setAmountOut(amountIn); // 1:1 cho Wrap/Unwrap
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [amountIn, currentTab, fetchSwapQuote]);

  return (
    <div className="relative min-h-screen font-sans">
      <ParticlesBackground />
      <div className="relative z-10 bg-transparent">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <SwapTabs activeTab={currentTab} onTabChange={setCurrentTab} />
            
            <SwapCard
              fromToken={fromToken}
              toToken={toToken}
              amountIn={amountIn}
              amountOut={amountOut}
              tbnbBalance={tbnbBalance}
              wbnbBalance={wbnbBalance}
              pathBalance={pathBalance}
              onSwap={currentTab === 'wrap' ? handleWrapUnwrap : handleSwap}
              loading={loading}
              onAmountChange={setAmountIn}
              onTokenFlip={() => {
                if (currentTab === 'wrap') {
                  const newFrom = fromToken === 'tBNB' ? 'WBNB' : 'tBNB';
                  setFromToken(newFrom);
                  setToToken(newFrom === 'tBNB' ? 'WBNB' : 'tBNB');
                } else {
                  const newFrom = fromToken === 'WBNB' ? 'PATH' : 'WBNB';
                  setFromToken(newFrom);
                  setToToken(newFrom === 'WBNB' ? 'PATH' : 'WBNB');
                }
                setAmountIn('');
                setAmountOut('');
              }}
              rate={currentTab === 'wrap' ? '1 tBNB = 1 WBNB' : rate}
              isWrap={currentTab === 'wrap'}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SwapPage;