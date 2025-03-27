import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "@/components/search/TransactionTable/types";
import { ethers } from "ethers";

// Add timeout utility
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000, isInfura = false) => {
  if (isInfura) {
    // For Infura, don't use a timeout
    return fetch(url, options);
  }
  
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error("Request timeout"));
    }, timeout);
  });
  
  return Promise.race([
    fetch(url, { ...options, signal }),
    timeoutPromise
  ]);
};

// Enhanced address validation
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Get Infura provider URL based on network
const getInfuraUrl = (network: string): string => {
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY;
  switch (network.toLowerCase()) {
    case 'mainnet':
      return `https://mainnet.infura.io/v3/${infuraKey}`;
    case 'optimism':
      return `https://optimism-mainnet.infura.io/v3/${infuraKey}`;
    case 'arbitrum':
      return `https://arbitrum-mainnet.infura.io/v3/${infuraKey}`;
    default:
      throw new Error(`Network ${network} not supported`);
  }
};

// Fetch transactions using Infura with optimized block querying
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchInfuraTransactions = async (address: string, network: string, page: number, offset: number): Promise<Transaction[]> => {
  const provider = new ethers.providers.JsonRpcProvider(getInfuraUrl(network));
  const address_lower = address.toLowerCase();
  
  try {
    // Get current block number with retry
    let currentBlock;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        currentBlock = await provider.getBlockNumber();
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await delay(1000 * attempt); // Exponential backoff
      }
    }
    
    if (!currentBlock) {
      throw new Error("Failed to fetch current block number");
    }

    // Calculate block range for pagination (5000 blocks per page to reduce load)
    const blocksPerPage = 5000;
    const endBlock = currentBlock - (page - 1) * blocksPerPage;
    const startBlock = Math.max(0, endBlock - blocksPerPage);
    
    // Fetch blocks in smaller batches of 5 with delay between batches
    const batchSize = 5;
    const transactions: Transaction[] = [];
    
    for (let blockNum = endBlock; blockNum >= startBlock && transactions.length < offset; blockNum -= batchSize) {
      const blockPromises = [];
      
      // Create batch of block requests
      for (let i = 0; i < batchSize && (blockNum - i) >= startBlock; i++) {
        blockPromises.push(
          (async () => {
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                return await provider.getBlockWithTransactions(blockNum - i);
              } catch (error) {
                if (attempt === 3) throw error;
                await delay(1000 * attempt);
              }
            }
          })()
        );
      }
      
      // Wait for all blocks in batch with timeout
      const blocks = await Promise.all(blockPromises);
      
      // Add delay between batches to prevent rate limiting
      await delay(500);
      
      // Process each block's transactions
      for (const block of blocks) {
        if (!block) continue;
        
        // Filter transactions involving our address
        const relevantTxs = block.transactions.filter(tx => 
          tx.from.toLowerCase() === address_lower || 
          (tx.to && tx.to.toLowerCase() === address_lower)
        );
        
        // Get transaction receipts and format transactions
        const processedTxs = await Promise.all(
          relevantTxs.map(async (tx) => {
            let receipt;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                receipt = await provider.getTransactionReceipt(tx.hash);
                if (receipt) break;
                await delay(1000 * attempt); // Exponential backoff
              } catch (error) {
                console.error(`Failed to fetch receipt for tx ${tx.hash}, attempt ${attempt}:`, error);
                if (attempt === 3) throw error;
                await delay(1000 * attempt);
              }
            }
            
            let status: "success" | "failed" | "pending" | undefined;
            if (!receipt) {
              status = "pending";
              console.log(`No receipt found for transaction ${tx.hash}`);
            } else {
              status = receipt.status === 1 ? "success" : "failed";
            }

            return {
              id: tx.hash,
              from: tx.from,
              to: tx.to || 'Contract Creation',
              value: `${ethers.utils.formatEther(tx.value)} ETH`,
              timestamp: new Date(block.timestamp * 1000).toISOString(),
              gas: tx.gasLimit.toNumber(),
              gasPrice: parseFloat(ethers.utils.formatUnits(tx.gasPrice || 0, 'gwei')),
              gasUsed: receipt?.gasUsed.toNumber(),
              blockNumber: tx.blockNumber,
              nonce: tx.nonce,
              status,
              input: tx.data,
              network
            };
          })
        );
        
        transactions.push(...processedTxs);
        
        // Break if we have enough transactions
        if (transactions.length >= offset) break;
      }
    }
    
    // Sort by block number and return only requested number of transactions
    return transactions
      .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))
      .slice(0, offset);
      
  } catch (error) {
    console.error('Infura fetch error:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const network = searchParams.get("network") || "mainnet";
    const provider = searchParams.get("provider") || "etherscan";
    const page = parseInt(searchParams.get("page") || "1");
    const offset = parseInt(searchParams.get("offset") || "20");
    
    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }
    
    let transactions: Transaction[] = [];
    
    if (provider === "etherscan") {
      const apiKey = process.env.ETHERSCAN_API_KEY || "";
      
      if (network === "mainnet") {
        const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${apiKey}`;
        
        console.log(`Fetching transactions from Etherscan: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === "1" && data.result) {
          transactions = data.result.map((tx: any) => ({
            id: tx.hash,
            from: tx.from,
            to: tx.to,
            value: `${parseFloat(tx.value) / 1e18} ETH`,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            gas: parseInt(tx.gas),
            gasPrice: parseInt(tx.gasPrice) / 1e9,
            gasUsed: parseInt(tx.gasUsed),
            blockNumber: parseInt(tx.blockNumber),
            nonce: parseInt(tx.nonce),
            status: tx.isError === "0" ? "success" as const : "failed" as const,
            input: tx.input,
            network
          }));
        } else if (data.status === "0" && data.message === "No transactions found") {
          transactions = [];
        } else {
          throw new Error(data.message || "Unknown error from Etherscan API");
        }
      } else {
        throw new Error(`Network ${network} not supported with provider ${provider}`);
      }
    } else if (provider === "infura") {
      console.log(`Fetching transactions from Infura for network: ${network}`);
      transactions = await fetchInfuraTransactions(address, network, page, offset);
    } else {
      throw new Error(`Provider ${provider} not supported`);
    }
    
    return NextResponse.json(transactions, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
