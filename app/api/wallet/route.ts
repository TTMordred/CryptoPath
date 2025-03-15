import { NextResponse } from "next/server"

const ETHERSCAN_API_URL = "https://api.etherscan.io/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    const balanceResponse = await fetch(
      `${ETHERSCAN_API_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`,
    )
    const balanceData = await balanceResponse.json()

    const txCountResponse = await fetch(
      `${ETHERSCAN_API_URL}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`,
    )
    const txCountData = await txCountResponse.json()

    const balance = Number.parseFloat(balanceData.result) / 1e18 // Convert wei to ETH
    const transactionCount = Number.parseInt(txCountData.result, 16) // Convert hex to decimal

    return NextResponse.json({
      address,
      balance: `${balance.toFixed(4)} ETH`,
      transactionCount,
    })
  } catch (error) {
    console.error("Error fetching wallet data:", error)
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 })
  }
}

