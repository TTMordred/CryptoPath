'use client'

import { useState, useEffect} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Loader2, Gauge, Calculator } from "lucide-react"
import axios from 'axios';
import TransactionTable from '@/components/transactions/TransactionTable';

interface Stats {
  transactions24h: number;
  pendingTransactions: number;
  networkFee: number;
  avgGasFee: number;
  totalTransactionAmount: number;
}

const initialStats: Stats = {
  transactions24h: 0,
  pendingTransactions: 0,
  networkFee: 0,
  avgGasFee: 0,
  totalTransactionAmount: 0,
};

export default function TransactionExplorer() {
  const [, setIsMobile] = useState(false);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [, setTotalTransactions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
  const API_URL = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`;

  const fetchNetworkStats = async () => {
    try {
      // Fetch gas prices
      const gasResponse = await fetch('/api/etherscan?module=gastracker&action=gasoracle');
      const gasData = await gasResponse.json();

      if (gasData.status === "1") {
        setStats(prev => ({
          ...prev,
          networkFee: parseFloat(gasData.result.SafeGasPrice),
          avgGasFee: parseFloat(gasData.result.ProposeGasPrice)
        }));
      }

      // Fetch latest block number
      const blockResponse = await fetch('/api/etherscan?module=proxy&action=eth_blockNumber');
      const blockData = await blockResponse.json();
      const latestBlock = parseInt(blockData.result, 16);
      
      const blocksIn24h = Math.floor(86400 / 15); // Approximate blocks in 24h

      // Fetch transaction count
      const txCountResponse = await fetch(
        `/api/etherscan?module=proxy&action=eth_getBlockTransactionCountByNumber&tag=${latestBlock.toString(16)}`
      );
      const txCountData = await txCountResponse.json();
      const txCount = parseInt(txCountData.result, 16);

      // Fetch pending transactions
      const pendingResponse = await fetch('/api/pending');
      const pendingData = await pendingResponse.json();

      setStats(prev => ({
        ...prev,
        transactions24h: txCount * blocksIn24h,
        pendingTransactions: pendingData.pendingTransactions || 0
      }));
    } catch (error) {
      console.error('Error fetching network stats:', error);
      setError('Failed to fetch network stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalTransactions = async () => {
    setLoading(true);
    try {
        const response = await axios.get(API_URL);
        const totalTxCount = response.data.result;
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
    const interval = setInterval(fetchNetworkStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-xl text-center text-gray-300">Transactions (24h)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">
                {stats.transactions24h.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-[#F5B056] animate-spin" />
                <CardTitle className="text-xl text-center text-gray-300">Pending Txns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">{stats.pendingTransactions.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Gauge className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-lg text-center text-gray-300">Network Fee</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">{stats.networkFee.toFixed(2)} Gwei</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-xl text-center text-gray-300">AVG Gas Fee</CardTitle>
              </div>
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