import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const moduleParam = searchParams.get("module") 
  const action = searchParams.get("action")
  
  const url = `https://api.etherscan.io/api?module=${moduleParam}&action=${action}&apikey=${process.env.ETHERSCAN_API_KEY}`
  try {
    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from Etherscan" }, { status: 500 })
  }
}
