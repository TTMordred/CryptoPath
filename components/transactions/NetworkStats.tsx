'use client'

import { useState, useEffect} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from 'axios';
import TransactionTable from '@/components/ui/TransactionTable';

interface Stats {
  transactions24h: number;
  pendingTransactions: number;
  networkFee: number;
  avgGasFee: number;
  totalTransactionAmount: number; // New field for total transaction amount
}

// Initial state
const initialStats: Stats = {
  transactions24h: 0,
  pendingTransactions: 0,
  networkFee: 0,
  avgGasFee: 0,
  totalTransactionAmount: 0, // Initialize to 0
};

export default function TransactionExplorer() {
  // State variables
  const [, setIsMobile] = useState(false);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [, setTotalTransactions] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);


  // Etherscan API configuration
  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY; // Replace with your API key
  const API_URL = `/api/etherscan?module=proxy&action=eth_blockNumber`;

  // Fetch network statistics
  const fetchNetworkStats = async () => {
    try {
      // Get gas price statistics
      const gasResponse = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
      );
      const gasData = await gasResponse.json();

      if (gasData.status === "1") {
        setStats(prev => ({
          ...prev,
          networkFee: parseFloat(gasData.result.SafeGasPrice),
          avgGasFee: parseFloat(gasData.result.ProposeGasPrice)
        }));
      }

      // Get 24h transaction count (approximate)
      const blockResponse = await fetch(
        `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`
      );
      const blockData = await blockResponse.json();
      const latestBlock = parseInt(blockData.result, 16);
      
      // Assuming ~15 second block time, calculate blocks in 24h
      const blocksIn24h = Math.floor(86400 / 15);

      // Get transaction count for latest block
      const txCountResponse = await fetch(
        `https://api.etherscan.io/api?module=proxy&action=eth_getBlockTransactionCountByNumber&tag=${latestBlock.toString(16)}&apikey=${ETHERSCAN_API_KEY}`
      );
      const txCountData = await txCountResponse.json();
      const txCount = parseInt(txCountData.result, 16);

      setStats(prev => ({
        ...prev,
        transactions24h: txCount * blocksIn24h, // Rough estimation
        pendingTransactions: txCount // Current block's transaction count as pending
      }));
    } catch (error) {
      console.error('Error fetching network stats:', error);
    }
  };

  const fetchTotalTransactions = async () => {
    setLoading(true); // Đặt loading thành true trước khi gọi API
    try {
        const response = await axios.get(API_URL);
        const totalTxCount = response.data.result; // Giả định bạn có cách lấy số giao dịch từ API

        setTotalTransactions(Number(totalTxCount));
    } catch (err) {
        setError('Lỗi khi lấy dữ liệu từ API');
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    fetchTotalTransactions();
    const interval = setInterval(() => {
        fetchTotalTransactions(); 
    }, 300000); 

    return () => clearInterval(interval); 
}, []); 


  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(() => {
      fetchNetworkStats();
    }, 30000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);


  // Effect to handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
      <div className="text-white font-exo2">
        <div className="container mx-auto p-4">
          {/* Statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6"><Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-center text-gray-300">Transactions (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl text-center font-bold text-[#F5B056]">
            {stats.transactions24h.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-center text-gray-300">Pending Txns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl text-center font-bold text-[#F5B056]">{stats.pendingTransactions.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg text-center text-gray-300">Network Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl text-center font-bold text-[#F5B056]">{stats.networkFee.toFixed(2)} Gwei</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-center text-gray-300">AVG Gas Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl text-center font-bold text-[#F5B056]">{stats.avgGasFee.toFixed(2)} Gwei</p>
        </CardContent>
      </Card>
        </div>
        <TransactionTable/>

      </div>
    </div>
  );
}         


                        