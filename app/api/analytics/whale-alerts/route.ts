import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    
    if (!apiKey) {
      throw new Error("Etherscan API key is not configured");
    }
    
    // Extract query parameters
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    // Get recent ETH transactions from a block
    // We'll take the most recent block and look for large transactions
    const blockNumberResponse = await axios.get(
      `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    );
    
    if (!blockNumberResponse.data || !blockNumberResponse.data.result) {
      throw new Error("Failed to get latest block number");
    }
    
    const blockNumber = parseInt(blockNumberResponse.data.result, 16);
    
    // Get block details including transactions
    const blockResponse = await axios.get(
      `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=0x${blockNumber.toString(16)}&boolean=true&apikey=${apiKey}`
    );
    
    if (!blockResponse.data || !blockResponse.data.result || !blockResponse.data.result.transactions) {
      throw new Error("Failed to get block details");
    }
    
    // Extract and filter large transactions (> 10 ETH)
    const transactions = blockResponse.data.result.transactions
      .filter((tx: any) => {
        const valueInEth = parseInt(tx.value, 16) / 1e18;
        return valueInEth > 10; // Only transactions > 10 ETH
      })
      .map((tx: any) => {
        const valueInEth = parseInt(tx.value, 16) / 1e18;
        const timestamp = parseInt(blockResponse.data.result.timestamp, 16) * 1000;
        
        return {
          id: tx.hash,
          symbol: 'ETH',
          amount: parseFloat(valueInEth.toFixed(2)),
          value: valueInEth * 3000, // Approximate USD value
          from: tx.from,
          to: tx.to,
          type: 'transfer',
          timestamp
        };
      })
      .slice(0, limit);
    
    if (transactions.length > 0) {
      const whaleData = {
        transactions,
        totalValue: transactions.reduce((sum: number, tx: { value: number }) => sum + tx.value, 0),
        timestamp: Date.now()
      };
      
      return NextResponse.json(whaleData, { status: 200 });
    }
    
    // If no large transactions found or not enough, throw to use simulated data
    throw new Error("Not enough large transactions found in latest block");
  } catch (error) {
    console.error('Error in whale alerts API:', error);
    
    // Define mock transaction data as fallback
    const cryptoAddresses = [
      '0x6b75d8af000000e20b7a7ddf000ba0d00b',
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      '0x73bceb1cd57c711feac4224d062b0f6ff338501e',
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ];

    const exchanges = [
      'Binance',
      'Coinbase',
      'Kraken',
      'Huobi',
      'KuCoin',
      'FTX',
      'Unknown'
    ];

    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC'];
    
    // Extract query parameters
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    // Generate simulated whale transactions
    const transactions = Array.from({ length: limit }, (_, i) => {
      const isFromExchange = Math.random() > 0.5;
      const isToExchange = !isFromExchange && Math.random() > 0.7;
      const symbol = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
      const amount = symbol === 'BTC' ? 
                    Math.random() * 500 + 50 : 
                    symbol === 'ETH' ? 
                    Math.random() * 5000 + 500 : 
                    Math.random() * 100000 + 10000;
      
      const baseValue = 
        symbol === 'BTC' ? amount * 60000 : 
        symbol === 'ETH' ? amount * 3500 : 
        symbol === 'BNB' ? amount * 600 : 
        symbol === 'SOL' ? amount * 150 : 
        amount;
      
      // Add some randomness to value
      const value = baseValue * (0.9 + Math.random() * 0.2);
      
      const timestamp = Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000);
      
      return {
        id: `tx_${Date.now()}_${i}`,
        symbol,
        amount: parseFloat(amount.toFixed(symbol === 'BTC' ? 2 : symbol === 'ETH' ? 1 : 0)),
        value: parseFloat(value.toFixed(0)),
        from: isFromExchange ? 
          exchanges[Math.floor(Math.random() * (exchanges.length - 1))] : 
          cryptoAddresses[Math.floor(Math.random() * cryptoAddresses.length)],
        to: isToExchange ? 
          exchanges[Math.floor(Math.random() * (exchanges.length - 1))] : 
          cryptoAddresses[Math.floor(Math.random() * cryptoAddresses.length)],
        type: isFromExchange ? 'withdrawal' : isToExchange ? 'deposit' : 'transfer',
        timestamp
      };
    });
    
    // Sort by most recent first
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    const whaleData = {
      transactions,
      totalValue: transactions.reduce((sum: number, tx: { value: number }) => sum + tx.value, 0),
      timestamp: Date.now(),
      simulated: true
    };
    
    return NextResponse.json(whaleData, { status: 200 });
  }
}
