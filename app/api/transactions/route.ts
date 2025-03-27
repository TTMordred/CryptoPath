import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "@/components/search/TransactionTable/types";

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
    
    // Implement API call based on provider and network
    let apiUrl: string;
    let apiKey: string;
    
    if (provider === "etherscan") {
      // Use Etherscan API
      apiKey = process.env.ETHERSCAN_API_KEY || "";
      
      if (network === "mainnet") {
        apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${apiKey}`;
      } else {
        return NextResponse.json(
          { error: `Network ${network} not supported with provider ${provider}` },
          { status: 400 }
        );
      }
    } else if (provider === "infura") {
      // Use Infura API implementation
      apiKey = process.env.INFURA_API_KEY || "";
      // Implement Infura API call logic here
      return NextResponse.json(
        { error: "Infura provider not yet implemented" },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: `Provider ${provider} not supported` },
        { status: 400 }
      );
    }
    
    console.log(`Fetching transactions from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('External API did not return JSON');
    }
    
    const data = await response.json();
    
    // Handle Etherscan response format
    if (provider === "etherscan") {
      if (data.status === "1" && data.result) {
        // Process and format the transactions
        const formattedTxs: Transaction[] = data.result.map((tx: any) => ({
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
          status: tx.isError === "0" ? "success" : "failed",
          input: tx.input
        }));
        
        return NextResponse.json(formattedTxs, {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else if (data.status === "0" && data.message === "No transactions found") {
        // No transactions found is a valid state, return empty array
        return NextResponse.json([], {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Other API errors
        return NextResponse.json(
          { error: data.message || "Unknown error from provider API" },
          { status: 500 }
        );
      }
    }
    
    // Fallback error for unsupported providers
    return NextResponse.json({ error: "Provider not implemented" }, { status: 501 });
    
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
