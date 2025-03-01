import { NextResponse } from "next/server"
import { ETHERSCAN_API_KEY, ETHERSCAN_API_URL } from "@/lib/env"

export async function GET(request: Request) {
  if (!ETHERSCAN_API_KEY) {
    console.error("API key not found:", process.env)
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const modParam = searchParams.get("module") // Đổi tên biến để tránh lỗi
  const action = searchParams.get("action")

  const url = `${ETHERSCAN_API_URL}?module=${modParam}&action=${action}&apikey=${ETHERSCAN_API_KEY}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from Etherscan" },
      { status: 500 }
    )
  }
}