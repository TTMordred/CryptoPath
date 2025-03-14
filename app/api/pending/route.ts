
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const network = searchParams.get("network") || "mainnet"
  
  try {
    // Use window.location.origin as fallback when process.env.NEXT_PUBLIC_URL is undefined
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_URL || ''
    
    // For Ethereum mainnet, use Etherscan API
    if (network === 'mainnet') {
      const etherscanResponse = await fetch(
        `${baseUrl}/api/etherscan?module=proxy&action=eth_getBlockTransactionCountByNumber&tag=pending`
      );
      
      if (!etherscanResponse.ok) {
        throw new Error(`HTTP error! status: ${etherscanResponse.status}`)
      }
      
      const etherscanData = await etherscanResponse.json();
      
      if (etherscanData.error) {
        throw new Error(etherscanData.error || "Etherscan API returned an error")
      }
      
      const pendingTxCount = parseInt(etherscanData.result, 16);
      
      return NextResponse.json({ pendingTransactions: pendingTxCount, network });
    } 
    // For other networks, use Infura API
    else {
      const response = await fetch(`${baseUrl}/api/infura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "eth_getBlockTransactionCountByNumber",
          params: ["pending"],
          network
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || "Infura API returned an error")
      }

      const pendingTxCount = parseInt(data.result, 16)

      return NextResponse.json({ pendingTransactions: pendingTxCount, network })
    }
  } catch (error) {
    console.error("Error fetching pending transactions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    )
  }
}
