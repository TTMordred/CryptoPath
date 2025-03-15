import { NextResponse } from "next/server"

// Add a timeout function for fetch requests - skip timeout for Infura
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

  // Enhanced input validation
  if (!address) {
    return NextResponse.json({ 
      error: "Address is required",
      details: "Please provide an Ethereum address parameter."
    }, { status: 400 })
  }
  
  // Validate address format - return helpful error details
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
    
    // Use Etherscan for Ethereum Mainnet
    if (provider === 'etherscan' && network === 'mainnet') {
      // Fetch balance using Etherscan with timeout
      try {
        const etherscanBalanceResponse = await fetchWithTimeout(
          `${baseUrl}/api/etherscan?module=account&action=balance&address=${address}&tag=latest`,
          {}, 
          15000 // 15s timeout (increased from 10s)
        );
        
        if (!etherscanBalanceResponse.ok) {
          throw new Error(`Etherscan API responded with status: ${etherscanBalanceResponse.status}`);
        }
        
        const balanceData = await etherscanBalanceResponse.json();
        
        if (balanceData.status !== "1") {
          // Special handling for "No transactions found" which is not an actual error
          if (balanceData.message === "No transactions found") {
            // Return empty balance instead of error
            const balance = 0;
            return NextResponse.json({
              address,
              balance: `0.0000 ETH`,
              transactionCount: 0,
              network
            });
          }
          throw new Error(balanceData.message || "Failed to fetch balance from Etherscan");
        }

        // Fetch transaction count using Etherscan
        const etherscanTxCountResponse = await fetchWithTimeout(
          `${baseUrl}/api/etherscan?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`,
          {},
          15000 // 15s timeout (increased from 10s)
        );
        
        if (!etherscanTxCountResponse.ok) {
          throw new Error(`Etherscan API responded with status: ${etherscanTxCountResponse.status}`);
        }
        
        const txCountData = await etherscanTxCountResponse.json();
        
        if (txCountData.status === "0") {
          throw new Error(txCountData.message || "Failed to fetch transaction count from Etherscan");
        }
        
        const balance = Number.parseInt(balanceData.result, 10) / 1e18; // Convert wei to ETH
        const transactionCount = Number.parseInt(txCountData.result, 16); // Convert hex to decimal

        return NextResponse.json({
          address,
          balance: `${balance.toFixed(4)} ETH`,
          transactionCount,
          network
        });
      } catch (error) {
        console.error("Etherscan API error:", error);
        throw error; // Let the outer catch block handle it
      }
    } 
    // Use Infura for other networks
    else if (provider === 'infura') {
      try {
        console.log(`Fetching wallet data via Infura for ${address} on ${network}`);
        
        // Fetch balance using Infura without timeout
        const infuraBalanceResponse = await fetchWithTimeout(`${baseUrl}/api/infura`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "eth_getBalance",
            params: [address, "latest"],
            network
          }),
        }, 0, true); // No timeout for Infura, mark as Infura request
        
        if (!infuraBalanceResponse.ok) {
          throw new Error(`Infura API responded with status: ${infuraBalanceResponse.status}`);
        }
        
        const balanceData = await infuraBalanceResponse.json();
        
        if (balanceData.error) {
          throw new Error(balanceData.error.message || "Failed to fetch balance from Infura");
        }

        // Fetch transaction count using Infura without timeout
        const infuraTxCountResponse = await fetchWithTimeout(`${baseUrl}/api/infura`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "eth_getTransactionCount",
            params: [address, "latest"],
            network
          }),
        }, 0, true); // No timeout for Infura, mark as Infura request
        
        if (!infuraTxCountResponse.ok) {
          throw new Error(`Infura API responded with status: ${infuraTxCountResponse.status}`);
        }
        
        const txCountData = await infuraTxCountResponse.json();
        
        if (txCountData.error) {
          throw new Error(txCountData.error.message || "Failed to fetch transaction count from Infura");
        }
        
        // Determine currency symbol based on network
        const currencySymbol = network === "optimism" || network === "arbitrum" ? "ETH" : "ETH";
        
        // Handle case where balance is zero (return 0 instead of failing)
        const hexBalance = balanceData.result || "0x0";
        const balance = Number.parseInt(hexBalance, 16) / 1e18; // Convert wei to ETH
        const transactionCount = Number.parseInt(txCountData.result || "0x0", 16); // Convert hex to decimal

        return NextResponse.json({
          address,
          balance: `${balance.toFixed(4)} ${currencySymbol}`,
          transactionCount,
          network
        });
      } catch (error) {
        console.error("Infura API error:", error);
        throw error; // Let the outer catch block handle it
      }
    }
    else {
      return NextResponse.json({ error: "Unsupported provider or network combination" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    
    // More specific error messages based on the error type
    let errorMessage = "Failed to fetch wallet data";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = provider === 'infura' 
          ? "Unexpected abort of Infura request. Please try again."
          : "Request was aborted. Try switching to Infura provider which has no timeout.";
        statusCode = 499; // Client Closed Request
      } else if (error.message === "Request timeout") {
        errorMessage = provider === 'infura' 
          ? "Infura request timed out unexpectedly."
          : "Request timed out while fetching wallet data. Try switching to Infura.";
        statusCode = 504; // Gateway Timeout
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error while fetching wallet data";
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes("not found") || error.message.includes("No record")) {
        errorMessage = `Address not found on ${network} network`;
        statusCode = 404; // Not Found
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
