import { NextResponse } from "next/server"

const ETHERSCAN_API_URL = "https://api.etherscan.io/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${ETHERSCAN_API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`,
    )
    const data = await response.json()

    if (data.status !== "1") {
      throw new Error(data.message)
    }

    const transactions = data.result.map((tx: any) => ({
      id: tx.hash,
      from: tx.from,
      to: tx.to,
      value: `${(Number.parseFloat(tx.value) / 1e18).toFixed(4)} ETH`,
      timestamp: new Date(Number.parseInt(tx.timeStamp) * 1000).toISOString(),
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

