import { NextResponse } from "next/server"

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"

export async function GET() {
  try {
    const response = await fetch(COINGECKO_API_URL)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.ethereum || !data.ethereum.usd) {
      throw new Error("Failed to fetch ETH to USD rate")
    }

    return NextResponse.json({ rate: data.ethereum.usd })
  } catch (error) {
    console.error("Error fetching ETH to USD rate:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

