import { NextResponse } from "next/server"

// Add timeout utility - only for non-Infura requests
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
  // Basic Ethereum address format check
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "mainnet"
  const provider = searchParams.get("provider") || "etherscan"
  const page = parseInt(searchParams.get("page") || "1")
  const offset = parseInt(searchParams.get("offset") || "20")

  // Validate address presence
  if (!address) {
    return NextResponse.json({ 
      error: "Address is required",
      details: "Please provide an Ethereum address parameter."
    }, { status: 400 })
  }
  
  // Validate address format
  if (!isValidAddress(address)) {
    return NextResponse.json({ 
      error: `"${address}" is not a valid Ethereum address`,
      details: "Address must start with 0x followed by 40 hexadecimal characters.",
      invalidAddress: address,
      suggestion: "Check for typos and ensure you have copied the complete address."
    }, { status: 400 });
  }

  try {
    // Get the base URL dynamically
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_URL || ''
      
    // Use Etherscan API for Ethereum mainnet
    if (provider === 'etherscan' && network === 'mainnet') {
      const etherscanResponse = await fetchWithTimeout(
        `${baseUrl}/api/etherscan?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}&sort=desc`,
        {},
        20000 // 20s timeout
      )
      
      if (!etherscanResponse.ok) {
        throw new Error(`Etherscan API responded with status: ${etherscanResponse.status}`)
      }
      
      const etherscanData = await etherscanResponse.json()
      
      if (etherscanData.status !== "1") {
        // If no transactions are found, return an empty array
        if (etherscanData.message === "No transactions found") {
          return NextResponse.json([])
        }
        throw new Error(etherscanData.message || "Etherscan API returned an error")
      }
      
      // Transform Etherscan data to match our expected format
      const transactions = etherscanData.result.map((tx: any) => {
        const valueInEth = parseInt(tx.value) / 1e18
        
        return {
          id: tx.hash,
          from: tx.from,
          to: tx.to || "Contract Creation",
          value: `${valueInEth.toFixed(4)} ETH`,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          network,
          gas: parseInt(tx.gas),
          gasPrice: parseInt(tx.gasPrice) / 1e9, // in gwei
          blockNumber: parseInt(tx.blockNumber),
          nonce: parseInt(tx.nonce)
        }
      })
      
      return NextResponse.json(transactions)
    }
    // Use Infura for other networks (Optimism, Arbitrum)
    else if (provider === 'infura') {
      console.log(`Infura transaction search started for ${address} on ${network}`);
      // First get the latest block number - no timeout for Infura
      const blockNumberResponse = await fetchWithTimeout(
        `${baseUrl}/api/infura`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "eth_blockNumber",
            params: [],
            network
          }),
        },
        0, // No timeout for Infura
        true // Mark as Infura request
      );
      
      if (!blockNumberResponse.ok) {
        throw new Error(`Infura API responded with status: ${blockNumberResponse.status}`);
      }
      
      const blockNumberData = await blockNumberResponse.json();
      
      if (blockNumberData.error) {
        throw new Error(blockNumberData.error.message || "Failed to fetch block number");
      }
      
      const latestBlock = parseInt(blockNumberData.result, 16);
      console.log(`Latest block number: ${latestBlock}`);
      
      // Use a more direct approach for getting transactions
      // Just scan the most recent N blocks for transactions involving the address
      const blockRange = 50; // Reduced block range to prevent timeouts
      const transactions = [];
      const processedTxHashes = new Set();
      
      // Determine currency symbol based on network
      const currencySymbol = network === "optimism" ? "ETH" : 
                             network === "arbitrum" ? "ETH" : "ETH";
      
      console.log(`Scanning ${blockRange} recent blocks for transactions...`);
      
      // Start from the latest block and work backward
      for (let blockNum = latestBlock; blockNum > latestBlock - blockRange; blockNum--) {
        try {
          console.log(`Processing block ${blockNum}...`);
          // Get the block with transactions - no timeout for Infura
          const blockResponse = await fetchWithTimeout(
            `${baseUrl}/api/infura`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                method: "eth_getBlockByNumber",
                params: [`0x${blockNum.toString(16)}`, true],
                network
              }),
            },
            0, // No timeout for Infura
            true // Mark as Infura request
          );
          
          // Check for valid response
          if (!blockResponse.ok) {
            console.warn(`Skipping block ${blockNum} due to non-OK response`);
            continue; // Skip if we can't get this block
          }
          
          const blockData = await blockResponse.json();
          
          // Skip if no data or no transactions
          if (blockData.error || !blockData.result || !blockData.result.transactions) {
            console.warn(`Skipping block ${blockNum} due to missing data`, blockData.error || 'No transactions');
            continue;
          }
          
          // Filter transactions for the address
          const addrLower = address.toLowerCase();
          const relevantTxs = blockData.result.transactions.filter(
            (tx: any) => 
              tx.from && tx.from.toLowerCase() === addrLower || 
              tx.to && tx.to.toLowerCase() === addrLower
          );
          
          console.log(`Found ${relevantTxs.length} relevant transactions in block ${blockNum}`);
          
          // For each relevant transaction, get more details
          for (const tx of relevantTxs) {
            // Skip if we already processed this transaction
            if (processedTxHashes.has(tx.hash)) {
              continue;
            }
            
            const valueInWei = tx.value ? parseInt(tx.value, 16) : 0;
            
            transactions.push({
              id: tx.hash,
              from: tx.from,
              to: tx.to || "Contract Creation",
              value: `${(valueInWei / 1e18).toFixed(4)} ${currencySymbol}`,
              timestamp: new Date(parseInt(blockData.result.timestamp, 16) * 1000).toISOString(),
              network,
              gas: parseInt(tx.gas, 16),
              gasPrice: tx.gasPrice ? parseInt(tx.gasPrice, 16) / 1e9 : 0, // in gwei
              blockNumber: parseInt(tx.blockNumber, 16),
              nonce: parseInt(tx.nonce, 16)
            });
            
            processedTxHashes.add(tx.hash);
          }
          
          // Stop if we've collected enough transactions for this page
          if (transactions.length >= offset) {
            console.log(`Collected enough transactions (${transactions.length}), stopping block scan`);
            break;
          }
        } catch (blockError) {
          console.warn(`Error fetching block ${blockNum}:`, blockError);
          continue; // Skip problematic blocks
        }
      }
      
      console.log(`Transaction scan complete, found ${transactions.length} transactions`);
      
      // Sort by block number (timestamp) descending
      transactions.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Apply pagination
      const paginatedTransactions = transactions.slice(
        Math.min((page - 1) * offset, transactions.length), 
        Math.min(page * offset, transactions.length)
      );
      
      return NextResponse.json(paginatedTransactions.length > 0 ? paginatedTransactions : []);
    }
    else {
      return NextResponse.json({ error: "Unsupported provider or network combination" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    let errorMessage = "Failed to fetch transactions";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request was aborted while fetching transactions. Please try using Infura provider which has no timeout.";
        statusCode = 499; // Client Closed Request
      } else if (error.message === "Request timeout") {
        errorMessage = `Request timed out while fetching transactions. ${
          provider === 'infura' ? 'Please try again.' : 'Try switching to Infura provider.'
        }`;
        statusCode = 504; // Gateway Timeout
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode },
    );
  }
}
