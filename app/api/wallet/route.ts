
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "mainnet"

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    // Get the base URL dynamically
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_URL || ''
    
    let balanceData, txCountData;
    
    // Use Etherscan for Ethereum Mainnet
    if (network === 'mainnet') {
      // Fetch balance using Etherscan
      const etherscanBalanceResponse = await fetch(
        `${baseUrl}/api/etherscan?module=account&action=balance&address=${address}&tag=latest`
      );
      
      balanceData = await etherscanBalanceResponse.json();
      
      if (balanceData.status !== "1") {
        throw new Error(balanceData.message || "Failed to fetch balance from Etherscan");
      }

      // Fetch transaction count using Etherscan
      const etherscanTxCountResponse = await fetch(
        `${baseUrl}/api/etherscan?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`
      );
      
      txCountData = await etherscanTxCountResponse.json();
      
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
    } 
    // Use Infura for other networks
    else {
      // Fetch balance using Infura
      const infuraBalanceResponse = await fetch(`${baseUrl}/api/infura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "eth_getBalance",
          params: [address, "latest"],
          network
        }),
      });
      
      balanceData = await infuraBalanceResponse.json();
      
      if (balanceData.error) {
        throw new Error(balanceData.error.message || "Failed to fetch balance from Infura");
      }

      // Fetch transaction count using Infura
      const infuraTxCountResponse = await fetch(`${baseUrl}/api/infura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "eth_getTransactionCount",
          params: [address, "latest"],
          network
        }),
      });
      
      txCountData = await infuraTxCountResponse.json();
      
      if (txCountData.error) {
        throw new Error(txCountData.error.message || "Failed to fetch transaction count from Infura");
      }
      
      // Determine currency symbol based on network
      const currencySymbol = network === "optimism" || network === "arbitrum" ? "ETH" : "ETH";
      
      const balance = Number.parseInt(balanceData.result, 16) / 1e18; // Convert wei to ETH
      const transactionCount = Number.parseInt(txCountData.result, 16); // Convert hex to decimal

      return NextResponse.json({
        address,
        balance: `${balance.toFixed(4)} ${currencySymbol}`,
        transactionCount,
        network
      });
    }
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}
