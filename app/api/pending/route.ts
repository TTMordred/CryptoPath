import { NextResponse } from "next/server"

const ETHERSCAN_API_URL = "https://api.etherscan.io/api"

export async function GET() {
  try {
    const response = await fetch(
      `${ETHERSCAN_API_URL}?module=proxy&action=eth_getBlockTransactionCountByNumber&tag=pending&apikey=${process.env.ETHERSCAN_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "1" && !data.result) {
      throw new Error(data.message || "Etherscan API returned an error")
    }

    const pendingTxCount = parseInt(data.result, 16)

    return NextResponse.json({ pendingTransactions: pendingTxCount })
  } catch (error) {
    console.error("Error fetching pending transactions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    )
  }
} 